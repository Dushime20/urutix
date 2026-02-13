# Weight-Based Credit Consumption System - Implementation Guide

## Business Requirement
Deduct credits from tenant's subscription based on cargo weight loaded on their trucks.
- **Rate**: 5 credits per ton
- **Trigger**: When cargo is loaded/trip is created
- **Dynamic**: Configurable rates per tenant or plan

---

## Architecture Overview

### 1. Database Schema Enhancement

#### A. Add Pricing Configuration Table
```sql
CREATE TABLE IF NOT EXISTS credit_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'weight', 'distance', 'time', 'flat'
  unit VARCHAR(20) NOT NULL, -- 'ton', 'km', 'hour', 'trip'
  credit_cost DECIMAL(10,2) NOT NULL,
  
  -- Optional: Plan-specific pricing
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Optional: Tenant-specific pricing (overrides plan)
  tenant_id UUID REFERENCES tenants(id),
  
  -- Tiered pricing support
  min_value DECIMAL(10,2), -- e.g., 0 tons
  max_value DECIMAL(10,2), -- e.g., 10 tons
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rules apply first
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_positive_cost CHECK (credit_cost >= 0)
);

CREATE INDEX idx_pricing_rules_type ON credit_pricing_rules(rule_type, is_active);
CREATE INDEX idx_pricing_rules_plan ON credit_pricing_rules(plan_id);
CREATE INDEX idx_pricing_rules_tenant ON credit_pricing_rules(tenant_id);
```

#### B. Enhance Credit Transactions Table
Already exists, but ensure it has:
```sql
-- Add columns if not exist
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS calculation_details JSONB DEFAULT '{}';

-- This will store:
-- {
--   "weight_tons": 15.5,
--   "rate_per_ton": 5,
--   "total_cost": 77.5,
--   "rule_id": "uuid",
--   "truck_id": "uuid",
--   "load_id": "uuid"
-- }
```

---

## 2. Implementation Strategy

### Option A: Event-Driven (Recommended) ⭐

**Pros:**
- Decoupled architecture
- Easy to add more triggers
- Auditable
- Can retry failed deductions
- Non-blocking

**Cons:**
- Slightly more complex
- Requires event system

**Implementation:**
```typescript
// 1. Emit event when load is created/updated
@Injectable()
export class LoadService {
  constructor(
    private eventEmitter: EventEmitter2,
  ) {}

  async createLoad(dto: CreateLoadDto) {
    const load = await this.loadRepository.save(dto);
    
    // Emit event for credit deduction
    this.eventEmitter.emit('load.created', {
      loadId: load.id,
      tenantId: load.tenantId,
      weight: load.weight,
      truckId: load.truckId,
    });
    
    return load;
  }
}

// 2. Listen to event and deduct credits
@Injectable()
export class CreditConsumptionListener {
  constructor(
    private creditService: CreditService,
    private pricingService: PricingService,
  ) {}

  @OnEvent('load.created')
  async handleLoadCreated(payload: LoadCreatedEvent) {
    try {
      await this.deductCreditsForLoad(payload);
    } catch (error) {
      // Log error, send alert, queue for retry
      console.error('Failed to deduct credits:', error);
    }
  }

  private async deductCreditsForLoad(payload: LoadCreatedEvent) {
    // Get pricing rule
    const rule = await this.pricingService.getPricingRule(
      payload.tenantId,
      'weight'
    );
    
    // Calculate cost
    const creditCost = payload.weight * rule.creditCost;
    
    // Deduct credits
    await this.creditService.deductCredits({
      tenantId: payload.tenantId,
      amount: creditCost,
      type: 'CONSUMPTION',
      description: `Load created: ${payload.weight} tons @ ${rule.creditCost} credits/ton`,
      referenceType: 'load',
      referenceId: payload.loadId,
      calculationDetails: {
        weight_tons: payload.weight,
        rate_per_ton: rule.creditCost,
        total_cost: creditCost,
        rule_id: rule.id,
        truck_id: payload.truckId,
        load_id: payload.loadId,
      },
    });
  }
}
```

