export class LendingException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'LendingException';
  }
}

export class InsufficientCreditException extends LendingException {
  constructor(tenantId: string, requestedAmount: number, availableCredit: number) {
    super(
      `Insufficient credit available. Requested: ${requestedAmount}, Available: ${availableCredit}`,
      'INSUFFICIENT_CREDIT',
      400,
      { tenantId, requestedAmount, availableCredit }
    );
  }
}

export class LoanLimitExceededException extends LendingException {
  constructor(tenantId: string, requestedAmount: number, maxLoanAmount: number) {
    super(
      `Loan amount exceeds maximum limit. Requested: ${requestedAmount}, Max: ${maxLoanAmount}`,
      'LOAN_LIMIT_EXCEEDED',
      400,
      { tenantId, requestedAmount, maxLoanAmount }
    );
  }
}

export class DuplicateLoanRequestException extends LendingException {
  constructor(idempotencyKey: string) {
    super(
      `Duplicate loan request detected with idempotency key: ${idempotencyKey}`,
      'DUPLICATE_LOAN_REQUEST',
      409,
      { idempotencyKey }
    );
  }
}

export class LenderNotAvailableException extends LendingException {
  constructor(lenderId: string, reason: string) {
    super(
      `Lender is not available: ${reason}`,
      'LENDER_NOT_AVAILABLE',
      400,
      { lenderId, reason }
    );
  }
}

export class InvalidLoanStateException extends LendingException {
  constructor(currentStatus: string, requiredStatus: string, operation: string) {
    super(
      `Invalid loan state for operation. Current: ${currentStatus}, Required: ${requiredStatus}, Operation: ${operation}`,
      'INVALID_LOAN_STATE',
      400,
      { currentStatus, requiredStatus, operation }
    );
  }
}
