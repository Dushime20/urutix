# AI Matching Credit System - Quick Reference

## Quick Overview

The AI Matching system validates and deducts credits automatically:
- **Before match request**: Validates truck owner has enough credits
- **On match acceptance**: Deducts credits from both tenant admin and truck owner

## Credit Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATCH REQUEST (Cargo Owner)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Validate Credits   │
                    │  (Truck Owner)      │
                    └─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ✅ Sufficient         ❌ Insufficient
            Credits               Credits
                    │                   │
                    │                   └──> Block Request
                    │                        (400 Error)
                    ▼
        ┌───────────────────────┐
        │  Send Match Request   │
        │  to Truck Owner       │
        └───────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              MATCH ACCEPTANCE (Truck Owner)                      │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Deduct Credits       │
        │  (Dual Deduction)     │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│ Tenant Admin │        │ Truck Owner  │
│   -40 credits│        │  -60 credits │
└──────────────┘        └──────────────┘
        │                       │
        └───────────┬───────────┘
                    ▼
        ┌───────────────────────┐
        │  Grant Revenue to     │
        │  Tenant Admin         │
        │  +60 credits          │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Net Profit:          │
        │  +20 credits          │
        └───────────────────────┘
```

## API Endpoints

### 1. Request Match (with Credit Validation)

**Endpoint:** `POST /matching/request`

**Request:**
```json
{
  "loadId": "uuid-of-cargo",
  "truckId": "uuid-of-truck"
}
```

**Success Response (200):**
```json
{
  "id": "match-uuid",
  "loadId": "cargo-uuid",
  "truckId": "truck-uuid",
  "status": "REQUESTED",
  "score": 1.0
}
```

**Error Response (400) - Insufficient Credits:**
```json
{
  "statusCode": 400,
  "message": "Truck owner has insufficient credits to accept this cargo. Required: 60, Available: 45",
  "error": "Bad Request"
}
```

### 2. Accept Match (with Credit Deduction)

**Endpoint:** `PATCH /matching/:matchId/respond`

**Request:**
```json
{
  "status": "ACCEPTED"
}
```

**Success Response (200):**
```json
{
  "id": "match-uuid",
  "status": "ACCEPTED",
  "loadId": "cargo-uuid",
  "truckId": "truck-uuid"
}
```

**Error Response (400) - Credit Deduction Failed:**
```json
{
  "statusCode": 400,
  "message": "Failed to process credit deduction: Tenant admin has insufficient credits. Required: 40, Available: 30",
  "error": "Bad Request"
}
```

## Code Examples

### Frontend - Request Match with Error Handling

```typescript
import { enhancedMatchingApi } from '@/services/enhancedMatchingApi';

async function requestMatch(loadId: string, truckId: string) {
  try {
    const match = await enhancedMatchingApi.requestMatch(loadId, truckId);
    
    // Success - match request sent
    toast.success('Match request sent to truck owner');
    return match;
    
  } catch (error: any) {
    // Handle insufficient credits error
    if (error.response?.status === 400) {
      const message = error.response.data.message;
      
      if (message.includes('insufficient credits')) {
        toast.error('Insufficient credits. Please purchase more credits.');
      } else if (message.includes('active subscription')) {
        toast.error('Active subscription required for AI matching.');
      } else {
        toast.error(message);
      }
    } else {
      toast.error('Failed to send match request');
    }
    throw error;
  }
}
```

### Frontend - Accept Match with Error Handling

```typescript
async function acceptMatch(matchId: string) {
  try {
    const match = await enhancedMatchingApi.respondToMatch(matchId, 'ACCEPTED');
    
    // Success - credits deducted, trip created
    toast.success('Match accepted! Credits deducted and trip created.');
    return match;
    
  } catch (error: any) {
    if (error.response?.status === 400) {
      const message = error.response.data.message;
      
      if (message.includes('credit deduction')) {
        toast.error('Credit deduction failed. Please check your balance.');
      } else {
        toast.error(message);
      }
    } else {
      toast.error('Failed to accept match');
    }
    throw error;
  }
}
```

## Credit Calculation

### Formula

```typescript
// Cargo weight in tons
const cargoWeightTons = cargoWeightKg / 1000;