### Option B: Direct Deduction (Simpler)

**Pros:**
- Simple and straightforward
- Immediate feedback
- Less infrastructure

**Cons:**
- Tightly coupled
- Harder to audit
- Blocks the main operation if credit service fails

**Implementation:**
```typescript
@Injectable()
export class LoadService {
  constructor(
    private creditService: CreditService,
    private pricingService: PricingService,
  ) {}

  async createLoad(dto: CreateLoadDto) {
    // 1. Check if tenant has enough credits
    const creditCost = await this.calculateCreditCost(dto);
    const hasCredits = await this.creditService.hasEnoughCredits(
      dto.tenantId,
      creditCost
    );
    
    if (!hasCredits) {
      throw new BadRequestException('Insufficient credits');
    }
    
    // 2. Create load
    const load = await this.loadRepository.save(dto);
    
    // 3. Deduct credits
    await this.creditService.deductCredits({
      tenantId: dto.tenantId,
      amount: creditCost,
      type: 'CONSUMPTION',
      description: `Load created: ${dto.weight} tons`,
      referenceType: 'load',
      referenceId: load.id,
    });
    
    return load;
  }
}
```

---

## 3. Pricing Service Implementation

```typescript
// pricing.service.ts
@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(CreditPricingRule)
    private pricingRuleRepository: Repository<CreditPricingRule>,
  ) {}

  /**
   * Get applicable pricing rule for tenant
   * Priority: Tenant-specific > Plan-specific > Default
   */
  async getPricingRule(
    tenantId: string,
    ruleType: 'weight' | 'distance' | 'time' | 'flat',
    value?: number, // For tiered pricing
  ): Promise<CreditPricingRule> {
    // 1. Try tenant-specific rule
    let rule = await this.pricingRuleRepository.findOne({
      where: {
        tenantId,
        ruleType,
        isActive: true,
      },
      order: { priority: 'DESC' },
    });

    if (rule && this.isRuleApplicable(rule, value)) {
      return rule;
    }

    // 2. Try plan-specific rule
    const tenant = await this.getTenantWithPlan(tenantId);
    if (tenant?.subscription?.planId) {
      rule = await this.pricingRuleRepository.findOne({
        where: {
          planId: tenant.subscription.planId,
          ruleType,
          isActive: true,
        },
        order: { priority: 'DESC' },
      });

      if (rule && this.isRuleApplicable(rule, value)) {
        return rule;
      }
    }

    // 3. Get default rule
    rule = await this.pricingRuleRepository.findOne({
      where: {
        ruleType,
        isActive: true,
        tenantId: IsNull(),
        planId: IsNull(),
      },
      order: { priority: 'DESC' },
    });

    if (!rule) {
      throw new NotFoundException(`No pricing rule found for type: ${ruleType}`);
    }

    return rule;
  }

  /**
   * Check if rule applies to the given value (for tiered pricing)
   */
  private isRuleApplicable(rule: CreditPricingRule, value?: number): boolean {
    if (value === undefined) return true;
    
    const meetsMin = rule.minValue === null || value >= rule.minValue;
    const meetsMax = rule.maxValue === null || value <= rule.maxValue;
    
    return meetsMin && meetsMax;
  }

  /**
   * Calculate total cost with tiered pricing
   */
  async calculateCost(
    tenantId: string,
    ruleType: string,
    value: number,
  ): Promise<{ totalCost: number; breakdown: any[] }> {
    // Get all applicable rules (for tiered pricing)
    const rules = await this.getApplicableRules(tenantId, ruleType);
    
    let remainingValue = value;
    let totalCost = 0;
    const breakdown = [];

    for (const rule of rules) {
      if (remainingValue <= 0) break;

      const applicableValue = this.getApplicableValue(
        remainingValue,
        rule.minValue,
        rule.maxValue,
      );

      const cost = applicableValue * rule.creditCost;
      totalCost += cost;

      breakdown.push({
        ruleId: rule.id,
        ruleName: rule.ruleName,
        value: applicableValue,
        rate: rule.creditCost,
        cost,
      });

      remainingValue -= applicableValue;
    }

    return { totalCost, breakdown };
  }
}
```

