# Credit-Based Bidding System Implementation

## Overview
This document describes the implementation of the credit-based bidding system with dual deduction, where both tenant admin and truck owner lose credits when a bid is accepted.

## Implementation Date
April 10, 2026

## Credit Flow Architecture

### Participants
1. **Tenant Admin**: Controls the tenant and manages truck owners
2. **Truck Owner**: Places bids on cargo loads
3. **Cargo Owner**: Creates loads and accepts bids

### Credit Deduction Model

When a cargo owner accepts a bid, credits are deducted from TWO accounts:

1. **Tenant Admin Account**
   - Deduction: `Cargo Weight (tons) × creditsPerTonTenant`
   - Example: 5 tons × 200 credits/ton = 1,000 credits

2. **Truck Owner Account**
   - Deduction: `Cargo Weight (tons) × creditsPerTonTruckOwner`
   - Example: 5 tons × 100 credits/ton = 500 credits

### Credit Rates Source
Credit rates are defined in the `subscription_plans` table:
- `credits_per_ton_tenant`: Rate for tenant admin (e.g., 200 credits/ton)
- `credits_per_ton_truck_owner`: Rate for truck owner (e.g., 100 credits/ton)

## Implementation Details

### 1. New Method: `consumeCreditsForBid` (CreditService)

**Location**: `backend/src/services/credit.service.ts`

**Purpose**: Performs dual credit deduction when a bid is accepted

**Parameters**:
```typescript
{
  tenantId: string;
  tenantAdminUserId: string;
  truckOwnerUserId: string;
  cargoWeightTons: number;
  creditsPerTonTenant: number;
  creditsPerTonTruckOwner: number;
  bidId: string;
  loadId: string;
  loadTitle: string;
}
```

**Process**:
1. Calculate credits needed for both parties
2. Validate both accounts have sufficient credits
3. Deduct from tenant admin account
4. Deduct from truck owner account
5. Create transaction records for both deductions
6. Return both transaction objects

**Error Handling**:
- Throws `BadRequestException` if either party has insufficient credits
- Transaction is atomic - if one fails, neither is deducted

### 2. Updated Method: `createBid` (BiddingService)

**Location**: `backend/src/modules/bidding/bidding.service.ts`

**New Validation**: Before allowing a bid to be placed, the system now:

1. Retrieves truck owner's active subscription plan
2. Calculates credits needed: `(cargo weight in tons) × creditsPerTonTruckOwner`
3. Checks if truck owner has sufficient credits
4. Throws error with detailed message if insufficient

**Error Message Example**:
```
Insufficient credits to place bid. 
Required: 500 credits (5.00 tons × 100 credits/ton). 
Available: 300 credits. 
Please purchase more credits to continue.
```

### 3. Updated Method: `acceptBid` (BiddingService)

**Location**: `backend/src/modules/bidding/bidding.service.ts`

**New Credit Deduction Logic**: When a cargo owner accepts a bid:

1. Find tenant admin user for the tenant
2. Retrieve tenant admin's active subscription plan
3. Retrieve truck owner's active subscription plan
4. Calculate cargo weight in tons (convert from kg)
5. Extract credit rates from both subscription plans
6. Call `consumeCreditsForBid` to perform dual deduction
7. Continue with existing bid acceptance logic (assign truck, create trip, etc.)

**Error Handling**:
- If tenant admin not found: "Tenant admin not found for this tenant"
- If tenant admin has no subscription: "Tenant admin must have an active subscription plan to accept bids"
- If truck owner has no subscription: "Truck owner must have an active subscription plan"
- If credit deduction fails: "Failed to process credit deduction: [error message]"

### 4. Module Updates

**Location**: `backend/src/modules/bidding/bidding.module.ts`

**New Dependencies Added**:
- `SubscriptionPlan` entity
- `TenantSubscription` entity
- `CreditAccount` entity
- `CreditTransaction` entity
- `FeatureCreditCost` entity
- `CreditService` provider

## Database Schema

### Subscription Plans Table
```sql
subscription_plans
├── credits_per_ton_tenant (decimal 10,2) - Rate for tenant admin
├── credits_per_ton_truck_owner (decimal 10,2) - Rate for truck owner
└── ... other fields
```

### Credit Transactions Table
```sql
credit_transactions
├── type: 'CONSUMPTION' (for deductions)
├── amount: negative value (e.g., -1000)
├── description: "Bid accepted for [load title] (X tons × Y credits/ton)"
├── reference_type: 'BID'
├── reference_id: bid ID
├── metadata: { loadId, cargoWeightTons, creditsPerTon, role }
└── ... other fields
```

## Example Scenario

