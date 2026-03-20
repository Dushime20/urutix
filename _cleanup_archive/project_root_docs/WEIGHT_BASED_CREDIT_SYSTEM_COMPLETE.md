# Weight-Based Credit Consumption System - Implementation Complete ✅

## Overview
Successfully implemented a flexible, database-driven credit consumption system that deducts credits from tenant subscriptions based on cargo weight loaded on their trucks.

**Default Rate**: 5 credits per ton of cargo

---

## What Was Implemented

### 1. Database Schema ✅

#### A. Credit Pricing Rules Table
Created `credit_pricing_rules` table with support for:
- Multiple pricing types (weight, distance, time, flat)
- Plan-specific pricing
- Tenant-specific pricing (highest priority)
- Tiered pricing (volume discounts)
- Priority-based rule selection

**Columns:**
- `id`: UUID primary key
- `rule_name`: Descriptive name
- `rule_type`: 'weight', 'distance', 'time', 'flat'
- `unit`: 'ton', 'km', 'hour', 'trip'
- `credit_cost`: Cost per unit
- `plan_id`: Optional plan-specific pricing
- `tenant_id`: Optional tenant-specific pricing
- `min_value`, `max_value`: For tiered pricing
- `is_active`: Enable/disable rules
- `priority`: Rule precedence

#### B. Enhanced Credit Transactions
Added `calculation_details` JSONB column to store:
```json
{
  "weight_tons": 15.5,
  "rate_per_ton": 5,
  "total_cost": 77.5,
  "rule_id": "uuid",
  "truck_id": "uuid",
  "load_id": "uuid"
}
```

---

### 2. Backend Services ✅

#### A. PricingService (`pricing.service.ts`)
**Purpose**: Manage and apply pricing rules

**Key Methods:**
- `getPricingRule(tenantId, ruleType, value?)`: Get applicable rule with priority logic
  - Priority: Tenant-specific > Plan-specific > Default
- `calculateCost(tenantId, ruleType, value)`: Calculate total cost with tiered pricing
- `getAllRules()`: Admin - list all rules
- `createRule(data)`: Admin - create new rule
- `updateRule(id, data)`: Admin - update rule
- `deleteRule(id)`: Admin - delete rule

**Features:**
- Automatic rule selection based on tenant/plan
- Tiered pricing support (volume discounts)
- Flexible rule configuration

#### B. Enhanced CreditService (`credit.service.ts`)
**New Methods:**
- `deductCredits(dto)`: Deduct credits with validation and audit trail
  - Checks sufficient balance
  - Records transaction with calculation details
  - Returns transaction record

**DTO Structure:**
```typescript
{
  tenantId: string;
  amount: number;
  description: string;
  referenceType?: string;  // 'load', 'trip', etc.
  referenceId?: string;    // Load/Trip ID
  calculationDetails?: {   // Audit trail
    weight_tons: number;
    rate_per_ton: number;
    total_cost: number;
    rule_id: string;
    truck_id: string;
    load_id: string;
  };
}
```

---

### 3. Entity Registration ✅

#### A. CreditPricingRule Entity
Created TypeORM entity with:
- Enum for pricing types
- Relations to SubscriptionPlan and Tenant
- Indexes for performance
- Validation constraints

#### B. Database Configuration
Registered `CreditPricingRule` in:
- `database.config.ts` (both main and test configs)
- `subscription.module.ts` (TypeORM feature)

---

### 4. Default Pricing Rules ✅

Seeded 6 pricing rules:

#### Active Rules:
1. **Weight-based pricing (default)** ✅
   - Type: weight
   - Rate: 5 credits/ton
   - Applies to: All tenants (no plan/tenant restriction)

#### Inactive Rules (Ready to Enable):
2. **Weight tier 1 (0-10 tons)**
   - Rate: 5 credits/ton
   - Range: 0-10 tons

3. **Weight tier 2 (10-50 tons)**
   - Rate: 4 credits/ton (20% discount)
   - Range: 10-50 tons

4. **Weight tier 3 (50+ tons)**
   - Rate: 3 credits/ton (40% discount)
   - Range: 50+ tons

5. **Distance-based pricing**
   - Rate: 0.5 credits/km
   - For future use

6. **Flat rate per trip**
   - Rate: 10 credits/trip
   - For future use

---

### 5. Migration Scripts ✅