---

## 4. Credit Service Enhancement

```typescript
// credit.service.ts
@Injectable()
export class CreditService {
  /**
   * Deduct credits with validation
   */
  async deductCredits(dto: DeductCreditsDto): Promise<CreditTransaction> {
    const account = await this.getOrCreateCreditAccount(dto.tenantId);

    // Check if enough credits
    if (account.currentBalance < dto.amount) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${dto.amount}, Available: ${account.currentBalance}`
      );
    }

    // Deduct credits
    account.currentBalance -= dto.amount;
    account.lifetimeSpent += dto.amount;
    await this.creditAccountRepository.save(account);

    // Record transaction
    const transaction = this.creditTransactionRepository.create({
      tenantId: dto.tenantId,
      creditAccountId: account.id,
      type: 'CONSUMPTION',
      amount: -dto.amount, // Negative for deduction
      balanceAfter: account.currentBalance,
      description: dto.description,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      metadata: dto.calculationDetails || {},
    });

    await this.creditTransactionRepository.save(transaction);

    // Emit event for notifications
    this.eventEmitter.emit('credits.deducted', {
      tenantId: dto.tenantId,
      amount: dto.amount,
      balanceAfter: account.currentBalance,
    });

    return transaction;
  }

  /**
   * Check if tenant has enough credits
   */
  async hasEnoughCredits(tenantId: string, amount: number): Promise<boolean> {
    const account = await this.getOrCreateCreditAccount(tenantId);
    return account.currentBalance >= amount;
  }

  /**
   * Get credit cost preview (before deduction)
   */
  async previewCreditCost(
    tenantId: string,
    ruleType: string,
    value: number,
  ): Promise<{ cost: number; breakdown: any[]; hasEnoughCredits: boolean }> {
    const { totalCost, breakdown } = await this.pricingService.calculateCost(
      tenantId,
      ruleType,
      value,
    );

    const hasEnoughCredits = await this.hasEnoughCredits(tenantId, totalCost);

    return {
      cost: totalCost,
      breakdown,
      hasEnoughCredits,
    };
  }
}
```

---

## 5. Seed Default Pricing Rules

```javascript
// seed-pricing-rules.js
const { Client } = require('pg');
require('dotenv').config();

async function seedPricingRules() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const rules = [
    {
      rule_name: 'Weight-based pricing (default)',
      rule_type: 'weight',
      unit: 'ton',
      credit_cost: 5.00,
      plan_id: null,
      tenant_id: null,
      min_value: null,
      max_value: null,
      is_active: true,
      priority: 0,
    },
    // Tiered pricing example
    {
      rule_name: 'Weight tier 1 (0-10 tons)',
      rule_type: 'weight',
      unit: 'ton',
      credit_cost: 5.00,
      plan_id: null,
      tenant_id: null,
      min_value: 0,
      max_value: 10,
      is_active: false, // Enable when needed
      priority: 1,
    },
    {
      rule_name: 'Weight tier 2 (10-50 tons)',
      rule_type: 'weight',
      unit: 'ton',
      credit_cost: 4.00, // Discount for bulk
      plan_id: null,
      tenant_id: null,
      min_value: 10,
      max_value: 50,
      is_active: false,
      priority: 1,
    },
  ];

  for (const rule of rules) {
    await client.query(
      `INSERT INTO credit_pricing_rules 
      (rule_name, rule_type, unit, credit_cost, plan_id, tenant_id, 
       min_value, max_value, is_active, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT DO NOTHING`,
      [
        rule.rule_name,
        rule.rule_type,
        rule.unit,
        rule.credit_cost,
        rule.plan_id,
        rule.tenant_id,
        rule.min_value,
        rule.max_value,
        rule.is_active,
        rule.priority,
      ]
    );
  }

  await client.end();
  console.log('✅ Pricing rules seeded');
}

