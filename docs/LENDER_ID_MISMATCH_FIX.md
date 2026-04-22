# Lender ID Mismatch Fix

## Problem Identified

When the user logged in as "Bank of Kigali" (email: `lixome8701@spotshops.com`), the API request was returning empty data:

```
GET /api/lending/lenders/8419dc5a-7efd-49d6-af6a-6775e8f13d26/loan-requests
Response: {"data":[],"total":0,"page":1,"limit":10,"totalPages":0}
```

But when querying with a different ID, it returned the correct loan:

```
GET /api/lending/lenders/12cb9a34-780d-45e9-8f27-94d0df44b85b/loan-requests
Response: {"data":[...loan data...],"total":1,"page":1,"limit":100,"totalPages":1}
```

## Root Cause

There was a **database inconsistency** where the same UUID was used for both a User and a Lender entity:

### Before Fix:

**User Table:**
- ID: `8419dc5a-7efd-49d6-af6a-6775e8f13d26`
- Email: `lixome8701@spotshops.com`
- Role: `LENDER`

**Lenders Table:**
1. **"Default Lender"** (WRONG)
   - ID: `8419dc5a-7efd-49d6-af6a-6775e8f13d26` ⚠️ (Same as User ID!)
   - Email: `lender@example.com` ❌ (Different from user email!)
   - Loans: 0

2. **"Bank of Kigali"** (CORRECT)
   - ID: `12cb9a34-780d-45e9-8f27-94d0df44b85b`
   - Email: `lixome8701@spotshops.com` ✅ (Matches user email!)
   - Loans: 1

### The Issue:

When the frontend sent the user's ID (`8419dc5a-7efd-49d6-af6a-6775e8f13d26`) to the backend, the `getLenderLoanRequests` method would:

1. Check if a lender exists with that ID
2. Find "Default Lender" (because it has the same ID as the user)
3. Return loans for "Default Lender" (which has 0 loans)
4. **Never check the email** to find "Bank of Kigali"

The backend logic was:

```typescript
const lenderEntity = await this.lenderRepository.findOne({
  where: { id: lenderId },
});

if (lenderEntity) {
  actualLenderId = lenderEntity.id; // ❌ Found "Default Lender" and stopped here!
} else {
  // This code never executed because lenderEntity was found
  const user = await this.userRepository.findOne({
    where: { id: lenderId, role: UserRole.LENDER },
  });
  if (user) {
    const lenderByEmail = await this.lenderRepository.findOne({
      where: { contact_email: user.email },
    });
    // Would have found "Bank of Kigali" here
  }
}
```

## Solution Applied

**Deleted the "Default Lender"** entity that was causing the conflict.

### After Fix:

**User Table:** (Unchanged)
- ID: `8419dc5a-7efd-49d6-af6a-6775e8f13d26`
- Email: `lixome8701@spotshops.com`
- Role: `LENDER`

**Lenders Table:**
1. **"Bank of Kigali"** (ONLY ONE NOW)
   - ID: `12cb9a34-780d-45e9-8f27-94d0df44b85b`
   - Email: `lixome8701@spotshops.com`
   - Loans: 1

### Now the Backend Flow Works Correctly:

1. Frontend sends user ID: `8419dc5a-7efd-49d6-af6a-6775e8f13d26`
2. Backend checks if lender exists with that ID → **NOT FOUND** ✓
3. Backend looks up user by ID → **FOUND** (email: `lixome8701@spotshops.com`)
4. Backend finds lender by email → **FOUND** "Bank of Kigali" (`12cb9a34-780d-45e9-8f27-94d0df44b85b`)
5. Backend queries loans for "Bank of Kigali" → **Returns 1 loan** ✓

## Verification

### Before Fix:
```bash
GET /api/lending/lenders/8419dc5a-7efd-49d6-af6a-6775e8f13d26/loan-requests
→ Returns: {"data":[],"total":0} ❌
```

### After Fix:
```bash
GET /api/lending/lenders/8419dc5a-7efd-49d6-af6a-6775e8f13d26/loan-requests
→ Backend resolves to Bank of Kigali (12cb9a34-780d-45e9-8f27-94d0df44b85b)
→ Returns: {"data":[...loan...],"total":1} ✅
```

## Scripts Created

1. **`backend/check-lender-ids.js`**
   - Diagnoses lender ID issues
   - Shows user-to-lender mappings
   - Lists all lenders and lender users

2. **`backend/fix-lender-mismatch.js`**
   - Identifies the conflicting "Default Lender"
   - Safely deletes it (after checking for loans)
   - Verifies the fix

## How This Happened

The "Default Lender" was likely created during development/testing with the same UUID as a user account. This is a common issue when:

1. Seeding test data with hardcoded UUIDs
2. Creating lender entities without proper user-lender relationship management
3. Manually inserting data into the database

## Prevention

To prevent this in the future:

1. **Never reuse UUIDs** between users and lenders tables
2. **Always use email matching** to link users to lender entities
3. **Add a unique constraint** on lender `contact_email` field
4. **Create lender entities through the API** rather than manual SQL inserts
5. **Add validation** to ensure user email matches lender email when creating relationships

### Recommended Database Constraint:

```sql
-- Add unique constraint on lender email
ALTER TABLE lenders ADD CONSTRAINT unique_lender_email UNIQUE (contact_email);

-- Add check to prevent user ID from being used as lender ID
-- (This would require application-level validation)
```

## Testing

After applying the fix:

1. ✅ Log in as Bank of Kigali user
2. ✅ Navigate to lender dashboard
3. ✅ Verify loan requests are displayed
4. ✅ Check that the correct lender ID is being used in API calls
5. ✅ Confirm data isolation (only Bank of Kigali's loans are shown)

## Impact

- **Before**: Lender dashboard showed 0 loans (incorrect)
- **After**: Lender dashboard shows 1 loan (correct)
- **No data loss**: The loan was always assigned to the correct lender
- **No code changes needed**: The backend logic was already correct, just needed database cleanup

## Related Issues Fixed

This fix also resolves:
- Empty loan requests table in lender dashboard
- Incorrect analytics showing 0 loans
- Confusion about which lender entity to use

## Files Modified

- None (database-only fix)

## Files Created

- `backend/check-lender-ids.js` - Diagnostic script
- `backend/fix-lender-mismatch.js` - Fix script
- `docs/LENDER_ID_MISMATCH_FIX.md` - This documentation

---

**Date:** April 21, 2026  
**Status:** ✅ FIXED  
**Verified:** Yes
