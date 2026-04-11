# How to Check Backend Logs

Please check your backend server console/terminal and look for these log messages:

## What to Look For:

When you refresh the page or call `/api/credits/balance`, you should see:

```
[CreditService] Searching for account with tenantId: 3174d68f-cb7d-4428-b578-e931d1a3f464 userId: 007eb9d5-a71b-42be-8c9e-1c968dd97c71
[CreditService] Found account (fresh from DB): <account-id> Balance: 9976
```

## What It Means:

- If you see `Balance: 9976` → ✅ The fix is working!
- If you see `Balance: 4976` → ❌ The server is still using old code or cached data
- If you don't see these logs at all → The endpoint isn't being called or there's an error

## What to Share:

Please copy and paste:
1. The last 20-30 lines from your backend console
2. The actual JSON response from the Network tab in your browser for `/api/credits/balance`

This will help me understand what's happening.

## Alternative: Check Response in Browser

1. Open Developer Tools (F12)
2. Go to Network tab
3. Refresh the page
4. Find the request to `/api/credits/balance`
5. Click on it
6. Go to "Response" tab
7. Copy the entire JSON response and share it with me

The response should look like:
```json
{
  "success": true,
  "data": {
    "currentBalance": 9976,  // Should be 9976, not 4976
    "subscriptionCredits": 10000,
    "lifetimeEarned": 10000,
    "lifetimeSpent": 24,
    ...
  }
}
```