seedPricingRules();
```

---

## 6. Integration Points

### When to Deduct Credits

```typescript
// Option 1: On load creation
@Post('loads')
async createLoad(@Body() dto: CreateLoadDto) {
  // Credits deducted here
}

// Option 2: On trip start
@Post('trips/:id/start')
async startTrip(@Param('id') tripId: string) {
  // Credits deducted here
}

// Option 3: On trip completion
@Post('trips/:id/complete')
async completeTrip(@Param('id') tripId: string) {
  // Credits deducted here (most accurate weight)
}
```

### Recommended: On Trip Completion
- Most accurate weight (after weighing)
- Can adjust if weight changes
- Better user experience (don't block load creation)

---

## 7. Frontend Integration

### Show Credit Cost Preview
```typescript
// Before creating load
const preview = await api.post('/credits/preview', {
  ruleType: 'weight',
  value: loadWeight,
});

// Show to user:
// "This load will cost 75 credits (15 tons × 5 credits/ton)"
// "Current balance: 500 credits"
// "Balance after: 425 credits"
```

### Low Credit Warning
```typescript
if (preview.hasEnoughCredits === false) {
  showWarning('Insufficient credits. Please purchase more credits.');
}
```

---

## 8. Advanced Features

### A. Tiered Pricing
```
0-10 tons: 5 credits/ton
10-50 tons: 4 credits/ton (20% discount)
50+ tons: 3 credits/ton (40% discount)
```

### B. Plan-Specific Pricing
```
Starter: 5 credits/ton
Professional: 4 credits/ton
Enterprise: 3 credits/ton
```

### C. Promotional Pricing
```
First 100 tons: Free
Next 500 tons: 50% off
```

### D. Time-Based Pricing
```
Peak hours: 6 credits/ton
Off-peak: 4 credits/ton
```

---

## 9. Monitoring & Alerts

### Low Credit Alerts
```typescript
@OnEvent('credits.deducted')
async checkLowBalance(payload) {
  if (payload.balanceAfter < 50) {
    await this.notificationService.send({
      tenantId: payload.tenantId,
      type: 'LOW_CREDITS',
      message: `Low credit balance: ${payload.balanceAfter} credits remaining`,
    });
  }
}
```

### Usage Analytics
```typescript
// Track credit consumption patterns
await this.analyticsService.track({
  event: 'credit_consumed',
  tenantId,
  amount,
  ruleType: 'weight',
  value: weight,
});
```

---

## 10. Testing Strategy

```typescript
describe('Weight-Based Credit Consumption', () => {
  it('should deduct 5 credits per ton', async () => {
    const load = { weight: 10, tenantId: 'test-tenant' };
    await loadService.createLoad(load);
    
    const balance = await creditService.getBalance('test-tenant');
    expect(balance).toBe(initialBalance - 50); // 10 tons × 5 credits
  });

  it('should prevent load creation with insufficient credits', async () => {
    // Set balance to 10 credits
    const load = { weight: 5, tenantId: 'test-tenant' }; // Needs 25 credits
    
    await expect(loadService.createLoad(load))
      .rejects
      .toThrow('Insufficient credits');
  });
});
```

---

## Recommendation Summary

**Best Approach:**
1. ✅ Use **Event-Driven Architecture** (Option A)
2. ✅ Deduct credits **on trip completion** (most accurate)
3. ✅ Implement **PricingService** for flexibility
4. ✅ Add **preview endpoint** for user transparency
5. ✅ Set up **low credit alerts**
6. ✅ Track everything in **credit_transactions** for audit

**Implementation Order:**
1. Create `credit_pricing_rules` table
2. Implement `PricingService`
3. Enhance `CreditService.deductCredits()`
4. Add event listener for load/trip events
5. Seed default pricing rules
6. Add frontend preview
7. Set up monitoring

This gives you a flexible, scalable, and maintainable system! 🚀
