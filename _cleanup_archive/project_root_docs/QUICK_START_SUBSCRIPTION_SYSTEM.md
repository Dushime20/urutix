# Quick Start - Subscription System

## 🚀 Get Started in 3 Steps

### Step 1: Run Migrations
```bash
cd backend
npm run migration:run
```

### Step 2: Seed Data
```bash
npm run seed:subscriptions
```

### Step 3: Start Servers
```bash
# Terminal 1 - Backend
npm run start:dev

# Terminal 2 - Frontend
cd ../frontend
npm run dev
```

---

## 📍 Access Points

### User Pages
- **Plans**: http://localhost:5173/subscription/plans
- **Billing**: http://localhost:5173/admin/billing
- **Purchase Credits**: http://localhost:5173/admin/billing/purchase-credits

### Admin Pages
- **All Subscriptions**: http://localhost:5173/admin/subscriptions
- **Tenant Management**: http://localhost:5173/admin/tenants

---

## 🎯 What You Get

### 3 Subscription Plans
- **Starter**: $29.99/mo, 100 credits
- **Professional**: $99.99/mo, 500 credits ⭐
- **Enterprise**: $299.99/mo, 2000 credits

### 4 Credit Packages
- **Starter Pack**: 100 credits, $9.99
- **Value Pack**: 500 credits, $44.99 (10% off) ⭐
- **Pro Pack**: 1000 credits, $79.99 (20% off)
- **Enterprise Pack**: 5000 credits, $349.99 (30% off)

### 10 Feature Costs
- Create Route: 5 credits
- Optimize Route: 10 credits
- Match Load: 3 credits
- Create Load: 2 credits
- Real-time Tracking: 1 credit/hour
- Analytics Report: 15 credits
- SMS Notification: 1 credit
- Push Notification: 0.5 credits
- AI Prediction: 20 credits
- Export Data: 5 credits

---

## 🔧 NPM Scripts

### Seeding
```bash
npm run seed:subscriptions          # All subscription data
npm run seed:subscription-plans     # Plans only
npm run seed:credit-packages        # Packages only
npm run seed:feature-costs          # Feature costs only
```

### Development
```bash
npm run start:dev                   # Start backend
npm run build                       # Build backend
npm run migration:run               # Run migrations
```

---

## 🧪 Quick Test

### Test Backend APIs
```bash
# Get subscription plans
curl http://localhost:3002/api/subscriptions/plans

# Get credit packages
curl http://localhost:3002/api/credits/packages
```

### Test Frontend
1. Open http://localhost:5173/subscription/plans
2. Verify 3 plans display
3. Open http://localhost:5173/admin/billing
4. Verify billing dashboard loads

---

## 📊 Verify Database

```bash
# Connect to database
psql $DATABASE_URL

# Check seeded data
SELECT COUNT(*) FROM subscription_plans;      -- Should be 3
SELECT COUNT(*) FROM credit_packages;         -- Should be 4
SELECT COUNT(*) FROM feature_credit_costs;    -- Should be 10
```

---

## 🆘 Troubleshooting

### "relation does not exist"
**Fix**: Run migrations first
```bash
npm run migration:run
```

### "Connection refused"
**Fix**: Check DATABASE_URL in .env
```env
DATABASE_URL=postgresql://user:password@localhost:5432/urutix
```

### "Module not found"
**Fix**: Install dependencies
```bash
npm install
```

---

## 📚 Full Documentation

For detailed information, see:
- `SUBSCRIPTION_SYSTEM_COMPLETE.md` - Complete implementation guide
- `SUBSCRIPTION_SEED_GUIDE.md` - Detailed seeding instructions
- `SUBSCRIPTION_COMPONENTS_ENHANCED.md` - UI component details

---

## ✅ Success Checklist

- [ ] Migrations run successfully
- [ ] Seed script completes without errors
- [ ] Backend starts on port 3002
- [ ] Frontend starts on port 5173
- [ ] Plans page displays 3 plans
- [ ] Billing page loads correctly
- [ ] Admin can view all subscriptions

---

**That's it!** Your subscription system is ready to use. 🎉
