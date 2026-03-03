# Subscription Seed Guide

## Overview
This guide explains how to seed subscription-related data into your database.

## Quick Start

### Run All Seeds at Once
```bash
cd backend
node seed-all-subscriptions.js
```

This will seed:
- ✅ 3 Subscription Plans (Starter, Professional, Enterprise)
- ✅ 4 Credit Packages (Starter, Value, Pro, Enterprise)
- ✅ 10 Feature Credit Costs (various features)

## Individual Seed Scripts

If you want to run seeds individually:

### 1. Subscription Plans
```bash
node seed-subscription-plans.js
```

Seeds 3 plans:
- **Starter**: $29.99/mo, 100 credits
- **Professional**: $99.99/mo, 500 credits (Popular)
- **Enterprise**: $299.99/mo, 2000 credits

### 2. Credit Packages
```bash
node seed-credit-packages.js
```

Seeds 4 packages:
- **Starter Pack**: 100 credits for $9.99
- **Value Pack**: 500 credits for $44.99 (10% discount, Popular)
- **Pro Pack**: 1000 credits for $79.99 (20% discount)
- **Enterprise Pack**: 5000 credits for $349.99 (30% discount)

### 3. Feature Credit Costs
```bash
node seed-feature-credit-costs.js
```

Seeds 10 feature costs:
- route:create - 5 credits
- route:optimize - 10 credits
- load:match - 3 credits
- load:create - 2 credits
- tracking:realtime - 1 credit/hour
- analytics:report - 15 credits
- notification:sms - 1 credit
- notification:push - 0.5 credits
- ai:prediction - 20 credits
- export:data - 5 credits

## What Gets Seeded

### Subscription Plans Table
```sql
subscription_plans
├── id (uuid)
├── name (Starter, Professional, Enterprise)
├── slug (starter, professional, enterprise)
├── description
├── price_monthly
├── price_yearly
├── included_credits
├── features (JSON array)
├── display_order
├── is_active
├── is_popular
└── created_at, updated_at
```

### Credit Packages Table
```sql
credit_packages
├── id (uuid)
├── name
├── slug
├── credits
├── price
├── discount_percentage
├── description
├── is_active
├── is_popular
├── display_order
└── created_at, updated_at
```

### Feature Credit Costs Table
```sql
feature_credit_costs
├── id (uuid)
├── feature_code (unique)
├── feature_name
├── credit_cost
├── description
├── is_active
└── created_at, updated_at
```

## Verification

After seeding, verify the data:

```bash
# Check subscription plans
psql $DATABASE_URL -c "SELECT name, price_monthly, included_credits FROM subscription_plans;"

# Check credit packages
psql $DATABASE_URL -c "SELECT name, credits, price FROM credit_packages;"

# Check feature costs
psql $DATABASE_URL -c "SELECT feature_code, credit_cost FROM feature_credit_costs;"
```

Or use the seed script output which shows a summary.

## Re-running Seeds

The seed scripts use `ON CONFLICT ... DO UPDATE`, so you can safely re-run them:
- Existing records will be updated
- No duplicate entries will be created
- Safe to run multiple times

## Customization

### Modify Plans
Edit `seed-subscription-plans.js` or `seed-all-subscriptions.js`:
```javascript
{
  name: 'Custom Plan',
  slug: 'custom-plan',
  price_monthly: 49.99,
  price_yearly: 499.99,
  included_credits: 250,
  features: JSON.stringify([
    'Feature 1',
    'Feature 2',
  ]),
}
```

### Modify Credit Packages
Edit the packages array in the seed script:
```javascript
{
  name: 'Custom Pack',
  slug: 'custom-pack',
  credits: 750,
  price: 59.99,
  discount_percentage: 15,
}
```

### Modify Feature Costs
Edit the features array:
```javascript
{
  feature_code: 'custom:feature',
  feature_name: 'Custom Feature',
  credit_cost: 8,
  description: 'Cost for custom feature',
}
```

## Troubleshooting

### Error: "relation does not exist"
**Problem**: Tables haven't been created yet

**Solution**: Run migrations first
```bash
npm run migration:run
# or
node run-all-migrations.js
```

### Error: "Connection refused"
**Problem**: Database not running or wrong connection string

**Solution**: 
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Test connection: `psql $DATABASE_URL`

### Error: "duplicate key value"
**Problem**: Trying to insert duplicate slugs

**Solution**: The scripts handle this automatically with ON CONFLICT. If you see this error, check your custom modifications.

## Environment Variables

Required in `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## Production Deployment

### Option 1: Run During Deployment
Add to your deployment script:
```bash
npm run build
node seed-all-subscriptions.js
npm run start:prod
```

### Option 2: One-time Setup
Run once after initial deployment:
```bash
ssh your-server
cd /path/to/app/backend
node seed-all-subscriptions.js
```

### Option 3: Database Migration
Convert seeds to a migration file for version control.

## Testing

After seeding, test the subscription system:

### 1. Check API Endpoints
```bash
# Get subscription plans
curl http://localhost:3002/api/subscriptions/plans

# Get credit packages
curl http://localhost:3002/api/credits/packages
```

### 2. Test in Frontend
1. Navigate to `/subscription/plans`
2. Verify all 3 plans display
3. Navigate to `/billing/purchase-credits`
4. Verify all 4 packages display

### 3. Verify Database
```sql
-- Count records
SELECT 
  (SELECT COUNT(*) FROM subscription_plans) as plans,
  (SELECT COUNT(*) FROM credit_packages) as packages,
  (SELECT COUNT(*) FROM feature_credit_costs) as features;
```

## Summary

**Quick Command**:
```bash
cd backend && node seed-all-subscriptions.js
```

**Expected Output**:
```
🌱 Starting Subscription System Seed...
✅ Connected to database

📦 Seeding Subscription Plans...
  ✅ Starter plan seeded
  ✅ Professional plan seeded
  ✅ Enterprise plan seeded

💳 Seeding Credit Packages...
  ✅ Starter Pack seeded
  ✅ Value Pack seeded
  ✅ Pro Pack seeded
  ✅ Enterprise Pack seeded

⚙️  Seeding Feature Credit Costs...
  ✅ Create Route (5 credits) seeded
  ✅ Optimize Route (10 credits) seeded
  ... (8 more)

✨ Subscription seed completed successfully!

📊 Summary:
  - Subscription Plans: 3
  - Credit Packages: 4
  - Feature Costs: 10
```

---

**Ready to seed!** Run the command and your subscription system will be populated with data. 🌱
