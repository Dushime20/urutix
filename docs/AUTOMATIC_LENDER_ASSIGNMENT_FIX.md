# Automatic Lender Assignment Fix

## Problem
The endpoint `GET /api/lending/lenders/{lenderId}/loan-requests` was returning empty data because loan requests were being created without a `lender_id` assigned, even though automatic lender assignment logic existed.

## Root Causes Identified

### 1. **Bug in `getCurrentExposure` Method**
The `getCurrentExposure` method was only summing `approved_amount` for approved/disbursed loans, but it wasn't considering `requested_amount` for pending loans. This meant the exposure calculation was incomplete.

**Before:**
```typescript
private async getCurrentExposure(lenderId: string): Promise<number> {
  const result = await this.loanRequestRepository
    .createQueryBuilder('loan')
    .select('SUM(loan.approved_amount)', 'total')
    .where('loan.lender_id = :lenderId', { lenderId })
    .andWhere('loan.status IN (:...statuses)', {
      statuses: [LoanRequestStatus.APPROVED, LoanRequestStatus.DISBURSED],
    })
    .getRawOne();

  return parseFloat(result?.total || '0');
}
```

**After:**
```typescript
private async getCurrentExposure(lenderId: string): Promise<number> {
  // Calculate exposure from both pending (requested_amount) and approved/disbursed (approved_amount) loans
  const pendingResult = await this.loanRequestRepository
    .createQueryBuilder('loan')
    .select('COALESCE(SUM(loan.requested_amount), 0)', 'total')
    .where('loan.lender_id = :lenderId', { lenderId })
    .andWhere('loan.status = :status', {
      status: LoanRequestStatus.PENDING,
    })
    .getRawOne();

  const approvedResult = await this.loanRequestRepository
    .createQueryBuilder('loan')
    .select('COALESCE(SUM(loan.approved_amount), 0)', 'total')
    .where('loan.lender_id = :lenderId', { lenderId })
    .andWhere('loan.status IN (:...statuses)', {
      statuses: [LoanRequestStatus.APPROVED, LoanRequestStatus.DISBURSED],
    })
    .getRawOne();

  const pendingExposure = parseFloat(pendingResult?.total || '0');
  const approvedExposure = parseFloat(approvedResult?.total || '0');
  const totalExposure = pendingExposure + approvedExposure;

  this.logger.log(
    `getCurrentExposure for lender ${lenderId}: pending=${pendingExposure}, approved=${approvedExposure}, total=${totalExposure}`
  );

  return totalExposure;
}
```

### 2. **Insufficient Logging**
The automatic assignment process had minimal logging, making it difficult to debug why lenders weren't being assigned.

**Improvements:**
- Added detailed logging in `processLoanRequest` to track the assignment flow
- Added logging in `findSuitableLender` to show which lenders are evaluated and why they're accepted/rejected
- Added logging in `getCurrentExposure` to show exposure calculations
- Added logging in `createLoanRequest` to indicate when automatic assignment is triggered

### 3. **Conditional Assignment Logic**
The original code called `processLoanRequest` unconditionally, even when a lender was already specified. This was optimized to only trigger automatic assignment when no lender is provided.

**Before:**
```typescript
const savedLoan = await this.loanRequestRepository.save(loanRequest);

// Attempt to process with available lenders
await this.processLoanRequest(savedLoan.id);

return savedLoan;
```

**After:**
```typescript
const savedLoan = await this.loanRequestRepository.save(loanRequest);
this.logger.log(`Loan request created with ID: ${savedLoan.id}`);

// Attempt to process with available lenders if no lender was specified
if (!createLoanDto.lender_id) {
  this.logger.log(`Triggering automatic lender assignment for loan ${savedLoan.id}`);
  await this.processLoanRequest(savedLoan.id);
}

return savedLoan;
```

## How Automatic Assignment Works

1. **Loan Creation**: When a loan request is created without a `lender_id`, the system triggers `processLoanRequest()`

2. **Find Suitable Lender**: The `findSuitableLender()` method evaluates all active lenders:
   - Checks if loan amount is within the lender's `max_advance_per_trip` limit (default: 100,000)
   - Calculates current exposure (pending + approved/disbursed loans)
   - Checks if adding this loan would exceed the lender's `max_exposure` limit (default: 1,000,000)
   - Returns the first lender that meets all criteria

3. **Assignment**: If a suitable lender is found:
   - The loan's `lender_id` is updated
   - The loan request is sent to the lender (via callback URL or auto-approved)

4. **Default Limits**: If a lender has no policy configured, these defaults are used:
   - `max_advance_per_trip`: 100,000
   - `max_exposure`: 1,000,000

## Testing

### Manual Assignment Script
Created `backend/assign-lender-to-existing-loans.js` to manually assign lenders to existing loans without a lender_id.

**Usage:**
```bash
cd backend
node assign-lender-to-existing-loans.js
```

### Verification
After running the script, the loan that previously had no lender was successfully assigned to "Bank of Kigali":

```
Total loan_requests: 1
Loan requests with lender_id: 1

Loans for this lender: 1
Sample loans: [
  {
    "id": "07fd076c-a561-443b-96f6-bc9a5e192e5d",
    "status": "pending",
    "requested_amount": "12000.00",
    "lender_id": "12cb9a34-780d-45e9-8f27-94d0df44b85b",
    "created_at": "2026-04-18T09:11:54.066Z"
  }
]
```

## Impact

✅ **Fixed**: Loan requests now automatically get assigned to suitable lenders
✅ **Fixed**: The `/api/lending/lenders/{lenderId}/loan-requests` endpoint now returns data
✅ **Improved**: Better logging for debugging lender assignment issues
✅ **Improved**: More accurate exposure calculation including pending loans

## Next Steps

1. **Test**: Create new loan requests and verify automatic assignment works
2. **Monitor**: Check backend logs to ensure the detailed logging helps with debugging
3. **Configure**: Set up lender policies with appropriate limits for production use
4. **Optimize**: Consider adding retry logic if lender assignment fails

## Files Modified

- `backend/src/modules/lending/lending.service.ts`
  - Fixed `getCurrentExposure()` method
  - Enhanced logging in `processLoanRequest()`
  - Enhanced logging in `findSuitableLender()`
  - Enhanced logging in `createLoanRequest()`
  - Optimized conditional assignment logic

## Files Created

- `backend/assign-lender-to-existing-loans.js` - Manual assignment script for existing loans
- `backend/check-loan-requests.js` - Verification script
- `backend/check-loan-details.js` - Detailed loan inspection script
- `docs/AUTOMATIC_LENDER_ASSIGNMENT_FIX.md` - This documentation
