# AI Matching Credit Reduction System

## Overview

The AI Matching system now includes automatic credit validation and deduction, similar to the bidding process. This ensures that both tenant admins and truck owners have sufficient credits before and after accepting cargo matches.

## Credit Flow Process

### 1. Before Sending Match Request (Cargo Owner → Truck Owner)

When a cargo owner sends a matching request to a truck owner, the system:

1. **Validates Truck Owner Credits**
   - Retrieves the tenant admin's active subscription plan
   - Calculates required credits based on cargo weight: `cargoWeightTons × creditsPerTonTruckOwner`
   - Checks if truck owner has sufficient credits in their account
   - **Blocks the request** if truck owner has insufficient credits

2. **Error Handling**
   - If truck owner lacks credits, throws: `BadRequestException` with message showing required vs available credits
   - If no active subscription exists, throws: `BadRequestException` requiring active subscription

### 2. When Truck Owner Accepts Match

When a truck owner accepts a matching request, the system automatically:

1. **Dual Credit Deduction** (same as bidding system)
   - **Tenant Admin**: Deducts operational cost (`cargoWeightTons × creditsPerTonTenant`)
   - **Truck Owner**: Deducts job payment (`cargoWeightTons × creditsPerTonTruckOwner`)

2. **Tenant Admin Revenue**
   - Grants tenant admin the credits paid by truck owner as revenue/earnings
   - Net result: `Tenant Admin Profit = truckOwnerCredits - tenantCredits`

3. **Transaction Recording**
   - Creates credit transactions for both parties
   - Records calculation details (weight, rates, roles)
   - Links transactions to match ID and load ID

## Implementation Details

### Modified Files

#### 1. `backend/src/modules/matching/matching.service.ts`

**Added Dependencies:**
```typescript
@InjectRepository(User)
private readonly userRepository: Repository<User>,
@InjectRepository(TenantSubscription)
private readonly tenantSubscriptionRepository: Repository<TenantSubscription>,
@InjectRepository(SubscriptionPlan)
private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
private readonly creditService: CreditService,
```

**Modified Methods:**

##### `requestMatch()` - Credit Validation
- Added credit validation before creating/updating match
- Checks truck owner's credit balance
- Validates against subscription plan rates
- Prevents match request if insufficient credits

##### `respondToMatch()` - Credit Deduction
- Added credit deduction when status is `ACCEPTED`
- Performs dual deduction (tenant admin + truck owner)
- Grants revenue to tenant admin
- Executes BEFORE updating match status (prevents acceptance if credits fail)

#### 2. `backend/src/modules/matching/matching.module.ts`

**Added Imports:**
```typescript
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
```

**Added to TypeORM:**
```typescript
TypeOrmModule.forFeature([
  // ... existing entities
  SubscriptionPlan,
])
```

### Credit Calculation Formula

```typescript
// Calculate cargo weight in tons
const cargoWeightTons = load.weight / 1000; // kg to tons

// Get rates from tenant admin's subscription plan
const creditsPerTonTenant = Number(subscription.plan.creditsPerTonTenant);
const creditsPerTonTruckOwner = Number(subscription.plan.creditsPerTonTruckOwner);

// Calculate required credits
const tenantCreditsNeeded = Math.ceil(cargoWeightTons × creditsPerTonTenant);
const truckOwnerCreditsNeeded = Math.ceil(cargoWeightTons × creditsPerTonTruckOwner);

// Net profit for tenant admin
const tenantNetProfit = truckOwnerCreditsNeeded - tenantCreditsNeeded;
```

## Credit Transaction Flow

### Example Scenario

**Cargo Details:**
- Weight: 4,000 kg (4 tons)
- Subscription Plan Rates:
  - Tenant Admin: 10 credits/ton
  - Truck Owner: 15 credits/ton

**Step 1: Match Request Validation**
```
Required from Truck Owner: 4 tons × 15 = 60 credits
Truck Owner Balance: 100 credits
✅ Validation Passed - Request Sent
```

