# Subscription System - Complete Testing Guide

## 🧪 Comprehensive Testing Checklist

This guide covers all testing scenarios for the subscription and credit management system.

---

## Test Environment Setup

### 1. Create Test Database

```bash
# Create test database
createdb urutix_test

# Run migrations
psql -U postgres -d urutix_test -f migrations/006_subscription_credit_system.sql

# Seed test data
node seed-subscription-plans.js
node seed-credit-packages.js
node seed-feature-credit-costs.js
```

### 2. Create Test Users

```sql
-- Create test tenants
INSERT INTO tenants (id, name, subdomain, status) VALUES
('test-tenant-1', 'Test Company 1', 'test1', 'ACTIVE'),
('test-tenant-2', 'Test Company 2', 'test2', 'ACTIVE'),
('test-tenant-3', 'Test Company 3', 'test3', 'PENDING_ACTIVATION');

-- Create test users
INSERT INTO users (id, email, password, tenant_id, role) VALUES
('test-user-1', 'test1@example.com', 'hashed-password', 'test-tenant-1', 'ADMIN'),
('test-user-2', 'test2@example.com', 'hashed-password', 'test-tenant-2', 'ADMIN'),
('test-user-3', 'test3@example.com', 'hashed-password', 'test-tenant-3', 'ADMIN');
```

---

## Unit Tests

### Backend Services

#### SubscriptionService Tests

```typescript
// subscription.service.spec.ts
describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let subscriptionRepo: Repository<TenantSubscription>;
  let planRepo: Repository<SubscriptionPlan>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(TenantSubscription),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useClass: Repository,
        },
        {
          provide: CreditService,
          useValue: mockCreditService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  describe('createSubscription', () => {
    it('should create subscription with trial', async () => {
      const dto = {
        tenantId: 'test-tenant-1',
        planId: 'starter',
        billingCycle: 'monthly',
        startTrial: true,
        trialDays: 14,
      };

      const result = await service.createSubscription(dto);

      expect(result.status).toBe('trial');
      expect(result.trialEnd).toBeDefined();
      expect(result.planId).toBe('starter');
    });

    it('should throw error if tenant already has subscription', async () => {
      // Setup existing subscription
      jest.spyOn(service, 'getCurrentSubscription').mockResolvedValue(mockSubscription);

      await expect(
        service.createSubscription(mockDto)
      ).rejects.toThrow('Tenant already has an active subscription');
    });
  });

  describe('upgradeSubscription', () => {
    it('should upgrade and grant prorated credits', async () => {
      const result = await service.upgradeSubscription('sub-id', {
        newPlanId: 'professional',
        immediate: true,
      });

      expect(result.planId).toBe('professional');
      expect(mockCreditService.grantBonusCredits).toHaveBeenCalled();
    });

    it('should throw error for downgrade attempt', async () => {
      await expect(
        service.upgradeSubscription('sub-id', {
          newPlanId: 'starter', // Lower tier
        })
      ).rejects.toThrow('New plan must be a higher tier');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel immediately when requested', async () => {
      const result = await service.cancelSubscription('sub-id', {
        immediate: true,
        reason: 'Test cancellation',
      });

      expect(result.status).toBe('cancelled');
      expect(result.cancelledAt).toBeDefined();
    });

    it('should schedule cancellation for period end', async () => {
      const result = await service.cancelSubscription('sub-id', {
        immediate: false,
        reason: 'Test cancellation',
      });

      expect(result.autoRenew).toBe(false);
      expect(result.metadata.scheduledCancellation).toBeDefined();
    });
  });
});
```

#### CreditService Tests

```typescript
// credit.service.spec.ts
describe('CreditService', () => {
  describe('consumeCredits', () => {
    it('should consume credits and update balance', async () => {
      const dto = {
        tenantId: 'test-tenant-1',
        amount: 5,
        featureCode: 'LOAD_POST',
      };

      const result = await service.consumeCredits(dto);

      expect(result.amount).toBe(-5);
      expect(result.type).toBe('CONSUMPTION');
    });

    it('should throw error for insufficient credits', async () => {
      const dto = {
        tenantId: 'test-tenant-1',
        amount: 1000, // More than available
        featureCode: 'LOAD_POST',
      };

      await expect(service.consumeCredits(dto)).rejects.toThrow(
        'Insufficient credits'
      );
    });

    it('should consume from correct bucket order', async () => {
      // Setup account with all credit types
      const account = {
        bonusCredits: 10,
        subscriptionCredits: 20,
        purchasedCredits: 30,
      };

      await service.consumeCredits({
        tenantId: 'test-tenant-1',
        amount: 15,
        featureCode: 'TEST',
      });

      // Should consume bonus first (10), then subscription (5)
      const updatedAccount = await service.getCreditBalance('test-tenant-1');
      expect(updatedAccount.bonusCredits).toBe(0);
      expect(updatedAccount.subscriptionCredits).toBe(15);
      expect(updatedAccount.purchasedCredits).toBe(30);
    });
  });

  describe('expireCredits', () => {
    it('should expire old subscription credits', async () => {
      const expiredCount = await service.expireCredits();

      expect(expiredCount).toBeGreaterThan(0);
    });

    it('should not expire purchased credits within 12 months', async () => {
      // Test that purchased credits don't expire prematurely
    });
  });
});
```

