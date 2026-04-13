# Frontend Integration Guide - AI Matching Credit System

## Overview

This guide helps frontend developers integrate the new credit validation and deduction features for AI matching.

## What Changed

### Backend Changes
1. **Match Request** - Now validates truck owner credits before sending request
2. **Match Acceptance** - Now deducts credits from both parties automatically

### Frontend Impact
- Need to handle new error responses
- Display credit requirements to users
- Show credit balance warnings
- Update UI to reflect credit status

## Error Handling

### New Error Responses

#### 1. Insufficient Truck Owner Credits (Match Request)

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Truck owner has insufficient credits to accept this cargo. Required: 60, Available: 45",
  "error": "Bad Request"
}
```

**When it happens:** When cargo owner tries to send match request but truck owner doesn't have enough credits.

**Frontend handling:**
```typescript
try {
  await enhancedMatchingApi.requestMatch(loadId, truckId);
} catch (error: any) {
  if (error.response?.status === 400) {
    const message = error.response.data.message;
    
    if (message.includes('insufficient credits')) {
      // Extract numbers from message
      const match = message.match(/Required: (\d+), Available: (\d+)/);
      const required = match ? match[1] : '?';
      const available = match ? match[2] : '?';
      
      toast.error(
        `Truck owner needs ${required} credits but only has ${available}. ` +
        `They need to purchase ${required - available} more credits.`
      );
    }
  }
}
```

#### 2. No Active Subscription

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Tenant admin must have an active subscription plan to enable AI matching",
  "error": "Bad Request"
}
```

**Frontend handling:**
```typescript
if (message.includes('active subscription')) {
  toast.error('Active subscription required for AI matching.');
  // Redirect to subscription page
  router.push('/subscription/plans');
}
```

#### 3. Credit Deduction Failed (Match Acceptance)

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Failed to process credit deduction: Tenant admin has insufficient credits. Required: 40, Available: 30",
  "error": "Bad Request"
}
```

**Frontend handling:**
```typescript
try {
  await enhancedMatchingApi.respondToMatch(matchId, 'ACCEPTED');
} catch (error: any) {
  if (error.response?.status === 400) {
    const message = error.response.data.message;
    
    if (message.includes('credit deduction')) {
      toast.error('Credit deduction failed. Please check your balance.');
      // Refresh credit balance
      await fetchCreditBalance();
    }
  }
}
```

## UI Components to Update

### 1. Match Request Button

**Before:**
```tsx
<Button onClick={() => requestMatch(load.id, truck.id)}>
  Request Match
</Button>
```

**After (with credit validation):**
```tsx
<Button 
  onClick={() => handleRequestMatch(load.id, truck.id)}
  disabled={!hasSufficientCredits}
>
  {hasSufficientCredits ? 'Request Match' : 'Insufficient Credits'}
</Button>

{!hasSufficientCredits && (
  <Alert variant="warning">
    Truck owner needs {requiredCredits} credits but only has {availableCredits}.
    <Link to="/credits/marketplace">Purchase Credits</Link>
  </Alert>
)}
```

### 2. Credit Balance Display

**Add to Cargo Owner Dashboard:**
```tsx
<CreditBalanceCard>
  <h3>Your Credit Balance</h3>
  <div className="balance">{creditBalance} credits</div>
  
  {creditBalance < 100 && (
    <Alert variant="warning">
      Low credit balance. Consider purchasing more credits.
    </Alert>
  )}
  
  <Button onClick={() => router.push('/credits/marketplace')}>
    Purchase Credits
  </Button>
</CreditBalanceCard>
```

**Add to Truck Owner Dashboard:**
```tsx
<CreditBalanceCard>
  <h3>Your Credit Balance</h3>
  <div className="balance">{creditBalance} credits</div>
  
  <div className="info">
    <InfoIcon />
    Credits are required to accept cargo matches.
  </div>
  
  {creditBalance < 50 && (
    <Alert variant="danger">
      Insufficient credits to accept most cargo. Purchase more credits.
    </Alert>
  )}
</CreditBalanceCard>
```

### 3. Match Card with Credit Info

**Enhanced Match Card:**
```tsx
interface MatchCardProps {
  match: Match;
  load: Load;
  truck: Truck;
  requiredCredits: number;
  userCreditBalance: number;
}