// Get rates from subscription plan
const tenantRate = subscriptionPlan.creditsPerTonTenant;
const truckOwnerRate = subscriptionPlan.creditsPerTonTruckOwner;

// Calculate required credits
const tenantCredits = Math.ceil(cargoWeightTons * tenantRate);
const truckOwnerCredits = Math.ceil(cargoWeightTons * truckOwnerRate);

// Net profit for tenant admin
const netProfit = truckOwnerCredits - tenantCredits;
```

### Example

**Cargo:** 4,000 kg (4 tons)  
**Subscription Plan:**
- Tenant Rate: 10 credits/ton
- Truck Owner Rate: 15 credits/ton

**Calculation:**
```
Tenant Credits = 4 × 10 = 40 credits
Truck Owner Credits = 4 × 15 = 60 credits
Net Profit = 60 - 40 = 20 credits
```

## Database Queries

### Check Credit Balance

```sql
SELECT 
  user_id,
  current_balance,
  bonus_credits,
  subscription_credits,
  purchased_credits
FROM credit_accounts
WHERE tenant_id = 'tenant-uuid' 
  AND user_id = 'user-uuid';
```

### View Credit Transactions

```sql
SELECT 
  id,
  user_id,
  amount,
  transaction_type,
  description,
  reference_type,
  reference_id,
  created_at
FROM credit_transactions
WHERE tenant_id = 'tenant-uuid'
  AND reference_type = 'BID'
  AND reference_id = 'match-uuid'
ORDER BY created_at DESC;
```

### Check Subscription Plan Rates

```sql
SELECT 
  ts.id,
  ts.status,
  sp.name,
  sp.credits_per_ton_tenant,
  sp.credits_per_ton_truck_owner
FROM tenant_subscriptions ts
JOIN subscription_plans sp ON ts.plan_id = sp.id
WHERE ts.tenant_id = 'tenant-uuid'
  AND ts.status = 'ACTIVE';
```

## Testing

### Run Test Script

```bash
cd backend
node test-ai-matching-credit-system.js
```

This script will:
1. Find active subscription with credit rates
2. Find tenant admin and truck owner
3. Find available cargo and truck
4. Calculate required credits
5. Validate credit balances
6. Simulate credit deduction flow

### Manual Testing Steps

1. **Setup:**
   - Ensure tenant has active subscription
   - Grant credits to tenant admin and truck owner
   - Create cargo and truck

2. **Test Match Request:**
   ```bash
   curl -X POST http://localhost:3000/matching/request \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"loadId": "cargo-uuid", "truckId": "truck-uuid"}'
   ```

3. **Test Match Acceptance:**
   ```bash
   curl -X PATCH http://localhost:3000/matching/match-uuid/respond \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"status": "ACCEPTED"}'
   ```

4. **Verify Credits:**
   - Check credit_accounts table for updated balances
   - Check credit_transactions table for transaction records

## Troubleshooting

### Issue: "Insufficient credits" error

**Solution:**
1. Check credit balance: `SELECT * FROM credit_accounts WHERE user_id = 'user-uuid'`
2. Grant credits via credit marketplace
3. Or reduce cargo weight

### Issue: "No active subscription" error

**Solution:**
1. Check subscription status: `SELECT * FROM tenant_subscriptions WHERE tenant_id = 'tenant-uuid'`
2. Create or activate subscription
3. Ensure subscription has credit rates configured

### Issue: Credits not deducted

**Solution:**
1. Check logs for credit deduction errors
2. Verify subscription plan has credit rates
3. Ensure both users have credit accounts
4. Check database constraints

## Key Points

✅ **Credit validation happens BEFORE match request**  
✅ **Credit deduction happens ON match acceptance**  
✅ **Both tenant admin and truck owner are charged**  
✅ **Tenant admin receives revenue from truck owner**  
✅ **Same credit service as bidding system**  
✅ **Automatic transaction recording**  

## Related Documentation

- [AI Matching Credit System (Full)](./AI_MATCHING_CREDIT_SYSTEM.md)
- [Credit Marketplace Quick Start](./CREDIT_MARKETPLACE_QUICK_START.md)
- [Bidding System Implementation](./BIDDING_SYSTEM_IMPLEMENTATION_SUMMARY.md)
