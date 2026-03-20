# Testing Contract Flow Between Cargo Owner and Broker

## Setup

### 1. Broker Account
- Email: `urutibroker@gmail.com`
- Role: BROKER
- Should already exist in the system

### 2. Cargo Owner Account  
- You need a cargo owner account to test with
- Make sure you're logged in as the cargo owner

## Testing Steps

### Step 1: Login as Cargo Owner
1. Open browser
2. Go to `/auth`
3. Login with your cargo owner credentials
4. Verify you see the cargo owner dashboard

### Step 2: Create or Select a Load
1. Navigate to "Cargo Management" > "All Cargos"
2. Either create a new load or select an existing one
3. Make sure the load is in a state where you can assign a broker

### Step 3: Assign Broker to Load
1. Open the load details
2. Click "Assign Broker" button
3. Select the broker (urutibroker@gmail.com)
4. Click "Assign Broker"
5. **Expected Result**: 
   - Load is assigned to broker
   - Contract is automatically created with status `PENDING_SIGNATURE`
   - You see success message

### Step 4: View Contract as Cargo Owner
1. Navigate to "Contracts" page (add to menu if not there)
2. **Expected Result**:
   - You see the contract you just created
   - Status shows `PENDING_SIGNATURE` (yellow)
   - Broker name is displayed
   - Load title is displayed

### Step 5: Login as Broker
1. Logout from cargo owner account
2. Login with broker credentials:
   - Email: `urutibroker@gmail.com`
   - Password: (your broker password)
3. Verify you see the broker dashboard

### Step 6: View Contract as Broker
1. Navigate to "Contracts" page
2. **Expected Result**:
   - You see the contract assigned to you
   - Status shows `PENDING_SIGNATURE` (yellow)
   - You see an "Accept Contract" button (green checkmark icon)

### Step 7: Accept Contract as Broker
1. Click the "Accept Contract" button
2. **Expected Result**:
   - Contract status changes to `ACTIVE` (green)
   - Success message appears
   - Contract list refreshes

### Step 8: Verify Status Update
1. As broker, verify contract shows `ACTIVE` status
2. Logout and login as cargo owner
3. Navigate to "Contracts" page
4. **Expected Result**:
   - Same contract now shows `ACTIVE` status
   - Both parties see the updated status

## Troubleshooting

### 401 Unauthorized Error
**Symptoms**: "Unauthorized - User not authenticated" when assigning broker

**Solutions**:
1. **Logout and login again** - Token may have expired
2. Check browser console for token:
   ```javascript
   localStorage.getItem('accessToken')
   ```
3. If no token, login again
4. Check browser console logs - should see "Authorization header added"

### Contract Not Created
**Symptoms**: Broker assigned but no contract appears

**Solutions**:
1. Check browser console for errors
2. Verify broker exists in database
3. Check backend logs for contract creation errors

### Contract Not Visible
**Symptoms**: Contract created but not showing in list

**Solutions**:
1. Refresh the page
2. Check if you're logged in as the correct user
3. Verify the contract was created in database

### Status Not Updating
**Symptoms**: Broker accepts but status doesn't change

**Solutions**:
1. Refresh the page
2. Check browser console for API errors
3. Verify backend logs for update errors

## Database Verification

If you need to verify in the database:

```sql
-- Check if broker exists
SELECT id, email, role FROM users WHERE email = 'urutibroker@gmail.com';

-- Check contracts
SELECT id, "cargoOwnerId", "brokerId", "loadId", status, "createdAt" 
FROM load_contracts 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check loads with broker assigned
SELECT id, title, "brokerId", status 
FROM loads 
WHERE "brokerId" IS NOT NULL 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

## Expected Flow Summary

1. **Cargo Owner** creates load
2. **Cargo Owner** assigns broker → Contract created (PENDING_SIGNATURE)
3. **Broker** views contract in their dashboard
4. **Broker** accepts contract → Status changes to ACTIVE
5. **Both parties** see ACTIVE status