function MatchCard({ match, load, truck, requiredCredits, userCreditBalance }: MatchCardProps) {
  const canAccept = userCreditBalance >= requiredCredits;
  
  return (
    <Card>
      <CardHeader>
        <h3>{load.title}</h3>
        <Badge>{match.score}% Match</Badge>
      </CardHeader>
      
      <CardBody>
        <div className="cargo-details">
          <p>Weight: {load.weight} kg</p>
          <p>Route: {load.pickupLocation} → {load.deliveryLocation}</p>
        </div>
        
        <div className="credit-info">
          <CreditIcon />
          <span>Required: {requiredCredits} credits</span>
          <span className={canAccept ? 'text-success' : 'text-danger'}>
            Your Balance: {userCreditBalance} credits
          </span>
        </div>
        
        {!canAccept && (
          <Alert variant="warning">
            You need {requiredCredits - userCreditBalance} more credits to accept this cargo.
          </Alert>
        )}
      </CardBody>
      
      <CardFooter>
        <Button 
          onClick={() => handleAcceptMatch(match.id)}
          disabled={!canAccept}
          variant={canAccept ? 'primary' : 'secondary'}
        >
          {canAccept ? 'Accept Match' : 'Insufficient Credits'}
        </Button>
        
        <Button variant="outline" onClick={() => handleRejectMatch(match.id)}>
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 4. Credit Calculation Display

**Show credit breakdown before request:**
```tsx
function CreditBreakdown({ cargoWeight, subscriptionPlan }: Props) {
  const weightTons = cargoWeight / 1000;
  const tenantCredits = Math.ceil(weightTons * subscriptionPlan.creditsPerTonTenant);
  const truckOwnerCredits = Math.ceil(weightTons * subscriptionPlan.creditsPerTonTruckOwner);
  const netProfit = truckOwnerCredits - tenantCredits;
  
  return (
    <div className="credit-breakdown">
      <h4>Credit Breakdown</h4>
      
      <div className="calculation">
        <div className="row">
          <span>Cargo Weight:</span>
          <span>{weightTons.toFixed(2)} tons</span>
        </div>
        
        <div className="row">
          <span>Your Cost (Tenant Admin):</span>
          <span className="debit">-{tenantCredits} credits</span>
        </div>
        
        <div className="row">
          <span>Truck Owner Cost:</span>
          <span className="debit">-{truckOwnerCredits} credits</span>
        </div>
        
        <div className="row">
          <span>Your Revenue:</span>
          <span className="credit">+{truckOwnerCredits} credits</span>
        </div>
        
        <Divider />
        
        <div className="row total">
          <span>Your Net Profit:</span>
          <span className={netProfit > 0 ? 'profit' : 'loss'}>
            {netProfit > 0 ? '+' : ''}{netProfit} credits
          </span>
        </div>
      </div>
    </div>
  );
}
```

## API Service Updates

### Enhanced Matching API Service

**Update `frontend/src/services/enhancedMatchingApi.ts`:**

```typescript
export const enhancedMatchingApi = {
  // ... existing methods

  /**
   * Request match with credit validation
   * @throws {Error} If truck owner has insufficient credits
   */
  requestMatch: async (loadId: string, truckId: string): Promise<any> => {
    try {
      const response = await api.post('/matching/request', { loadId, truckId });
      return response.data;
    } catch (error: any) {
      // Enhanced error handling for credit issues
      if (error.response?.status === 400) {
        const message = error.response.data.message;
        
        if (message.includes('insufficient credits')) {
          throw new InsufficientCreditsError(message, error.response.data);
        } else if (message.includes('subscription')) {
          throw new NoSubscriptionError(message, error.response.data);
        }
      }
      throw error;
    }
  },

  /**
   * Accept match with automatic credit deduction
   * @throws {Error} If credit deduction fails
   */
  respondToMatch: async (matchId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<any> => {
    try {
      const response = await api.patch(`/matching/${matchId}/respond`, { status });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400 && status === 'ACCEPTED') {
        const message = error.response.data.message;
        
        if (message.includes('credit deduction')) {
          throw new CreditDeductionError(message, error.response.data);
        }
      }
      throw error;
    }
  },

  /**
   * Calculate required credits for a cargo
   */
  calculateRequiredCredits: async (loadId: string): Promise<{
    tenantCredits: number;
    truckOwnerCredits: number;
    netProfit: number;
  }> => {
    const response = await api.get(`/matching/calculate-credits/${loadId}`);
    return response.data;
  },
};

// Custom error classes
export class InsufficientCreditsError extends Error {
  constructor(message: string, public data: any) {
    super(message);
    this.name = 'InsufficientCreditsError';
  }
}

export class NoSubscriptionError extends Error {
  constructor(message: string, public data: any) {
    super(message);
    this.name = 'NoSubscriptionError';
  }
}

export class CreditDeductionError extends Error {
  constructor(message: string, public data: any) {
    super(message);
    this.name = 'CreditDeductionError';
  }
}
```

## React Hooks

### useCreditValidation Hook

```typescript
import { useState, useEffect } from 'react';
import { enhancedMatchingApi } from '@/services/enhancedMatchingApi';

export function useCreditValidation(loadId: string, truckId: string) {
  const [loading, setLoading] = useState(true);
  const [canRequest, setCanRequest] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState(0);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validate() {
      try {
        setLoading(true);
        
        // Get required credits
        const credits = await enhancedMatchingApi.calculateRequiredCredits(loadId);
        setRequiredCredits(credits.truckOwnerCredits);
        
        // Get truck owner's balance
        const balance = await api.get(`/credits/balance/${truckId}`);
        setAvailableCredits(balance.data.currentBalance);
        
        // Check if can request
        setCanRequest(balance.data.currentBalance >= credits.truckOwnerCredits);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setCanRequest(false);
      } finally {
        setLoading(false);
      }
    }

    if (loadId && truckId) {
      validate();
    }
  }, [loadId, truckId]);

  return { loading, canRequest, requiredCredits, availableCredits, error };
}
```

### Usage Example

```typescript
function MatchRequestButton({ loadId, truckId }: Props) {
  const { loading, canRequest, requiredCredits, availableCredits, error } = 
    useCreditValidation(loadId, truckId);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      <Button 
        onClick={() => handleRequestMatch(loadId, truckId)}
        disabled={!canRequest}
      >
        {canRequest ? 'Request Match' : 'Insufficient Credits'}
      </Button>
      
      {!canRequest && (
        <div className="credit-warning">
          <WarningIcon />
          <span>
            Truck owner needs {requiredCredits} credits but only has {availableCredits}.
            They need {requiredCredits - availableCredits} more credits.
          </span>
        </div>
      )}
    </>
  );
}
```

## Notification Updates

### Add Credit-Related Notifications

```typescript
// When match request is blocked
toast.error('Match request blocked: Truck owner has insufficient credits', {
  action: {
    label: 'View Credits',
    onClick: () => router.push('/credits/marketplace')
  }
});

// When match is accepted successfully
toast.success('Match accepted! Credits deducted successfully.', {
  description: `${creditsDeducted} credits deducted from your account.`
});

// When credit deduction fails
toast.error('Failed to accept match: Credit deduction failed', {
  description: 'Please check your credit balance and try again.',
  action: {
    label: 'Check Balance',
    onClick: () => router.push('/credits/balance')
  }
});
```

## Testing Checklist

### Frontend Testing

- [ ] Test match request with sufficient credits
- [ ] Test match request with insufficient credits
- [ ] Test match acceptance with sufficient credits
- [ ] Test match acceptance with insufficient credits
- [ ] Test error message display
- [ ] Test credit balance updates after deduction
- [ ] Test navigation to credit marketplace
- [ ] Test credit calculation display
- [ ] Test loading states
- [ ] Test edge cases (no subscription, network errors)

### User Flow Testing

1. **Cargo Owner Flow:**
   - [ ] View available trucks
   - [ ] See credit requirements for each truck
   - [ ] Request match (success)
   - [ ] Request match (insufficient credits error)
   - [ ] View credit balance
   - [ ] Purchase credits

2. **Truck Owner Flow:**
   - [ ] View match requests
   - [ ] See credit requirements
   - [ ] Accept match (success with credit deduction)
   - [ ] Accept match (insufficient credits error)
   - [ ] View credit balance
   - [ ] Purchase credits

## Migration Steps

1. **Update API Service:**
   - Add error handling for credit-related errors
   - Add custom error classes
   - Update method signatures if needed

2. **Update UI Components:**
   - Add credit balance displays
   - Add credit requirement indicators
   - Update button states based on credit availability
   - Add warning messages for low credits

3. **Add React Hooks:**
   - Create `useCreditValidation` hook
   - Create `useCreditBalance` hook
   - Add to shared hooks directory

4. **Update Notifications:**
   - Add credit-related toast messages
   - Add action buttons to navigate to credit pages

5. **Test Thoroughly:**
   - Test all user flows
   - Test error scenarios
   - Test edge cases

## Support Resources

- [AI Matching Credit System Documentation](./AI_MATCHING_CREDIT_SYSTEM.md)
- [Quick Reference Guide](./AI_MATCHING_CREDIT_QUICK_REFERENCE.md)
- [Credit Marketplace Guide](./CREDIT_MARKETPLACE_QUICK_START.md)

## Questions?

Contact the backend team for:
- API endpoint clarifications
- Error response formats
- Credit calculation logic
- Database queries
