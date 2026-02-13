# Subscription System - Production Deployment Guide

## 🚀 Complete Deployment Checklist

This guide covers everything needed to deploy the subscription system to production safely.

---

## Pre-Deployment Checklist

### 1. Environment Variables

Create/update `.env` files:

**Backend `.env`**:
```env
# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=urutix_production
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# API
PORT=3000
NODE_ENV=production

# Payment Gateway (when ready)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@urutix.com

# SMS Service (optional)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# URLs
FRONTEND_URL=https://app.urutix.com
BACKEND_URL=https://api.urutix.com
```

**Frontend `.env`**:
```env
VITE_API_URL=https://api.urutix.com
VITE_APP_NAME=Urutix
VITE_STRIPE_PUBLIC_KEY=pk_live_xxx
```

### 2. Database Backup

```bash
# Backup current database
pg_dump -U postgres -d urutix > backup_before_subscription_$(date +%Y%m%d).sql

# Test restore (on staging)
psql -U postgres -d urutix_staging < backup_before_subscription_20260213.sql
```

### 3. Code Review

- [ ] All TypeScript types are correct
- [ ] No console.log statements in production code
- [ ] Error handling is comprehensive
- [ ] API endpoints have proper authentication
- [ ] Database queries are optimized
- [ ] Frontend has loading states
- [ ] Mobile responsive design tested

---

## Deployment Steps

### Step 1: Database Migration (5 minutes)

```bash
# Connect to production database
psql -U postgres -h your-db-host -d urutix_production

# Run migration
\i migrations/006_subscription_credit_system.sql

# Verify tables created
\dt subscription*
\dt credit*

# Check indexes
\di subscription*
\di credit*
```

**Expected Output**:
```
subscription_plans
tenant_subscriptions
credit_accounts
credit_transactions
subscription_payments
credit_packages
feature_credit_costs
```

### Step 2: Seed Data (3 minutes)

```bash
cd backend

# Seed subscription plans
node seed-subscription-plans.js

# Seed credit packages
node seed-credit-packages.js

# Seed feature costs
node seed-feature-credit-costs.js

# Verify seeding
psql -U postgres -h your-db-host -d urutix_production -c "
SELECT 
  (SELECT COUNT(*) FROM subscription_plans) as plans,
  (SELECT COUNT(*) FROM credit_packages) as packages,
  (SELECT COUNT(*) FROM feature_credit_costs) as features;
"
```

**Expected Output**:
```
 plans | packages | features 
-------+----------+----------
     3 |        4 |       26
```

### Step 3: Backend Deployment (10 minutes)

```bash
# Build backend
cd backend
npm run build

# Run tests
npm run test

# Start with PM2
pm2 start dist/main.js --name urutix-api

# Check logs
pm2 logs urutix-api

# Save PM2 configuration
pm2 save
pm2 startup
```

**Verify Backend**:
```bash
# Health check
curl https://api.urutix.com/health

# Check subscription plans endpoint
curl https://api.urutix.com/api/subscriptions/plans

# Expected: JSON with 3 plans
```

### Step 4: Frontend Deployment (5 minutes)

```bash
# Build frontend
cd frontend
npm run build

# Deploy to hosting (example: Vercel)
vercel --prod

# Or deploy to your server
rsync -avz dist/ user@server:/var/www/urutix/
```

**Verify Frontend**:
- Visit: https://app.urutix.com/subscription/plans
- Check: Plans load correctly
- Test: Mobile responsive design
- Verify: All images and assets load

### Step 5: Scheduled Jobs Setup (3 minutes)

Scheduled jobs run automatically with NestJS @Cron decorators, but verify they're working:

```bash
# Check PM2 logs for scheduled job execution
pm2 logs urutix-api | grep "Subscription"

# You should see logs like:
# "Starting subscription renewal process..."
# "Starting trial expiration process..."
# "Starting credit expiration process..."
```

**Manual trigger for testing** (optional):
```typescript
// Add temporary endpoint for testing
@Get('admin/trigger-renewal-job')
async triggerRenewalJob() {
  await this.schedulerService.processSubscriptionRenewals();
  return { success: true };
}
```

---

## Post-Deployment Verification

### 1. Smoke Tests (10 minutes)

**Test Subscription Creation**:
```bash
# Login as test user
curl -X POST https://api.urutix.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Save token
TOKEN="your-jwt-token"

# Create subscription
curl -X POST https://api.urutix.com/api/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "starter",
    "billingCycle": "monthly",
    "startTrial": true,
    "trialDays": 14
  }'

# Expected: 201 Created with subscription object
```

**Test Credit Balance**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.urutix.com/api/credits/balance