---

## Integration Tests

### API Endpoint Tests

```typescript
// subscription.e2e-spec.ts
describe('Subscription API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login and get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test1@example.com', password: 'password' });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/subscriptions/plans', () => {
    it('should return all active plans', () => {
      return request(app.getHttpServer())
        .get('/api/subscriptions/plans')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(3);
          expect(res.body.data[0]).toHaveProperty('name');
          expect(res.body.data[0]).toHaveProperty('priceMonthly');
        });
    });
  });

  describe('POST /api/subscriptions', () => {
    it('should create subscription with trial', () => {
      return request(app.getHttpServer())
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planId: 'starter',
          billingCycle: 'monthly',
          startTrial: true,
          trialDays: 14,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.status).toBe('trial');
          expect(res.body.data.trialEnd).toBeDefined();
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/subscriptions')
        .send({
          planId: 'starter',
          billingCycle: 'monthly',
        })
        .expect(401);
    });
  });

  describe('GET /api/credits/balance', () => {
    it('should return credit balance', () => {
      return request(app.getHttpServer())
        .get('/api/credits/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('currentBalance');
          expect(res.body.data).toHaveProperty('subscriptionCredits');
        });
    });
  });

  describe('POST /api/credits/consume', () => {
    it('should consume credits successfully', () => {
      return request(app.getHttpServer())
        .post('/api/credits/consume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 5,
          featureCode: 'LOAD_POST',
          referenceType: 'test',
          referenceId: 'test-123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.amount).toBe(-5);
        });
    });

    it('should return 400 for insufficient credits', async () => {
      // First, consume all credits
      // Then try to consume more
      return request(app.getHttpServer())
        .post('/api/credits/consume')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 10000,
          featureCode: 'TEST',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Insufficient credits');
        });
    });
  });
});
```

---

## Manual Testing Scenarios

### Scenario 1: New Tenant Signup Flow

**Steps**:
1. Navigate to `/subscription/plans`
2. Toggle between Monthly/Yearly billing
3. Verify pricing updates correctly
4. Click "Start 14-Day Free Trial" on Starter plan
5. Verify redirect to `/billing`
6. Check credit balance shows 500 credits
7. Verify trial banner displays with countdown
8. Check subscription details show "trial" status

**Expected Results**:
- ✅ Plans display with correct pricing
- ✅ Trial subscription created
- ✅ Credits granted immediately
- ✅ Trial banner shows correct days remaining
- ✅ No payment required

### Scenario 2: Credit Consumption

**Steps**:
1. Login as tenant with active subscription
2. Navigate to feature that consumes credits (e.g., post load)
3. Perform action
4. Check credit balance decreases
5. View transaction history
6. Verify transaction logged

**Expected Results**:
- ✅ Credits deducted correctly
- ✅ Balance updates immediately
- ✅ Transaction appears in history
- ✅ Correct feature code logged

### Scenario 3: Low Balance Warning

**Steps**:
1. Consume credits until balance < 100
2. Refresh billing dashboard
3. Verify warning banner appears
4. Click "Buy Credits" button
5. Verify redirect to purchase page

**Expected Results**:
- ✅ Warning banner displays
- ✅ Shows current balance
- ✅ Suggests upgrade or purchase
- ✅ Navigation works correctly

### Scenario 4: Credit Purchase

**Steps**:
1. Navigate to `/billing/purchase-credits`
2. View available packages
3. Select 500 credits package
4. Click "Purchase Now"
5. Verify success message
6. Check balance updated
7. View transaction history

**Expected Results**:
- ✅ Packages display with pricing
- ✅ Discounts shown correctly
- ✅ Purchase completes successfully
- ✅ Balance increases by 500
- ✅ Transaction logged as "PURCHASE"

### Scenario 5: Subscription Upgrade

**Steps**:
1. Login with Starter plan subscription
2. Navigate to `/billing`
3. Click "Upgrade Plan"
4. Select Professional plan
5. Confirm upgrade
6. Verify prorated credits granted
7. Check plan updated

**Expected Results**:
- ✅ Upgrade completes immediately
- ✅ Prorated credits added
- ✅ Plan shows "Professional"
- ✅ Monthly credits increase to 2,000

### Scenario 6: Subscription Cancellation

**Steps**:
1. Navigate to `/billing`
2. Click "Cancel Subscription"
3. Select "Cancel at period end"
4. Provide cancellation reason
5. Confirm cancellation
6. Verify scheduled cancellation message
7. Check access continues until period end

**Expected Results**:
- ✅ Cancellation scheduled
- ✅ Access continues
- ✅ Auto-renew disabled
- ✅ Cancellation date shown

### Scenario 7: Trial Expiration

**Setup**: Create subscription with trial ending today

**Steps**:
1. Wait for scheduled job to run (or trigger manually)
2. Check subscription status
3. Verify conversion or suspension

