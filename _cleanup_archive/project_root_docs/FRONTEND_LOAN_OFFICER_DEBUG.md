# Frontend: Loan Officer Selection Not Showing - Debug Guide

## What I Fixed

1. **UI Condition Updated**: The loan officer selection section now shows for ALL external system lenders, even if:
   - Loan officers haven't been fetched yet
   - The fetch failed
   - No loan officers are available

2. **Added Comprehensive Logging**: Console logs now track:
   - When lender is selected
   - Whether external system is detected
   - When loan officers are fetched
   - Response data
   - Any errors

## How to Debug

### Step 1: Open Browser DevTools

1. Press `F12` or right-click → Inspect
2. Go to **Console** tab
3. Clear the console (trash icon)

### Step 2: Select a Lender

1. Go to Payment Management page
2. Click "Loan Request" on a load
3. Select a lender that should use external system
4. Watch the console for logs

### Step 3: Check Console Logs

**You should see logs like:**

```
[useEffect] Loan officer selection effect triggered
[useEffect] Selected item: { id: "...", name: "...", isLoanOfficer: false, ... }
[useEffect] Checking external system: { usesExternalSystem: true, ... }
[useEffect] Fetching loan officers for external system lender
[fetchLoanOfficers] Fetching loan officers for lender: {lender-id}
```

**If you see:**
- `usesExternalSystem: false` → Lender is not configured for external system
- `selectedLenderData is null` → Lender data wasn't loaded properly
- `Error fetching loan officers` → API call failed (check status code)

### Step 4: Check Network Tab

1. Go to **Network** tab in DevTools
2. Select a lender
3. Look for request to `/lending/external/loan-officers/{lenderId}`

**Check:**
- **Status**: 
  - `200` = Success (but might return empty array)
  - `404` = Endpoint not implemented in external system
  - `401` = API key invalid
  - `500` = Server error

- **Response**: Should contain loan officers array

### Step 5: Verify Lender Configuration

**Check if lender has external system metadata:**

In console, type:
```javascript
// After selecting a lender, check:
console.log('Selected lender data:', selectedLenderData);
```

**Should have:**
```javascript
{
  id: "...",
  name: "...",
  metadata: {
    integrationType: "uruti_lending_platform" // or "external_lending_system"
  }
}
```

**If `metadata.integrationType` is missing:**
- Lender is not configured for external system
- See `SETUP_EXTERNAL_LENDER.md` for setup instructions

## Common Issues

### Issue 1: Loan Officer Section Doesn't Show

**Possible Causes:**
1. Lender doesn't have `metadata.integrationType` set
2. `selectedLenderData` is null
3. Lender is already a loan officer (shouldn't show section)

**Check:**
```javascript
// In browser console after selecting lender:
console.log('Lender:', selectedLenderData);
console.log('Integration type:', selectedLenderData?.metadata?.integrationType);
```

**Fix:**
- Configure lender for external system (see `SETUP_EXTERNAL_LENDER.md`)
- Ensure lender has `metadata.integrationType = 'uruti_lending_platform'`

### Issue 2: Section Shows But "No loan officers available"

**Possible Causes:**
1. External system endpoint returns 404 (not implemented)
2. External system returns empty array
3. API key is invalid

**Check Console:**
- Look for `[fetchLoanOfficers] Error fetching loan officers`
- Check error status code

**Fix:**
- If 404: External system needs to implement endpoint (see `MESSAGE_FOR_EXTERNAL_LENDING_TEAM.md`)
- If 401: Check API key configuration
- If empty array: External system has no loan officers

### Issue 3: Section Shows But Stuck on "Loading..."

**Possible Causes:**
1. API call is hanging
2. Network timeout
3. External system is slow

**Check:**
- Network tab: Is request pending?
- Console: Any errors?

**Fix:**
- Check external system status
- Verify API endpoint is accessible
- Check network connectivity

### Issue 4: Can't Select Loan Officer

**Possible Causes:**
1. Loan officers array is empty
2. Loan officer selection is disabled
3. UI condition not met

**Check:**
```javascript
// In console:
console.log('Loan officers:', loanOfficers);
console.log('Selected loan officer:', selectedLoanOfficer);
```

## Expected Behavior

### When Everything Works:

1. **Select External System Lender**
   - Section appears immediately
   - Shows "Loading loan officers..." spinner

2. **Loan Officers Load**
   - Spinner disappears
   - List of loan officers appears
   - Each officer is clickable

3. **Select Loan Officer**
   - Officer gets highlighted
   - Checkmark appears
   - "Submit Loan Request" button becomes enabled

4. **Submit Request**
   - Request includes `loanOfficerId` in metadata
   - Success message appears

## Quick Test

**Test if UI condition is working:**

1. Select a lender
2. In console, check:
   ```javascript
   console.log('Should show section:', 
     selectedLender && 
     selectedLenderData && 
     !selectedLenderData.metadata?.isLoanOfficer &&
     (selectedLenderData.metadata?.integrationType === 'uruti_lending_platform' ||
      selectedLenderData.metadata?.integrationType === 'external_lending_system')
   );
   ```

**If `false`, check which condition failed:**
- `selectedLender` - No lender selected
- `selectedLenderData` - Lender data not loaded
- `isLoanOfficer` - Selected item is already a loan officer
- `integrationType` - Lender not configured for external system

## Next Steps

1. **Check console logs** when selecting a lender
2. **Verify lender configuration** has `integrationType` set
3. **Test API endpoint** directly: `GET /lending/external/loan-officers/{lenderId}`
4. **Check external system** has implemented the endpoint
5. **Verify API key** is correct

If the section still doesn't show, share the console logs and I can help debug further!