#### A. Migration Script (`run-pricing-migration.js`)
- Reads and executes `007_credit_pricing_rules.sql`
- Verifies table creation
- Shows table structure
- Provides next steps

#### B. Seed Script (`seed-pricing-rules.js`)
- Seeds 6 default pricing rules
- Uses `ON CONFLICT DO NOTHING` for safe re-runs
- Shows summary of active rules
- Provides configuration guidance

#### C. NPM Scripts Added
```json
{
  "migrate:pricing": "node run-pricing-migration.js",
  "seed:pricing-rules": "node seed-pricing-rules.js"
}
```

---

## How It Works

### Rule Priority Logic
```
1. Tenant-specific rule (highest priority)
   ↓ (if not found)
2. Plan-specific rule
   ↓ (if not found)
3. Default rule (no tenant/plan restriction)
```

### Example Scenarios

#### Scenario 1: Simple Weight-Based Deduction
```typescript
// Load created: 15 tons
const rule = await pricingService.getPricingRule(tenantId, 'weight');
// Returns: { creditCost: 5, unit: 'ton' }

const cost = 15 * 5; // 75 credits

await creditService.deductCredits({
  tenantId,
  amount: 75,
  description: 'Load created: 15 tons @ 5 credits/ton',
  referenceType: 'load',
  referenceId: loadId,
  calculationDetails: {
    weight_tons: 15,
    rate_per_ton: 5,
    total_cost: 75,
    rule_id: rule.id,
  },
});
```

#### Scenario 2: Tiered Pricing (When Enabled)
```typescript
// Load: 60 tons with tiered pricing enabled
// Tier 1 (0-10): 10 tons × 5 = 50 credits
// Tier 2 (10-50): 40 tons × 4 = 160 credits
// Tier 3 (50+): 10 tons × 3 = 30 credits
// Total: 240 credits (instead of 300 with flat rate)

const { totalCost, breakdown } = await pricingService.calculateCost(
  tenantId,
  'weight',
  60
);
// totalCost: 240
// breakdown: [
//   { ruleName: 'Tier 1', value: 10, rate: 5, cost: 50 },
//   { ruleName: 'Tier 2', value: 40, rate: 4, cost: 160 },
//   { ruleName: 'Tier 3', value: 10, rate: 3, cost: 30 }
// ]
```

---

## Integration Points

### When to Deduct Credits

**Recommended: On Trip Completion** ⭐
```typescript
@Post('trips/:id/complete')
async completeTrip(@Param('id') tripId: string) {
  const trip = await this.tripService.findOne(tripId);
  const load = await this.loadService.findOne(trip.loadId);
  
  // Get pricing rule
  const rule = await this.pricingService.getPricingRule(
    load.tenantId,
    'weight'
  );
  
  // Calculate cost
  const creditCost = load.weight * rule.creditCost;
  
  // Deduct credits
  await this.creditService.deductCredits({
    tenantId: load.tenantId,
    amount: creditCost,
    description: `Trip completed: ${load.weight} tons @ ${rule.creditCost} credits/ton`,
    referenceType: 'trip',
    referenceId: tripId,
    calculationDetails: {
      weight_tons: load.weight,
      rate_per_ton: rule.creditCost,
      total_cost: creditCost,
      rule_id: rule.id,
      truck_id: trip.truckId,
      load_id: load.id,
    },
  });
  
  return trip;
}
```