**Expected Results**:
- ✅ With payment method: Converts to paid
- ✅ Without payment method: Suspends
- ✅ Email notification sent
- ✅ Status updated correctly

### Scenario 8: Credit Expiry

**Setup**: Create subscription credits expiring today

**Steps**:
1. Wait for scheduled job to run
2. Check credit balance
3. Verify expired credits deducted
4. Check transaction history

**Expected Results**:
- ✅ Expired credits removed
- ✅ Balance updated
- ✅ Expiry transaction logged
- ✅ Only subscription credits expired

---

## Performance Tests

### Load Testing

```bash
# Install k6
brew install k6

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
};

export default function () {
  // Test get plans
  let plansRes = http.get('https://api.urutix.com/api/subscriptions/plans');
  check(plansRes, {
    'plans status is 200': (r) => r.status === 200,
    'plans response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);

  // Test get balance (with auth)
  let balanceRes = http.get('https://api.urutix.com/api/credits/balance', {
    headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN}` },
  });
  check(balanceRes, {
    'balance status is 200': (r) => r.status === 200,
    'balance response time < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);
}
EOF

# Run load test
k6 run load-test.js
```

**Expected Results**:
- ✅ 95th percentile response time < 200ms
- ✅ Error rate < 0.1%
- ✅ Throughput > 100 req/s
- ✅ No database connection errors

### Stress Testing

```bash
# Stress test with 1000 concurrent users
k6 run --vus 1000 --duration 30s load-test.js
```

**Monitor**:
- CPU usage
- Memory usage
- Database connections
- Response times
- Error rates

---

## Security Tests

### 1. Authentication Tests

```bash
# Test without auth token
curl -X GET https://api.urutix.com/api/credits/balance
# Expected: 401 Unauthorized

# Test with invalid token
curl -X GET https://api.urutix.com/api/credits/balance \
  -H "Authorization: Bearer invalid-token"
# Expected: 401 Unauthorized

# Test with expired token
curl -X GET https://api.urutix.com/api/credits/balance \
  -H "Authorization: Bearer expired-token"
# Expected: 401 Unauthorized
```

### 2. Authorization Tests

```bash
# Test accessing another tenant's data
curl -X GET https://api.urutix.com/api/subscriptions/current \
  -H "Authorization: Bearer tenant1-token"
# Should only return tenant1's subscription

# Test admin-only endpoints
curl -X POST https://api.urutix.com/api/credits/adjust \
  -H "Authorization: Bearer non-admin-token"
# Expected: 403 Forbidden
```

### 3. Input Validation Tests

```bash
# Test negative credit amount
curl -X POST https://api.urutix.com/api/credits/consume \
  -H "Authorization: Bearer token" \
  -d '{"amount": -5, "featureCode": "TEST"}'
# Expected: 400 Bad Request

# Test SQL injection
curl -X GET "https://api.urutix.com/api/subscriptions/plans?id=1' OR '1'='1"
# Expected: Sanitized, no SQL injection

# Test XSS
curl -X POST https://api.urutix.com/api/subscriptions \
  -d '{"planId": "<script>alert(1)</script>"}'
# Expected: Sanitized, no XSS
```

---

## Regression Tests

Run after any code changes:

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm run test
npm run test:e2e

# Integration tests
npm run test:integration
```

---

## Monitoring Tests

### 1. Health Check

```bash
curl https://api.urutix.com/health/subscription
```

**Expected Response**:
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "scheduledJobs": true,
    "creditSystem": true
  },
  "timestamp": "2026-02-13T10:00:00Z"
}
```

### 2. Scheduled Jobs

```bash
# Check logs for job execution
pm2 logs urutix-api | grep "Subscription renewal"
pm2 logs urutix-api | grep "Trial expiration"
pm2 logs urutix-api | grep "Credit expiry"
```

**Expected**: Jobs run at scheduled times without errors

---

## Test Data Cleanup

After testing:

```sql
-- Delete test subscriptions
DELETE FROM tenant_subscriptions WHERE tenant_id LIKE 'test-%';

-- Delete test credit accounts
DELETE FROM credit_accounts WHERE tenant_id LIKE 'test-%';

-- Delete test transactions
DELETE FROM credit_transactions WHERE tenant_id LIKE 'test-%';

-- Delete test tenants
DELETE FROM tenants WHERE id LIKE 'test-%';
```

---

## Test Coverage Goals

### Backend
- Unit tests: > 80% coverage
- Integration tests: > 70% coverage
- E2E tests: Critical paths covered

### Frontend
- Component tests: > 70% coverage
- Integration tests: > 60% coverage
- E2E tests: User flows covered

---

## Continuous Testing

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Subscription System

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npm run migration:run
      
      - name: Run unit tests
        run: npm run test
      
      - name: Run e2e tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Testing Complete! ✅

All tests passing means your subscription system is production-ready!

**Test Summary**:
- ✅ Unit tests
- ✅ Integration tests
- ✅ E2E tests
- ✅ Performance tests
- ✅ Security tests
- ✅ Manual scenarios

**Ready to deploy!** 🚀
