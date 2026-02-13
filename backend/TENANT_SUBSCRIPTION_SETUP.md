# Tenant Subscription System - Setup Guide

## Quick Start

### Option 1: Run Custom Migration Script (Recommended)

This script handles existing tables gracefully and won't fail if run multiple times:

```bash
cd backend
node run-tenant-subscription-migration.js
```

### Option 2: Run TypeORM Migration

If you prefer using TypeORM's migration system:

```bash
cd backend
npm run migration:run
```

Note: If you get enum errors, use Option 1 instead.

### 2. Verify Tables Created

```bash
npm run typeorm query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('tenant_plans', 'user_subscriptions');"
```

### 3. Start Backend Server

```bash
npm run start:dev
```

### 4. Test API Endpoints

**Create a Test Plan:**
```bash
curl -X POST http://localhost:3005/api/tenant-subscriptions/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Basic Cargo Plan",
    "description": "Perfect for small cargo operations",
    "targetUser": "CARGO_OWNER",
    "price": 50000,
    "currency": "RWF",
    "duration": "MONTHLY",
    "maxShipments": 10,
    "advancedAnalytics": false,
    "prioritySupport": false
  }'
```

**Get All Plans:**
```bash
curl http://localhost:3005/api/tenant-subscriptions/plans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Subscription Overview:**
```bash
curl http://localhost:3005/api/tenant-subscriptions/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration

### 1. Add Routes to Your Router

```typescript
import SubscriptionPlans from './pages/TenantAdmin/SubscriptionPlans';
import SubscriptionDashboard from './pages/TenantAdmin/SubscriptionDashboard';

// In your router configuration:
{
  path: '/tenant-admin/subscriptions',
  element: <SubscriptionPlans />
},
{
  path: '/tenant-admin/subscription-dashboard',
  element: <SubscriptionDashboard />
}
```

### 2. Add Navigation Menu Items

```typescript
// In your Tenant Admin sidebar/menu:
{
  title: 'Subscription Plans',
  path: '/tenant-admin/subscriptions',
  icon: <SubscriptionsIcon />
},
{
  title: 'Subscription Dashboard',
  path: '/tenant-admin/subscription-dashboard',
  icon: <DashboardIcon />
}
```

## Sample Data for Testing

### Create Multiple Plans

**Basic Plan:**
```json
{
  "name": "Basic Cargo",
  "description": "For small cargo operations",
  "targetUser": "CARGO_OWNER",
  "price": 50000,
  "duration": "MONTHLY",
  "maxShipments": 10
}
```

**Pro Plan:**
```json
{
  "name": "Pro Fleet",
  "description": "For growing fleet operations",
  "targetUser": "TRUCK_OWNER",
  "price": 150000,
  "duration": "MONTHLY",
  "maxTrucks": 20,
  "maxDrivers": 30,
  "advancedAnalytics": true,
  "prioritySupport": true
}
```

**Enterprise Plan:**
```json
{
  "name": "Enterprise",
  "description": "Unlimited access for large operations",
  "targetUser": "BOTH",
  "price": 500000,
  "duration": "MONTHLY",
  "maxShipments": -1,
  "maxTrucks": -1,
  "advancedAnalytics": true,
  "prioritySupport": true,
  "apiAccess": true
}
```

## Troubleshooting

### Migration Fails
```bash
# Check if tables already exist
npm run typeorm query "SELECT * FROM tenant_plans LIMIT 1;"

# If exists, drop and recreate
npm run migration:revert
npm run migration:run
```

### Module Not Found
Ensure `TenantSubscriptionsModule` is imported in `app.module.ts`:
```typescript
import { TenantSubscriptionsModule } from './modules/tenant-subscriptions/tenant-subscriptions.module';

@Module({
  imports: [
    // ... other modules
    TenantSubscriptionsModule,
  ],
})
```

### Authentication Issues
Make sure your JWT token includes `tenantId`:
```typescript
// In your auth service
const payload = {
  userId: user.id,
  tenantId: user.tenantId, // Required!
  email: user.email,
  role: user.role
};
```

## API Response Examples

**Create Plan Response:**
```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": {
    "plan": {
      "id": "uuid-here",
      "name": "Basic Cargo",
      "price": 50000,
      "status": "ACTIVE",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Overview Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "planId": "uuid-1",
        "planName": "Basic Cargo",
        "status": "ACTIVE",
        "activeSubscribers": 15,
        "revenue": 750000
      }
    ],
    "totalRevenue": 750000,
    "totalSubscribers": 15,
    "activePlans": 1
  }
}
```

## Next Steps

1. Run the migration
2. Test API endpoints
3. Integrate frontend components
4. Add navigation menu items
5. Test plan creation and management
6. Monitor dashboard metrics

For Phase 2 (User Purchase Flow), see the main implementation document.