# Expected: Balance with 500 credits (Starter plan)
```

**Test Credit Consumption**:
```bash
curl -X POST https://api.urutix.com/api/credits/consume \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5,
    "featureCode": "LOAD_POST",
    "referenceType": "test",
    "referenceId": "test-123"
  }'

# Expected: 200 OK with transaction object
# Balance should be 495
```

**Test Credit Purchase**:
```bash
curl -X POST https://api.urutix.com/api/credits/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "100-credits-package-id",
    "paymentMethodId": "pm_test"
  }'

# Expected: 200 OK with purchase confirmation
# Balance should be 595
```

### 2. Frontend Tests

**Manual Testing Checklist**:
- [ ] Visit `/subscription/plans`
- [ ] Plans display correctly with pricing
- [ ] Monthly/Yearly toggle works
- [ ] Click "Start Trial" creates subscription
- [ ] Redirects to `/billing` after signup
- [ ] Billing dashboard shows correct data
- [ ] Credit balance displays
- [ ] Usage statistics load
- [ ] Transaction history shows entries
- [ ] Navigate to `/billing/purchase-credits`
- [ ] Credit packages display
- [ ] Purchase flow works
- [ ] Balance updates after purchase
- [ ] Mobile responsive on all pages
- [ ] No console errors

### 3. Database Integrity Check

```sql
-- Check for orphaned records
SELECT COUNT(*) FROM tenant_subscriptions 
WHERE tenant_id NOT IN (SELECT id FROM tenants);
-- Expected: 0

-- Check credit account consistency
SELECT 
  ca.tenant_id,
  ca.current_balance,
  ca.subscription_credits + ca.purchased_credits + ca.bonus_credits as calculated_balance
FROM credit_accounts ca
WHERE ca.current_balance != (ca.subscription_credits + ca.purchased_credits + ca.bonus_credits);
-- Expected: 0 rows (all balances match)

-- Check for negative balances
SELECT * FROM credit_accounts WHERE current_balance < 0;
-- Expected: 0 rows

-- Verify transaction log integrity
SELECT 
  tenant_id,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent
FROM credit_transactions
GROUP BY tenant_id;
-- Verify totals match credit_accounts.lifetime_earned and lifetime_spent
```

---

## Monitoring Setup

### 1. Application Monitoring

**Add Health Check Endpoint**:
```typescript
// health.controller.ts
@Get('health/subscription')
async checkSubscriptionHealth() {
  const checks = {
    database: false,
    scheduledJobs: false,
    creditSystem: false,
  };

  try {
    // Check database
    await this.subscriptionPlanRepository.count();
    checks.database = true;

    // Check credit system
    const testBalance = await this.creditService.getCreditBalance('test-tenant');
    checks.creditSystem = true;

    // Check scheduled jobs (verify last run time)
    checks.scheduledJobs = true; // Implement based on your needs

    return {
      status: 'healthy',
      checks,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      checks,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}
```

### 2. Logging

**Add Structured Logging**:
```typescript
// Use Winston or similar
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(SubscriptionService.name);

async createSubscription(dto: CreateSubscriptionDto) {
  this.logger.log({
    action: 'subscription_created',
    tenantId: dto.tenantId,
    planId: dto.planId,
    billingCycle: dto.billingCycle,
    timestamp: new Date().toISOString(),
  });
  
  // ... rest of method
}
```

### 3. Alerts

**Set up alerts for**:
- Failed subscription renewals
- Credit system errors
- Scheduled job failures
- Database connection issues
- High API error rates

**Example with email alerts**:
```typescript
async processSubscriptionRenewals() {
  try {
    // ... renewal logic
  } catch (error) {
    this.logger.error('Subscription renewal failed', error.stack);
    
    // Send alert email
    await this.emailService.sendAlert({
      to: 'ops@urutix.com',
      subject: 'ALERT: Subscription Renewal Failed',
      body: `Error: ${error.message}\nStack: ${error.stack}`,
    });
  }
}
```

---

## Performance Optimization

### 1. Database Indexes

Already created in migration, but verify:
```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (tablename LIKE 'subscription%' OR tablename LIKE 'credit%')
ORDER BY idx_scan DESC;
```

### 2. Query Optimization

**Add query result caching**:
```typescript
// Cache subscription plans (they rarely change)
@Cacheable('subscription-plans', 3600) // 1 hour
async getAvailablePlans(): Promise<SubscriptionPlan[]> {
  return this.subscriptionPlanRepository.find({
    where: { isActive: true },
    order: { displayOrder: 'ASC' },
  });
}

// Cache credit balance (short TTL)
@Cacheable('credit-balance-{tenantId}', 60) // 1 minute
async getCreditBalance(tenantId: string): Promise<CreditBalanceResponse> {
  // ... implementation
}
```

### 3. API Rate Limiting

```typescript
// Add rate limiting to prevent abuse
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('api/credits')
export class CreditController {
  // 10 requests per minute per user
  @Throttle(10, 60)
  @Post('consume')
  async consumeCredits() {
    // ... implementation
  }
}
```

---

## Security Hardening

### 1. API Security

```typescript
// Add request validation
import { IsNumber, IsString, Min } from 'class-validator';

export class ConsumeCreditsDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  featureCode: string;

  @IsString()
  @IsOptional()
  referenceType?: string;
}

// Add CORS configuration
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});

