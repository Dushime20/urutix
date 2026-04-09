# Subscription Creation Guide

## Overview
This document explains the logic and data structure for creating subscriptions in the Urutix platform.

## Endpoint

### Create Subscription
```
POST /api/subscriptions
```

**Authentication Required:** Yes (JWT Bearer Token)

**Authorization:** User must be authenticated. The `tenantId` is automatically extracted from the JWT token.

## Request Body Structure

### CreateSubscriptionDto

```typescript
{
  tenantId: string;        // Auto-filled from JWT token (user's tenant)
  planId: string;          // ID or slug of the subscription plan
  billingCycle: string;    // "monthly" or "yearly"
  paymentMethodId?: string; // Optional: Payment method reference
  startTrial?: boolean;    // Optional: Start with trial period (default: false)
  trialDays?: number;      // Optional: Trial duration in days (default: 14)
  userId?: string;         // Optional: For user-specific subscriptions
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenantId` | string (UUID) | Yes* | Tenant identifier (*auto-filled from JWT) |
| `planId` | string (UUID or slug) | Yes | Subscription plan ID or slug (e.g., "starter", "professional", "enterprise") |
| `billingCycle` | enum | Yes | Billing frequency: `"monthly"` or `"yearly"` |
| `paymentMethodId` | string | No | Reference to payment method (Stripe, PayPal, etc.) |
| `startTrial` | boolean | No | Whether to start with a trial period (default: false) |
| `trialDays` | number | No | Number of trial days (default: 14, only used if startTrial is true) |
| `userId` | string (UUID) | No | For user-specific subscriptions (e.g., partner subscriptions) |

## Business Logic

### 1. Validation
- **Existing Subscription Check**: System checks if tenant/user already has an active subscription
- **Plan Validation**: Verifies that the specified plan exists and is active
- **Error Response**: Returns `400 Bad Request` if tenant already has an active subscription

### 2. Subscription Status Determination

#### Trial Subscription
If `startTrial: true`:
- Status: `TRIAL`
- Trial Start: Current timestamp
- Trial End: Current timestamp + `trialDays` (default 14 days)
- Current Period End: Same as Trial End
- Auto Renew: `true`

#### Active Subscription
If `startTrial: false` or not provided:
- Status: `ACTIVE`
- Current Period Start: Current timestamp
- Current Period End: 
  - Monthly: Current date + 1 month
  - Yearly: Current date + 1 year
- Next Payment Date: Same as Current Period End
- Auto Renew: `true`

### 3. Credit Allocation
Upon subscription creation, the system automatically:
1. Creates or retrieves the tenant's credit account
2. Grants the plan's included credits to the account
3. Records the credit transaction with reference to the subscription

### 4. Database Records Created

#### TenantSubscription Record
```typescript
{
  id: string;                    // Auto-generated UUID
  tenantId: string;              // From request
  userId: string | null;         // From request or null
  planId: string;                // From request
  status: SubscriptionStatus;    // TRIAL or ACTIVE
  billingCycle: BillingCycle;    // monthly or yearly
  currentPeriodStart: Date;      // Subscription start date
  currentPeriodEnd: Date;        // End of current billing period
  trialStart: Date | null;       // Trial start (if applicable)
  trialEnd: Date | null;         // Trial end (if applicable)
  paymentMethodId: string | null; // Payment method reference
  autoRenew: boolean;            // true by default
  nextPaymentDate: Date;         // Next billing date
  createdAt: Date;               // Auto-generated
  updatedAt: Date;               // Auto-generated
}
```

#### Credit Transaction Record
```typescript
{
  id: string;                    // Auto-generated UUID
  creditAccountId: string;       // Tenant's credit account
  amount: number;                // Plan's included credits
  type: 'subscription_grant';    // Transaction type
  description: string;           // E.g., "Monthly credits for Professional Plan"
  referenceId: string;           // Subscription ID
  balanceAfter: number;          // New credit balance
  createdAt: Date;               // Auto-generated
}
```

## Example Requests

### Example 1: Create Monthly Subscription with Trial
```json
POST /api/subscriptions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "planId": "professional",
  "billingCycle": "monthly",
  "startTrial": true,
  "trialDays": 14
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "id": "sub_123abc...",
    "tenantId": "tenant_456def...",
    "planId": "plan_789ghi...",
    "status": "TRIAL",
    "billingCycle": "monthly",
    "currentPeriodStart": "2026-04-09T10:00:00.000Z",
    "currentPeriodEnd": "2026-04-23T10:00:00.000Z",
    "trialStart": "2026-04-09T10:00:00.000Z",
    "trialEnd": "2026-04-23T10:00:00.000Z",
    "autoRenew": true,
    "plan": {
      "id": "plan_789ghi...",
      "name": "Professional",
      "slug": "professional",
      "priceMonthly": 99.00,
      "priceYearly": 990.00,
      "includedCredits": 10000
    }
  }
}
```

