# Debug: Tenant Filter Not Working

## Issue
After clicking the purple history icon in Tenant Subscriptions, the Credit Usage History page shows "No transactions found" even though the backend is working correctly.

## Backend Test Results ✅
- Backend endpoint works correctly
- Filtering by tenantId returns correct results
- Demo Tenant B: 1 transaction
- Deborah: 1 transaction

## Possible Frontend Issues

### Issue 1: State Update Timing
The `useEffect` sets `selectedTenant` from navigation state, but React Query might execute before the state updates.

**Current Code**:
```typescript
useEffect(() => {
  if (navigationState?.tenantId) {
    setSelectedTenant(navigationState.tenantId);
  }
}, [navigationState]);

// Query executes with selectedTenant
const { data } = useQuery({
  queryKey: ['credit-transactions', selectedTenant, ...],
  queryFn: async () => {
    if (selectedTenant !== 'all') params.append('tenantId', selectedTenant);
    // ...
  },
});
```

**Problem**: Initial render has `selectedTenant = 'all'`, then `useEffect` updates it, triggering a re-render and new query.

### Issue 2: Navigation State Not Persisting
React Router's location.state might not persist across renders or might be cleared.

### Issue 3: Query Not Re-executing
React Query might be caching the 'all' results and not re-fetching when `selectedTenant` changes.

## Debugging Steps

### Step 1: Check Browser Console
Open DevTools > Console and look for:
1. What URL is being called?
2. Is `tenantId` parameter included?
3. What's the response?

### Step 2: Check Network Tab
Open DevTools > Network tab:
1. Filter by "transactions"
2. Check the request URL
3. Verify query parameters

### Step 3: Add Console Logs
Temporarily add logs to see what's happening:

```typescript
useEffect(() => {
  console.log('Navigation state:', navigationState);
  if (navigationState?.tenantId) {
    console.log('Setting tenant to:', navigationState.tenantId);
    setSelectedTenant(navigationState.tenantId);
  }
}, [navigationState]);

// In query
queryFn: async () => {
  console.log('Query executing with selectedTenant:', selectedTenant);
  const params = new URLSearchParams();
  if (selectedTenant !== 'all') {
    console.log('Adding tenantId param:', selectedTenant);
    params.append('tenantId', selectedTenant);
  }
  const url = `/admin/credits/transactions?${params.toString()}`;
  console.log('Fetching:', url);
  // ...
}
```

## Potential Solutions

### Solution 1: Initialize State from Navigation
Instead of using `useEffect`, initialize state directly:

```typescript
const CreditUsageHistory: React.FC = () => {
  const location = useLocation();
  const navigationState = location.state as { tenantId?: string; tenantName?: string } | null;
  
  // Initialize with navigation state
  const [selectedTenant, setSelectedTenant] = useState<string>(
    navigationState?.tenantId || 'all'
  );
  const [searchTerm, setSearchTerm] = useState(
    navigationState?.tenantName || ''
  );
  
  // Remove useEffect - no longer needed
```

### Solution 2: Use Enabled Flag
Only enable query after state is set:

```typescript
const [isReady, setIsReady] = useState(false);

useEffect(() => {
  if (navigationState?.tenantId) {
    setSelectedTenant(navigationState.tenantId);
    setSearchTerm(navigationState.tenantName || '');
  }
  setIsReady(true);
}, [navigationState]);

const { data } = useQuery({
  queryKey: ['credit-transactions', selectedTenant, ...],
  queryFn: async () => { /* ... */ },
  enabled: isReady,  // Only run after state is set
});
```

### Solution 3: Use Query Parameters Instead of State
Pass tenant info via URL query params instead of navigation state:

```typescript
// In TenantSubscriptions
navigate(`/admin/credit-usage?tenantId=${subscription.tenantId}&tenantName=${subscription.tenantName}`);

// In CreditUsageHistory
const searchParams = new URLSearchParams(location.search);
const tenantIdFromUrl = searchParams.get('tenantId');
const [selectedTenant, setSelectedTenant] = useState(tenantIdFromUrl || 'all');
```

## Recommended Fix

Use **Solution 1** - Initialize state directly from navigation state. This is the cleanest and most reliable approach.

## Testing After Fix

1. Click purple history icon for "Demo Tenant B"
2. Check console for:
   - Initial selectedTenant value
   - Query URL being called
3. Verify transaction appears in table
4. Test with "Deborah"
5. Test clearing filter (change to "All Tenants")

## Expected Console Output

```
Navigation state: { tenantId: "4a49a3c2-...", tenantName: "Demo Tenant B" }
Query executing with selectedTenant: 4a49a3c2-...
Adding tenantId param: 4a49a3c2-...
Fetching: /admin/credits/transactions?tenantId=4a49a3c2-...&days=30&limit=100
Response: { success: true, data: [{ ... }], pagination: { ... } }
```

## Next Steps

1. Implement Solution 1 (initialize state from navigation)
2. Test in browser
3. Check console/network for debugging info
4. Verify transactions appear correctly