**Step 2: Match Acceptance (Credit Deduction)**
```
1. Tenant Admin Deduction:
   - Amount: 4 tons × 10 = 40 credits
   - Description: "Bid accepted - operational cost for [Load Title]"
   - New Balance: Previous - 40

2. Truck Owner Deduction:
   - Amount: 4 tons × 15 = 60 credits
   - Description: "Bid accepted - payment for [Load Title]"
   - New Balance: 100 - 60 = 40 credits

3. Tenant Admin Revenue:
   - Amount: +60 credits (from truck owner payment)
   - Description: "Bid revenue from [Load Title] - earned from truck owner payment"
   - Net Profit: 60 - 40 = +20 credits
```

## Error Messages

### Insufficient Credits (Truck Owner)
```
Truck owner has insufficient credits to accept this cargo. 
Required: 60, Available: 45
```

### No Active Subscription
```
Tenant admin must have an active subscription plan to enable AI matching
```

### Credit Deduction Failed
```
Failed to process credit deduction: [error details]
```

## API Endpoints Affected

### POST `/matching/request`
**Request Body:**
```json
{
  "loadId": "uuid",
  "truckId": "uuid"
}
```

**New Behavior:**
- Validates truck owner credits before creating match
- Returns 400 if insufficient credits

### PATCH `/matching/:matchId/respond`
**Request Body:**
```json
{
  "status": "ACCEPTED" | "REJECTED"
}
```

**New Behavior:**
- Deducts credits when status is "ACCEPTED"
- Returns 400 if credit deduction fails
- Credits are deducted BEFORE match status update

## Logging

The system logs detailed credit information:

```
[MatchingService] Accepting match {matchId} - Credit deduction details:
  - Cargo weight: 4.00 tons
  - Using rates from TENANT ADMIN's subscription: Premium Plan
  - Tenant admin rate: 10 credits/ton
  - Truck owner rate: 15 credits/ton

[CreditService] Bid credit flow completed for bid {matchId}:
  - Tenant Admin operational cost: -40 credits
  - Truck Owner payment: -60 credits
  - Tenant Admin revenue earned: +60 credits
  - Tenant Admin net profit: +20 credits
```

## Testing Recommendations

### Test Cases

1. **Sufficient Credits - Success Path**
   - Truck owner has enough credits
   - Match request succeeds
   - Credits deducted on acceptance

2. **Insufficient Credits - Validation Failure**
   - Truck owner lacks credits
   - Match request blocked with error message

3. **No Active Subscription**
   - Tenant has no active subscription
   - Match request blocked

4. **Credit Deduction Failure**
   - Credits validated initially
   - Deduction fails during acceptance
   - Match status not updated

5. **Multiple Match Requests**
   - Ensure credit balance updates correctly
   - Prevent race conditions

## Comparison with Bidding System

| Feature | Bidding System | AI Matching System |
|---------|---------------|-------------------|
| Credit Validation | On bid acceptance | On match request + acceptance |
| Validation Timing | After bid accepted | Before request sent |
| Deduction Timing | On bid acceptance | On match acceptance |
| Dual Deduction | ✅ Yes | ✅ Yes |
| Revenue to Tenant | ✅ Yes | ✅ Yes |
| Uses Same Service | `consumeCreditsForBid()` | `consumeCreditsForBid()` |

## Future Enhancements

1. **Credit Hold System**
   - Reserve credits when match request is sent
   - Release if rejected, deduct if accepted

2. **Partial Credit Refunds**
   - Refund credits if trip is cancelled
   - Implement cancellation policies

3. **Credit Notifications**
   - Notify users when credits are low
   - Alert before match requests fail

4. **Credit History**
   - Track all credit transactions per match
   - Provide detailed credit usage reports

## Related Files

- `backend/src/modules/matching/matching.service.ts` - Main matching logic
- `backend/src/modules/matching/matching.module.ts` - Module configuration
- `backend/src/services/credit.service.ts` - Credit operations
- `backend/src/modules/bidding/bidding.service.ts` - Reference implementation
- `docs/CREDIT_MARKETPLACE_QUICK_START.md` - Credit system overview

## Support

For issues or questions about the credit system:
1. Check credit account balances in database
2. Review subscription plan rates
3. Check credit transaction logs
4. Verify tenant admin has active subscription