### Setup
- **Tenant Admin**: Has 5,000 credits
- **Truck Owner**: Has 1,000 credits (purchased from tenant admin)
- **Cargo Load**: 5 tons
- **Tenant Admin Rate**: 200 credits/ton
- **Truck Owner Rate**: 100 credits/ton

### Bid Placement
1. Truck owner views cargo (5 tons)
2. System calculates: 5 tons × 100 = 500 credits needed
3. Truck owner has 1,000 credits ✓
4. Bid is allowed to be placed

### Bid Acceptance
1. Cargo owner accepts the bid
2. System calculates:
   - Tenant admin: 5 tons × 200 = 1,000 credits
   - Truck owner: 5 tons × 100 = 500 credits
3. System validates:
   - Tenant admin has 5,000 credits ✓
   - Truck owner has 1,000 credits ✓
4. System deducts:
   - Tenant admin: 5,000 - 1,000 = 4,000 remaining
   - Truck owner: 1,000 - 500 = 500 remaining
5. Two transaction records created
6. Bid status updated to ACCEPTED
7. Trip created automatically

## Testing Checklist

### Pre-Bid Validation
- [ ] Truck owner with sufficient credits can place bid
- [ ] Truck owner with insufficient credits cannot place bid
- [ ] Error message shows exact credits needed and available
- [ ] Truck owner without subscription cannot place bid

### Bid Acceptance
- [ ] Both tenant admin and truck owner credits are deducted
- [ ] Correct amounts are deducted based on cargo weight
- [ ] Transaction records are created for both parties
- [ ] Bid acceptance fails if tenant admin has insufficient credits
- [ ] Bid acceptance fails if truck owner has insufficient credits
- [ ] Existing bid acceptance flow continues (trip creation, notifications, etc.)

### Edge Cases
- [ ] Zero-weight cargo (should fail validation)
- [ ] Very large cargo (should calculate correctly)
- [ ] Tenant admin with no subscription
- [ ] Truck owner with no subscription
- [ ] Multiple bids on same load (only accepted bid deducts credits)

## API Endpoints Affected

### POST `/api/bidding/bids`
- Now validates truck owner has sufficient credits before creating bid
- Returns 400 error if insufficient credits

### POST `/api/bidding/bids/:bidId/accept`
- Now deducts credits from both tenant admin and truck owner
- Returns 400 error if either party has insufficient credits

## Frontend Integration Notes

### Bidding UI Updates Needed
1. Display credit requirement before placing bid
   - "This bid will cost you X credits (Y tons × Z credits/ton)"
2. Show current credit balance
3. Disable bid button if insufficient credits
4. Show error message if bid fails due to credits

### Credit Balance Display
1. Show credit balance on bidding dashboard
2. Add link to purchase more credits
3. Show credit history/transactions

## Monitoring & Logging

### Log Messages
```
[CreditService] Dual deduction completed for bid {bidId}:
  - Tenant Admin: {amount} credits deducted
  - Truck Owner: {amount} credits deducted

[BiddingService] Credit validation passed for truck owner {userId}:
  - Cargo weight: {weight} tons
  - Rate: {rate} credits/ton
  - Credits needed: {amount}

[BiddingService] Accepting bid {bidId} - Credit deduction details:
  - Cargo weight: {weight} tons
  - Tenant admin rate: {rate} credits/ton
  - Truck owner rate: {rate} credits/ton
```

## Future Enhancements

1. **Credit Refund on Trip Cancellation**
   - If trip is cancelled, refund credits to both parties
   - Implement refund policy (full/partial based on timing)

2. **Credit Hold on Bid Placement**
   - Reserve credits when bid is placed
   - Release if bid is rejected
   - Deduct if bid is accepted

3. **Dynamic Credit Rates**
   - Allow different rates based on cargo type
   - Implement surge pricing during high demand
   - Volume discounts for frequent users

4. **Credit Analytics**
   - Track credit consumption patterns
   - Predict when users will run out of credits
   - Send low-balance notifications

## Related Files

- `backend/src/services/credit.service.ts`
- `backend/src/modules/bidding/bidding.service.ts`
- `backend/src/modules/bidding/bidding.module.ts`
- `backend/src/entities/subscription-plan.entity.ts`
- `backend/src/entities/tenant-subscription.entity.ts`
- `backend/src/entities/credit-account.entity.ts`
- `backend/src/entities/credit-transaction.entity.ts`

## Support

For questions or issues, contact the development team or refer to:
- Credit System Documentation: `docs/CREDIT_SYSTEM.md`
- Subscription Plans Guide: `docs/SUBSCRIPTION_CREATION_GUIDE.md`
- Bidding System Documentation: `docs/BIDDING_SYSTEM_IMPLEMENTATION_SUMMARY.md`
