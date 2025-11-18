import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';

/**
 * Payment not found exception
 */
export class PaymentNotFoundException extends NotFoundException {
  constructor(paymentId: string) {
    super(`Payment with ID ${paymentId} not found`);
  }
}

/**
 * Payment already exists exception
 */
export class PaymentAlreadyExistsException extends ConflictException {
  constructor(tripId: string) {
    super(`Payment already exists for trip ${tripId}`);
  }
}

/**
 * Payment processing exception
 */
export class PaymentProcessingException extends ConflictException {
  constructor(
    message: string,
    public readonly paymentId: string,
    public readonly errorCode: string,
  ) {
    super(`Payment processing failed: ${message}`);
  }
}

/**
 * Payment fraud detected exception
 */
export class PaymentFraudDetectedException extends ConflictException {
  constructor(paymentId: string, reason: string) {
    super(`Fraud detected for payment ${paymentId}: ${reason}`);
  }
}

/**
 * Payment provider failure exception
 */
export class PaymentProviderFailureException extends InternalServerErrorException {
  constructor(provider: string, error: string) {
    super(`Payment provider ${provider} failure: ${error}`);
  }
}

/**
 * Payment validation exception
 */
export class PaymentValidationException extends BadRequestException {
  constructor(field: string, value: any, reason: string) {
    super(`Payment validation failed for ${field} (${value}): ${reason}`);
  }
}

/**
 * Payment amount exception
 */
export class PaymentAmountException extends BadRequestException {
  constructor(amount: number, reason: string) {
    super(`Invalid payment amount ${amount}: ${reason}`);
  }
}

/**
 * Payment currency exception
 */
export class PaymentCurrencyException extends BadRequestException {
  constructor(currency: string) {
    super(
      `Invalid currency code: ${currency}. Must be a 3-letter ISO currency code.`,
    );
  }
}

/**
 * Payment method not supported exception
 */
export class PaymentMethodNotSupportedException extends BadRequestException {
  constructor(method: string) {
    super(`Payment method ${method} is not supported`);
  }
}

/**
 * Payment status transition exception
 */
export class PaymentStatusTransitionException extends ConflictException {
  constructor(currentStatus: string, targetStatus: string) {
    super(`Invalid status transition from ${currentStatus} to ${targetStatus}`);
  }
}

/**
 * Payment refund exception
 */
export class PaymentRefundException extends ConflictException {
  constructor(paymentId: string, reason: string) {
    super(`Cannot refund payment ${paymentId}: ${reason}`);
  }
}

/**
 * Payment escrow exception
 */
export class PaymentEscrowException extends ConflictException {
  constructor(paymentId: string, reason: string) {
    super(`Escrow operation failed for payment ${paymentId}: ${reason}`);
  }
}

/**
 * Payment reconciliation exception
 */
export class PaymentReconciliationException extends BadRequestException {
  constructor(reason: string) {
    super(`Payment reconciliation failed: ${reason}`);
  }
}

/**
 * Payment rate limit exception
 */
export class PaymentRateLimitException extends ConflictException {
  constructor(retryAfter: number) {
    super(
      `Payment rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
    );
  }
}

/**
 * Payment permission exception
 */
export class PaymentPermissionException extends ForbiddenException {
  constructor(userId: string, action: string) {
    super(`User ${userId} does not have permission to ${action} this payment`);
  }
}

/**
 * Payment tenant mismatch exception
 */
export class PaymentTenantMismatchException extends ForbiddenException {
  constructor(paymentId: string, tenantId: string) {
    super(`Payment ${paymentId} does not belong to tenant ${tenantId}`);
  }
}

/**
 * Payment idempotency exception
 */
export class PaymentIdempotencyException extends ConflictException {
  constructor(idempotencyKey: string) {
    super(
      `Duplicate request detected. Idempotency key ${idempotencyKey} already used.`,
    );
  }
}

/**
 * Payment webhook exception
 */
export class PaymentWebhookException extends BadRequestException {
  constructor(provider: string, reason: string) {
    super(`Webhook processing failed for provider ${provider}: ${reason}`);
  }
}

/**
 * Payment micro-lending exception
 */
export class PaymentMicroLendingException extends BadRequestException {
  constructor(paymentId: string, reason: string) {
    super(`Micro-lending operation failed for payment ${paymentId}: ${reason}`);
  }
}

/**
 * Payment audit exception
 */
export class PaymentAuditException extends InternalServerErrorException {
  constructor(action: string, reason: string) {
    super(`Payment audit logging failed for action ${action}: ${reason}`);
  }
}

/**
 * Payment configuration exception
 */
export class PaymentConfigurationException extends InternalServerErrorException {
  constructor(provider: string, configKey: string) {
    super(
      `Missing or invalid configuration for payment provider ${provider}: ${configKey}`,
    );
  }
}

/**
 * Payment timeout exception
 */
export class PaymentTimeoutException extends InternalServerErrorException {
  constructor(provider: string, timeout: number) {
    super(`Payment provider ${provider} request timed out after ${timeout}ms`);
  }
}

/**
 * Payment network exception
 */
export class PaymentNetworkException extends InternalServerErrorException {
  constructor(provider: string, error: string) {
    super(
      `Network error while communicating with payment provider ${provider}: ${error}`,
    );
  }
}

/**
 * Payment data integrity exception
 */
export class PaymentDataIntegrityException extends InternalServerErrorException {
  constructor(paymentId: string, field: string) {
    super(
      `Data integrity check failed for payment ${paymentId}, field: ${field}`,
    );
  }
}
