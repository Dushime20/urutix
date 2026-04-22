# Lending Policies Configuration - User Guide

## What Was Fixed

### Before the Fix ❌
When you clicked "Create Policy" in the Lending Policies Configuration page:
- You received a confusing 400 Bad Request error
- Error messages mentioned `adjustment_factors.credit_score` validation issues
- No clear indication of what went wrong
- Browser alert boxes with generic error messages

### After the Fix ✅
Now when you create a policy:
- **Success:** You see a green toast notification: "Policy created successfully!"
- **Validation Error:** You see a red toast notification with specific details about what needs to be fixed
- **Network Error:** You see a clear message about connection issues
- All feedback appears as modern toast notifications in the bottom-right corner

## How to Use the Fixed Feature

### Creating a New Interest Rate Policy

1. **Navigate to Policies Page**
   - Go to Lender Dashboard → Policy Configuration
   - Click on the "INTEREST RATES" tab

2. **Click "Add New Policy"**
   - Click the "+ Add" button in the Interest Rates section

3. **Fill in the Form**
   - **Policy Name:** e.g., "Standard Interest Policy"
   - **Risk Level:** Select from low, medium, high, or critical
   - **Base Rate (%):** e.g., 15
   - **Minimum Rate (%):** e.g., 10
   - **Maximum Rate (%):** e.g., 20
   - **Adjustment Factors:**
     - Credit Score Factor: 0-100 (e.g., 8)
     - Loan History Factor: 0-100 (e.g., 30)
     - Collateral Factor: 0-100 (e.g., 20)
     - Business Type Factor: 0-100 (e.g., 20)

4. **Click "Create Policy"**
   - If successful: Green toast appears → Policy is added to the list
   - If error: Red toast appears with specific error details

### Understanding Toast Notifications

#### Success Messages (Green) 🟢
- **"Policy created successfully!"** - Your policy was created
- **"Policy activated successfully"** - Policy is now active
- **"Policy deactivated successfully"** - Policy is now inactive
- **"Lending policies have been synchronized successfully!"** - Changes saved

#### Error Messages (Red) 🔴
Examples of what you might see:
- **Validation Errors:**
  ```
  adjustment_factors.credit_score must not be greater than 100,
  adjustment_factors.loan_history must not be less than 0
  ```
  **Fix:** Adjust the values to be within the valid range (0-100)

- **Network Errors:**
  ```
  Failed to create policy. Please check your connection.
  ```
  **Fix:** Check your internet connection and try again

- **Server Errors:**
  ```
  Failed to update policy status. Please try again.
  ```
  **Fix:** Refresh the page and try again

## Common Issues and Solutions

### Issue 1: Adjustment Factors Validation Error
**Error:** "adjustment_factors.credit_score must not be greater than 100"

**Solution:** 
- All adjustment factors must be between 0 and 100
- Check each field: Credit Score, Loan History, Collateral, Business Type
- Make sure you're entering numbers, not text

### Issue 2: Required Fields Missing
**Error:** "name is required" or similar

**Solution:**
- Fill in all fields marked with a red asterisk (*)
- Required fields include: Policy Name, Risk Level, Base Rate, Min Rate, Max Rate

### Issue 3: Network Connection Error
**Error:** "Failed to create policy. Please check your connection."

**Solution:**
- Check your internet connection
- Verify the backend server is running (http://localhost:3005)
- Try refreshing the page

## Tips for Best Results

1. **Valid Adjustment Factor Values**
   - Use whole numbers or decimals between 0 and 100
   - Example: 8, 15.5, 30, 100 ✅
   - Invalid: -5, 150, "high" ❌

2. **Rate Consistency**
   - Ensure: Min Rate ≤ Base Rate ≤ Max Rate
   - Example: Min=10%, Base=15%, Max=20% ✅
   - Invalid: Min=20%, Base=15%, Max=10% ❌

3. **Toast Notification Duration**
   - Success messages disappear after 2 seconds
   - Error messages stay for 5 seconds (giving you time to read them)
   - You can click on a toast to dismiss it immediately

## Feature Highlights

### Modern User Experience
- ✅ Non-intrusive toast notifications
- ✅ Clear, actionable error messages
- ✅ Immediate visual feedback
- ✅ No page reloads needed

### Improved Error Handling
- ✅ Detailed validation messages
- ✅ Multiple errors shown at once
- ✅ Network error detection
- ✅ Server error handling

### Data Integrity
- ✅ Proper validation on both frontend and backend
- ✅ Type-safe data transformation
- ✅ Consistent data format across the system

## Need Help?

If you encounter any issues:
1. Check the browser console (F12) for detailed error logs
2. Verify all required fields are filled correctly
3. Ensure adjustment factors are between 0-100
4. Check your network connection
5. Try refreshing the page and attempting again

## Technical Details (For Developers)

### Data Format
The frontend now properly transforms data from camelCase to snake_case:

**Frontend (camelCase):**
```javascript
{
  adjustmentFactors: {
    creditScore: 8,
    loanHistory: 30,
    collateral: 20,
    businessType: 20
  }
}
```

**Backend (snake_case):**
```javascript
{
  adjustment_factors: {
    credit_score: 8,
    loan_history: 30,
    collateral: 20,
    business_type: 20
  }
}
```

This transformation happens automatically in the `lendingApi.ts` service layer.
