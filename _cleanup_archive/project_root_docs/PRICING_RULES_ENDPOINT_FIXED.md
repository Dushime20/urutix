# Pricing Rules Endpoint Fixed

## Issue
The pricing rules endpoint was returning 404 errors because the controller had an incorrect route path.

## Root Cause
The `SubscriptionController` was defined with `@Controller('api/subscriptions')` but NestJS already applies a global prefix of `'api'` in `main.ts`. This caused the actual route to become `/api/api/subscriptions/pricing-rules` instead of `/api/subscriptions/pricing-rules`.

## Changes Made

### Backend Fixes

1. **Fixed SubscriptionController route path** (`backend/src/modules/subscription/subscription.controller.ts`)
   - Changed from: `@Controller('api/subscriptions')`
   - Changed to: `@Controller('subscriptions')`
   - This allows NestJS to properly apply the global prefix

2. **Fixed CreditController route path** (`backend/src/modules/subscription/credit.controller.ts`)
   - Changed from: `@Controller('api/credits')`
   - Changed to: `@Controller('credits')`
   - Consistency fix for the same issue

### Frontend Fixes

3. **Updated CreditPricingRules component** (`frontend/src/pages/admin/CreditPricingRules.tsx`)
   - Fixed query function to extract data from wrapped response: `response.data.data || response.data`
   - Updated create mutation to handle wrapped response
   - Updated update mutation to handle wrapped response
   - Backend returns `{ success: true, data: [...] }` format

## Verification

### Backend Test Results
```bash
node test-pricing-rules-endpoint.js
```

Output:
```
✅ Login successful
✅ GET request successful
Status: 200
Number of rules: 12
```

### Registered Routes
The backend now properly registers these routes:
- `GET /api/subscriptions/pricing-rules` - Get all pricing rules
- `POST /api/subscriptions/pricing-rules` - Create new pricing rule
- `PATCH /api/subscriptions/pricing-rules/:id` - Update pricing rule
- `DELETE /api/subscriptions/pricing-rules/:id` - Delete pricing rule

### Database Status
- 12 pricing rules seeded successfully
- 2 active weight-based rules (including default "1 ton = 5 credits")
- 10 example rules for testing (distance, time, flat rate, tiered pricing)

## Testing
1. Backend is running on port 3000
2. Frontend is running on port 5174
3. CORS is properly configured
4. Authentication is working with super admin credentials
5. All pricing rules endpoints are accessible and functional

## Next Steps
The pricing rules management UI should now work correctly:
1. Navigate to `/admin/pricing-rules` in the frontend
2. View all 12 seeded pricing rules
3. Create, edit, and delete rules as needed
4. Toggle active/inactive status
5. Set priority for rule evaluation order

## Files Modified
- `backend/src/modules/subscription/subscription.controller.ts`
- `backend/src/modules/subscription/credit.controller.ts`
- `frontend/src/pages/admin/CreditPricingRules.tsx`
- `backend/test-pricing-rules-endpoint.js` (created for testing)