// Add helmet for security headers
import helmet from 'helmet';
app.use(helmet());
```

### 2. Database Security

```sql
-- Create read-only user for reporting
CREATE USER urutix_readonly WITH PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE urutix_production TO urutix_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO urutix_readonly;

-- Revoke unnecessary permissions
REVOKE ALL ON subscription_plans FROM PUBLIC;
GRANT SELECT ON subscription_plans TO urutix_app_user;
```

### 3. Audit Logging

```typescript
// Log all credit adjustments
async adjustCredits(tenantId: string, amount: number, reason: string, adminId: string) {
  // ... adjustment logic
  
  // Audit log
  await this.auditLogRepository.save({
    action: 'CREDIT_ADJUSTMENT',
    performedBy: adminId,
    targetTenant: tenantId,
    changes: { amount, reason },
    ipAddress: req.ip,
    timestamp: new Date(),
  });
}
```

---

## Rollback Plan

If something goes wrong:

### 1. Database Rollback

```bash
# Restore from backup
psql -U postgres -d urutix_production < backup_before_subscription_20260213.sql

# Or drop new tables
psql -U postgres -d urutix_production -c "
DROP TABLE IF EXISTS subscription_payments CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS credit_accounts CASCADE;
DROP TABLE IF EXISTS tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS feature_credit_costs CASCADE;
DROP TABLE IF EXISTS credit_packages CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
"
```

### 2. Code Rollback

```bash
# Revert to previous version
git revert HEAD
git push origin main

# Redeploy
pm2 restart urutix-api
```

### 3. Frontend Rollback

```bash
# Revert deployment
vercel rollback

# Or restore previous build
rsync -avz backup/dist/ user@server:/var/www/urutix/
```

---

## Maintenance Tasks

### Daily
- [ ] Check scheduled job logs
- [ ] Monitor error rates
- [ ] Review failed payments
- [ ] Check credit balance anomalies

### Weekly
- [ ] Review subscription metrics
- [ ] Analyze usage patterns
- [ ] Check for low balance accounts
- [ ] Review transaction logs

### Monthly
- [ ] Database performance review
- [ ] Security audit
- [ ] Backup verification
- [ ] Cost analysis

---

## Troubleshooting

### Issue: Scheduled Jobs Not Running

**Check**:
```bash
# Verify cron is enabled
pm2 logs urutix-api | grep "Cron"

# Check server timezone
date
timedatectl

# Manually trigger job
curl -X POST https://api.urutix.com/admin/trigger-job \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Issue: Credit Balance Mismatch

**Fix**:
```sql
-- Recalculate balance from transactions
UPDATE credit_accounts ca
SET current_balance = (
  SELECT COALESCE(SUM(amount), 0)
  FROM credit_transactions ct
  WHERE ct.tenant_id = ca.tenant_id
)
WHERE ca.tenant_id = 'problematic-tenant-id';
```

### Issue: Failed Subscription Renewal

**Check**:
```sql
-- Find failed renewals
SELECT * FROM tenant_subscriptions
WHERE status = 'active'
  AND current_period_end < NOW()
  AND auto_renew = true;

-- Manually renew
-- Use admin endpoint or run service method
```

---

## Success Metrics

Track these KPIs:

### Technical Metrics
- API response time < 100ms (p95)
- Error rate < 0.1%
- Scheduled job success rate > 99%
- Database query time < 50ms (p95)

### Business Metrics
- Trial to paid conversion rate
- Monthly churn rate
- Average revenue per user (ARPU)
- Credit consumption rate
- Upgrade rate

### User Experience Metrics
- Page load time < 2s
- Time to interactive < 1s
- Mobile usability score > 90
- User satisfaction score

---

## Support Contacts

**Technical Issues**:
- DevOps Team: devops@urutix.com
- Backend Team: backend@urutix.com
- Frontend Team: frontend@urutix.com

**Business Issues**:
- Finance Team: finance@urutix.com
- Customer Success: support@urutix.com

---

## Deployment Complete! ✅

Your subscription system is now live in production!

**Next Steps**:
1. Monitor for 24 hours
2. Collect user feedback
3. Iterate on improvements
4. Add payment integration
5. Implement advanced features

**Congratulations!** 🎉