**Why Trip Completion?**
- Most accurate weight (after actual weighing)
- Can adjust if weight changes
- Better UX (doesn't block load creation)
- Allows for weight verification

---

## Next Steps

### Phase 1: Event-Driven Integration (Recommended)

#### 1. Install Event Emitter
```bash
npm install @nestjs/event-emitter
```

#### 2. Create Event Listener
```typescript
// credit-consumption.listener.ts
@Injectable()
export class CreditConsumptionListener {
  constructor(
    private creditService: CreditService,
    private pricingService: PricingService,
  ) {}

  @OnEvent('trip.completed')
  async handleTripCompleted(payload: TripCompletedEvent) {
    try {
      const rule = await this.pricingService.getPricingRule(
        payload.tenantId,
        'weight'
      );
      
      const creditCost = payload.weight * rule.creditCost;
      
      await this.creditService.deductCredits({
        tenantId: payload.tenantId,
        amount: creditCost,
        description: `Trip completed: ${payload.weight} tons`,
        referenceType: 'trip',
        referenceId: payload.tripId,
        calculationDetails: {
          weight_tons: payload.weight,
          rate_per_ton: rule.creditCost,
          total_cost: creditCost,
          rule_id: rule.id,
          truck_id: payload.truckId,
          load_id: payload.loadId,
        },
      });
    } catch (error) {
      console.error('Failed to deduct credits:', error);
      // Queue for retry or send alert
    }
  }
}
```

#### 3. Emit Events
```typescript
// In TripService
async completeTrip(tripId: string) {
  const trip = await this.tripRepository.findOne(tripId);
  trip.status = 'completed';
  await this.tripRepository.save(trip);
  
  // Emit event
  this.eventEmitter.emit('trip.completed', {
    tripId: trip.id,
    tenantId: trip.tenantId,
    weight: trip.load.weight,
    truckId: trip.truckId,
    loadId: trip.loadId,
  });
  
  return trip;
}
```

### Phase 2: Frontend Integration

#### 1. Credit Cost Preview API
```typescript
// credit.controller.ts
@Post('preview')
async previewCost(@Body() dto: PreviewCostDto) {
  const { totalCost, breakdown } = await this.pricingService.calculateCost(
    dto.tenantId,
    dto.ruleType,
    dto.value
  );
  
  const balance = await this.creditService.getCreditBalance(dto.tenantId);
  
  return {
    cost: totalCost,
    breakdown,
    currentBalance: balance,
    balanceAfter: balance - totalCost,
    hasEnoughCredits: balance >= totalCost,
  };
}
```

#### 2. Frontend Preview Component
```typescript
// Before creating load
const preview = await api.post('/credits/preview', {
  tenantId: currentTenant.id,
  ruleType: 'weight',
  value: loadWeight,
});

// Show to user:
// "This load will cost 75 credits (15 tons × 5 credits/ton)"
// "Current balance: 500 credits"
// "Balance after: 425 credits"

if (!preview.hasEnoughCredits) {
  showWarning('Insufficient credits. Please purchase more credits.');
}
```

### Phase 3: Advanced Features

#### 1. Enable Tiered Pricing
```sql
-- Enable tiered pricing for volume discounts
UPDATE credit_pricing_rules 
SET is_active = true 
WHERE rule_name LIKE 'Weight tier%';

-- Disable flat rate
UPDATE credit_pricing_rules 
SET is_active = false 
WHERE rule_name = 'Weight-based pricing (default)';
```

#### 2. Create Plan-Specific Pricing
```typescript
// Give Enterprise plan better rates
await pricingService.createRule({
  ruleName: 'Enterprise Weight Pricing',
  ruleType: 'weight',
  unit: 'ton',
  creditCost: 3.00, // 40% discount
  planId: enterprisePlanId,
  isActive: true,
  priority: 10,
});
```

#### 3. Create Tenant-Specific Pricing
```typescript
// VIP customer gets special rate
await pricingService.createRule({
  ruleName: 'VIP Customer Rate',
  ruleType: 'weight',
  unit: 'ton',
  creditCost: 2.50, // 50% discount
  tenantId: vipTenantId,
  isActive: true,
  priority: 100, // Highest priority
});
```

#### 4. Low Credit Alerts
```typescript
@OnEvent('credits.deducted')
async checkLowBalance(payload) {
  if (payload.balanceAfter < 50) {
    await this.notificationService.send({
      tenantId: payload.tenantId,
      type: 'LOW_CREDITS',
      title: 'Low Credit Balance',
      message: `You have ${payload.balanceAfter} credits remaining. Purchase more to continue operations.`,
      priority: 'high',
    });
  }
}
```

---

## Testing

### Manual Testing

#### 1. Check Pricing Rules
```sql
SELECT * FROM credit_pricing_rules WHERE is_active = true;
```

#### 2. Test Credit Deduction
```typescript
// In your test or controller
const result = await creditService.deductCredits({
  tenantId: 'test-tenant-id',
  amount: 75,
  description: 'Test load: 15 tons',
  referenceType: 'load',
  referenceId: 'test-load-id',
  calculationDetails: {
    weight_tons: 15,
    rate_per_ton: 5,
    total_cost: 75,
  },
});

console.log('Transaction:', result);
```

#### 3. Check Transaction History
```sql
SELECT * FROM credit_transactions 
WHERE tenant_id = 'test-tenant-id' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Automated Testing
```typescript
describe('Weight-Based Credit Consumption', () => {
  it('should deduct 5 credits per ton', async () => {
    const initialBalance = 1000;
    const weight = 10;
    const expectedCost = 50;
    
    await creditService.deductCredits({
      tenantId: testTenant.id,
      amount: expectedCost,
      description: `Test: ${weight} tons`,
    });
    
    const balance = await creditService.getCreditBalance(testTenant.id);
    expect(balance).toBe(initialBalance - expectedCost);
  });
  
  it('should prevent deduction with insufficient credits', async () => {
    // Set balance to 10 credits
    const weight = 5; // Needs 25 credits
    
    await expect(
      creditService.deductCredits({
        tenantId: testTenant.id,
        amount: 25,
        description: 'Test',
      })
    ).rejects.toThrow('Insufficient credits');
  });
});
```

---

## Admin Management

### View All Pricing Rules
```typescript
GET /api/admin/pricing-rules
```

### Create Custom Rule
```typescript
POST /api/admin/pricing-rules
{
  "ruleName": "Custom Rate",
  "ruleType": "weight",
  "unit": "ton",
  "creditCost": 4.00,
  "tenantId": "specific-tenant-id", // Optional
  "planId": "specific-plan-id",     // Optional
  "isActive": true,
  "priority": 50
}
```

### Update Rule
```typescript
PATCH /api/admin/pricing-rules/:id
{
  "creditCost": 4.50,
  "isActive": true
}
```

### Delete Rule
```typescript
DELETE /api/admin/pricing-rules/:id
```

---

## Files Created/Modified

### New Files:
1. `backend/src/entities/credit-pricing-rule.entity.ts` - Pricing rule entity
2. `backend/src/services/pricing.service.ts` - Pricing logic service
3. `backend/migrations/007_credit_pricing_rules.sql` - Database migration
4. `backend/seed-pricing-rules.js` - Seed default rules
5. `backend/run-pricing-migration.js` - Migration runner
6. `WEIGHT_BASED_CREDIT_CONSUMPTION_GUIDE.md` - Comprehensive guide
7. `WEIGHT_BASED_CREDIT_SYSTEM_COMPLETE.md` - This document

### Modified Files:
1. `backend/src/services/credit.service.ts` - Added deductCredits method
2. `backend/src/config/database.config.ts` - Registered CreditPricingRule
3. `backend/src/modules/subscription/subscription.module.ts` - Added PricingService
4. `backend/package.json` - Added migration and seed scripts

---

## Database State

### Tables:
- ✅ `credit_pricing_rules` - Created with 6 seeded rules
- ✅ `credit_transactions` - Enhanced with calculation_details column

### Active Rules:
- ✅ 1 active rule: Weight-based pricing (5 credits/ton)
- ⏸️ 5 inactive rules ready for activation

### Indexes:
- ✅ `idx_pricing_rules_type` - For rule type queries
- ✅ `idx_pricing_rules_plan` - For plan-specific rules
- ✅ `idx_pricing_rules_tenant` - For tenant-specific rules
- ✅ `idx_pricing_rules_priority` - For priority ordering

---

## Architecture Benefits

### 1. Flexibility
- Database-driven rules (no code changes needed)
- Support for multiple pricing models
- Easy to add new pricing types

### 2. Scalability
- Tenant-specific pricing for VIP customers
- Plan-specific pricing for different tiers
- Tiered pricing for volume discounts

### 3. Auditability
- Every deduction recorded in credit_transactions
- Calculation details stored in JSONB
- Full audit trail for compliance

### 4. Maintainability
- Clean separation of concerns
- PricingService handles all pricing logic
- CreditService handles all credit operations
- Easy to test and debug

---

## Summary

The weight-based credit consumption system is now fully implemented and ready for integration. The system provides:

✅ Flexible, database-driven pricing rules  
✅ Support for tenant and plan-specific pricing  
✅ Tiered pricing for volume discounts  
✅ Complete audit trail  
✅ Easy admin management  
✅ Scalable architecture  

**Current State**: Default rule active (5 credits/ton)  
**Next Step**: Integrate with trip completion events  
**Timeline**: Ready for production use after event integration

The foundation is solid and extensible for future enhancements! 🚀