### Example 2: Create Yearly Subscription (No Trial)
```json
POST /api/subscriptions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "planId": "enterprise",
  "billingCycle": "yearly",
  "paymentMethodId": "pm_stripe_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "id": "sub_xyz789...",
    "tenantId": "tenant_456def...",
    "planId": "plan_enterprise...",
    "status": "ACTIVE",
    "billingCycle": "yearly",
    "currentPeriodStart": "2026-04-09T10:00:00.000Z",
    "currentPeriodEnd": "2027-04-09T10:00:00.000Z",
    "trialStart": null,
    "trialEnd": null,
    "autoRenew": true,
    "nextPaymentDate": "2027-04-09T10:00:00.000Z",
    "plan": {
      "id": "plan_enterprise...",
      "name": "Enterprise",
      "slug": "enterprise",
      "priceMonthly": 299.00,
      "priceYearly": 2990.00,
      "includedCredits": 50000
    }
  }
}
```

### Example 3: Create User-Specific Subscription (Partner)
```json
POST /api/subscriptions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "planId": "starter",
  "billingCycle": "monthly",
  "userId": "user_partner_123",
  "startTrial": true
}
```

## Available Subscription Plans

### Typical Plan Structure
```typescript
{
  id: string;
  name: string;              // Display name (e.g., "Professional")
  slug: string;              // URL-friendly identifier (e.g., "professional")
  description: string;       // Plan description
  priceMonthly: number;      // Monthly price in USD
  priceYearly: number;       // Yearly price in USD
  includedCredits: number;   // Credits included per billing cycle
  features: object;          // Plan features (JSON)
  limits: object;            // Usage limits (JSON)
  isActive: boolean;         // Whether plan is available
  displayOrder: number;      // Sort order for display
}
```

### Common Plans
1. **Starter**: Basic features, lower credit allocation
2. **Professional**: Advanced features, moderate credit allocation
3. **Enterprise**: Full features, high credit allocation

## Error Responses

### 400 Bad Request - Already Has Subscription
```json
{
  "statusCode": 400,
  "message": "Tenant already has an active subscription",
  "error": "Bad Request"
}
```

### 404 Not Found - Invalid Plan
```json
{
  "statusCode": 404,
  "message": "Subscription plan not found: invalid-plan-id",
  "error": "Not Found"
}
```

### 401 Unauthorized - No JWT Token
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Related Endpoints

### Get Available Plans
```
GET /api/subscriptions/plans
```
Returns list of all active subscription plans.

### Get Current Subscription
```
GET /api/subscriptions/current
```
Returns the authenticated tenant's current active subscription.

### Cancel Subscription (Admin)
```
POST /api/admin/subscriptions/:subscriptionId/cancel
```
Admin endpoint to cancel a tenant's subscription.

### Reactivate Subscription (Admin)
```
POST /api/admin/subscriptions/:subscriptionId/reactivate
```
Admin endpoint to reactivate a cancelled subscription.

## Subscription Lifecycle

```
┌─────────────┐
│   TRIAL     │ ──(trial ends)──> ACTIVE
└─────────────┘                      │
                                     │
                                     ├──(cancel)──> CANCELLED
                                     │
                                     ├──(payment fails)──> SUSPENDED
                                     │
                                     └──(period ends, no renewal)──> EXPIRED
```

## Credit Management

### Automatic Credit Grants
- Credits are automatically granted when subscription is created
- Credits are granted at the start of each billing period (renewal)
- Credit amount = `plan.includedCredits`

### Credit Transaction Types
- `subscription_grant`: Credits from subscription plan
- `purchase`: Credits purchased separately
- `bonus`: Bonus credits granted by admin
- `usage`: Credits consumed for services

## Notes

1. **Tenant ID Override**: The `tenantId` in the request body is always overridden with the authenticated user's tenant ID for security.

2. **Auto-Renewal**: All subscriptions are created with `autoRenew: true` by default. Users can disable this later.

3. **Trial to Active Transition**: When a trial period ends, the subscription status automatically changes to `ACTIVE` and billing begins.

4. **Credit Rollover**: Unused credits may or may not roll over depending on plan configuration (check `plan.features.creditRollover`).

5. **Prorated Billing**: When upgrading/downgrading mid-cycle, the system calculates prorated charges.

## Files Reference

### Backend
- **Service**: `backend/src/services/subscription.service.ts`
- **Controller**: `backend/src/modules/subscription/subscription.controller.ts`
- **Entity**: `backend/src/entities/tenant-subscription.entity.ts`
- **Plan Entity**: `backend/src/entities/subscription-plan.entity.ts`

### Frontend
- **Admin Page**: `frontend/src/pages/admin/TenantSubscriptions.tsx`
- **API Service**: `frontend/src/services/api.ts`

## Testing

### Test Subscription Creation
```bash
# 1. Get JWT token by logging in
POST http://localhost:3005/api/auth/login
Body: { "email": "user@example.com", "password": "password" }

# 2. Create subscription
POST http://localhost:3005/api/subscriptions
Headers: Authorization: Bearer <token>
Body: {
  "planId": "professional",
  "billingCycle": "monthly",
  "startTrial": true
}
```

## Status
✅ Endpoint implemented and functional
✅ Credit allocation working
✅ Trial period logic implemented
✅ Admin management endpoints available
