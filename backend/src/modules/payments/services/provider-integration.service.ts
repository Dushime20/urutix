import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PaymentProvider } from '../types/payment.types';
import { Payment } from '../../../entities/payment.entity';
import { MobileMoneyPaymentService } from './mobile-money-payment.service';

export interface PaymentProcessingResult {
  success: boolean;
  transactionId?: string;
  response: string;
  processingFee?: number;
  error?: string;
  errorCode?: string;
}

export interface ProviderConfig {
  apiUrl: string;
  apiKey: string;
  webhookUrl: string;
  timeout: number;
  retryAttempts: number;
}

@Injectable()
export class ProviderIntegrationService {
  private readonly logger = new Logger(ProviderIntegrationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => MobileMoneyPaymentService))
    private readonly mobileMoneyPaymentService?: MobileMoneyPaymentService,
  ) {}

  async processPayment(
    provider: PaymentProvider,
    paymentType: string,
    amount: number,
    currency: string,
    meta: any = {},
  ): Promise<PaymentProcessingResult> {
    try {
      // Validate inputs
      this.validatePaymentRequest(amount, currency, paymentType);

      // Use Mobile Money Payment service if provider is MOBILE_MONEY and service is configured
      if (provider === PaymentProvider.MOBILE_MONEY && this.mobileMoneyPaymentService) {
        return await this.processMobileMoneyPayment(amount, currency, paymentType, meta);
      }

      // Fallback to generic payment processing
      const providerConfig = this.getProviderConfig(provider);

      // Prepare payment payload
      const payload = this.buildPaymentPayload(
        provider,
        amount,
        currency,
        paymentType,
        meta,
      );

      // Process payment with retry logic
      const response = await this.processWithRetry(providerConfig, payload);

      // Parse and validate response
      return this.parsePaymentResponse(response, provider);
    } catch (error) {
      this.logger.error(
        `Payment processing failed for provider ${provider}:`,
        error,
      );
      return this.handlePaymentError(error);
    }
  }

  /**
   * Process payment using Mobile Money Payment service.
   *
   * Two patterns are supported via meta fields:
   *
   * 1. COLLECTION (user → platform) — used by initiateMobileMoneyPayment
   *    meta.phoneNumber      = user's phone (payer, gets PIN popup, is charged)
   *    receiver              = MOBILE_MONEY_ACCOUNT_PHONE (platform ishema account)
   *
   * 2. DISBURSEMENT (platform → beneficiary) — used by sendMobileMoneyPayment
   *    meta.phoneNumber      = MOBILE_MONEY_ACCOUNT_PHONE (payer, platform account)
   *    meta.receiverPhoneNumber = truck owner / lender phone (receiver)
   *    (sendMobileMoneyPayment builds transfers itself and calls createTransaction
   *     directly, so it never reaches this method)
   */
  private async processMobileMoneyPayment(
    amount: number,
    currency: string,
    paymentType: string,
    meta: any,
  ): Promise<PaymentProcessingResult> {
    try {
      // The payer is always the phone number that will be charged (gets PIN popup)
      const payerPhone = meta.phoneNumber || meta.phone || meta.payerPhone;

      if (!payerPhone) {
        throw new BadRequestException(
          'Phone number is required for Mobile Money payment.',
        );
      }

      const referenceId =
        meta.referenceNumber ||
        meta.referenceId ||
        meta.externalId ||
        `MM-${Date.now()}`;

      const senderMessage =
        meta.description ||
        meta.senderMessage ||
        meta.message ||
        'Payment for cargo transportation';

      const callbackUrl =
        meta.callbackUrl ||
        this.configService.get<string>('MOBILE_MONEY_CALLBACK_URL');

      // --- Resolve transfers ---
      // If the caller pre-built transfers (e.g. split payments), use them as-is.
      // Otherwise this is a COLLECTION: user's phone is charged and the platform
      // account (MOBILE_MONEY_ACCOUNT_PHONE) receives the funds.
      let transfers: { percentage: number; phoneNumber: string; receiverMessage: string }[];

      if (meta.transfers && meta.transfers.length > 0) {
        transfers = meta.transfers;
      } else {
        const platformPhone = this.configService.get<string>('MOBILE_MONEY_ACCOUNT_PHONE');
        if (!platformPhone) {
          throw new BadRequestException(
            'MOBILE_MONEY_ACCOUNT_PHONE is not configured. ' +
            'This is required as the receiver for user payment collection.',
          );
        }
        // Collection: user pays → money goes to platform's ishema account
        transfers = [
          {
            percentage: 100,
            phoneNumber: platformPhone,
            receiverMessage: senderMessage.substring(0, 160),
          },
        ];
      }

      this.logger.log(
        `Processing Mobile Money COLLECTION: ${amount} ${currency} ` +
        `| payer: ${payerPhone} ` +
        `| receiver: ${transfers.map((t) => t.phoneNumber).join(', ')} ` +
        `| reference: ${referenceId}`,
      );

      const mobileMoneyResponse =
        await this.mobileMoneyPaymentService.createTransaction(
          amount,
          payerPhone,
          referenceId,
          senderMessage,
          transfers,
          callbackUrl,
        );

      const transaction =
        mobileMoneyResponse.savedTransaction || mobileMoneyResponse.transaction;
      const status = transaction?.status || 'pending';
      const transactionId =
        transaction?.externalId || transaction?.id || referenceId;

      this.logger.log(
        `Mobile Money transaction created: ${transactionId}, status: ${status}`,
      );

      return {
        success: status === 'success' || status === 'pending',
        transactionId,
        response: JSON.stringify(mobileMoneyResponse),
        processingFee: 0,
        error: status === 'failed' ? 'Payment failed' : undefined,
        errorCode: status === 'failed' ? 'MOBILE_MONEY_PAYMENT_FAILED' : undefined,
      };
    } catch (error: any) {
      this.logger.error('Mobile Money payment processing failed:', error);
      return {
        success: false,
        response: JSON.stringify(error.response?.data || error.message || error),
        error: error.message || 'Mobile Money payment failed',
        errorCode:
          error.response?.status === 401
            ? 'MOBILE_MONEY_AUTH_ERROR'
            : 'MOBILE_MONEY_PAYMENT_ERROR',
      };
    }
  }


  private validatePaymentRequest(
    amount: number,
    currency: string,
    paymentType: string,
  ): void {
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (amount > 9999999.99) {
      throw new BadRequestException('Payment amount exceeds maximum limit');
    }

    if (!currency || currency.length !== 3) {
      throw new BadRequestException('Invalid currency code');
    }

    if (!paymentType) {
      throw new BadRequestException('Payment type is required');
    }
  }

  private buildPaymentPayload(
    provider: PaymentProvider,
    amount: number,
    currency: string,
    paymentType: string,
    meta: any,
  ): any {
    const basePayload = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toUpperCase(),
      payment_type: paymentType,
      metadata: meta,
      timestamp: new Date().toISOString(),
    };

    switch (provider) {
      case PaymentProvider.MOBILE_MONEY:
        return {
          ...basePayload,
          callback_url: this.configService.get('MOBILE_MONEY_WEBHOOK_URL'),
          provider: 'mobile_money',
        };

      case PaymentProvider.BANK_TRANSFER:
        return {
          ...basePayload,
          callback_url: this.configService.get('BANK_TRANSFER_WEBHOOK_URL'),
          provider: 'bank_transfer',
          account_details: meta.accountDetails,
        };

      case PaymentProvider.MICRO_LENDING:
        return {
          ...basePayload,
          callback_url: this.configService.get('MICRO_LENDING_WEBHOOK_URL'),
          provider: 'micro_lending',
          loan_terms: meta.loanTerms,
        };

      default:
        throw new BadRequestException(
          `Unsupported payment provider: ${provider}`,
        );
    }
  }

  private async processWithRetry(
    config: ProviderConfig,
    payload: any,
  ): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        this.logger.debug(
          `Payment attempt ${attempt}/${config.retryAttempts} for provider`,
        );

        const response = await firstValueFrom(
          this.httpService.post(config.apiUrl + '/payments', payload, {
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'CargoAI-Payment-Service/1.0',
            },
            timeout: config.timeout,
          }) as any,
        );

        return (response as any).data;
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }

        // Log retry attempt
        this.logger.warn(
          `Payment attempt ${attempt} failed, retrying...`,
          error.message,
        );

        // Wait before retry (exponential backoff)
        if (attempt < config.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError;
  }

  private parsePaymentResponse(
    response: any,
    provider: PaymentProvider,
  ): PaymentProcessingResult {
    try {
      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format from payment provider');
      }

      const success =
        response.status === 'success' || response.status === 'completed';

      return {
        success,
        transactionId:
          response.transaction_id || response.id || response.reference,
        response: JSON.stringify(response),
        processingFee: response.processing_fee || response.fee || 0,
        error: success
          ? undefined
          : response.error || response.message || 'Payment failed',
        errorCode: success
          ? undefined
          : response.error_code || response.code || 'UNKNOWN_ERROR',
      };
    } catch (error) {
      this.logger.error('Failed to parse payment response:', error);
      return {
        success: false,
        response: JSON.stringify(response),
        error: 'Failed to parse payment response',
        errorCode: 'PARSE_ERROR',
      };
    }
  }

  private handlePaymentError(error: any): PaymentProcessingResult {
    // Handle specific error types
    if (error.response?.status === 401) {
      return {
        success: false,
        response: JSON.stringify(error.response?.data),
        error: 'Authentication failed with payment provider',
        errorCode: 'AUTH_ERROR',
      };
    }

    if (error.response?.status === 402) {
      return {
        success: false,
        response: JSON.stringify(error.response?.data),
        error: 'Payment declined by provider',
        errorCode: 'PAYMENT_DECLINED',
      };
    }

    if (error.response?.status === 422) {
      return {
        success: false,
        response: JSON.stringify(error.response?.data),
        error: 'Invalid payment data',
        errorCode: 'INVALID_DATA',
      };
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return {
        success: false,
        response: JSON.stringify(error),
        error: 'Payment provider timeout',
        errorCode: 'TIMEOUT',
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        success: false,
        response: JSON.stringify(error),
        error: 'Payment provider unavailable',
        errorCode: 'PROVIDER_UNAVAILABLE',
      };
    }

    // Generic error handling
    return {
      success: false,
      response: JSON.stringify(error.response?.data || error),
      error: error.message || 'Payment processing failed',
      errorCode: 'UNKNOWN_ERROR',
    };
  }

  private getProviderConfig(provider: PaymentProvider): ProviderConfig {
    const configs: Record<PaymentProvider, ProviderConfig> = {
      [PaymentProvider.MOBILE_MONEY]: {
        apiUrl: this.configService.get('MOBILE_MONEY_API_URL') || '',
        apiKey: this.configService.get('MOBILE_MONEY_API_KEY') || '',
        webhookUrl: this.configService.get('MOBILE_MONEY_WEBHOOK_URL') || '',
        timeout: 30000,
        retryAttempts: 3,
      },
      [PaymentProvider.BANK_TRANSFER]: {
        apiUrl: this.configService.get('BANK_TRANSFER_API_URL') || '',
        apiKey: this.configService.get('BANK_TRANSFER_API_KEY') || '',
        webhookUrl: this.configService.get('BANK_TRANSFER_WEBHOOK_URL') || '',
        timeout: 45000,
        retryAttempts: 2,
      },
      [PaymentProvider.MICRO_LENDING]: {
        apiUrl: this.configService.get('MICRO_LENDING_API_URL') || '',
        apiKey: this.configService.get('MICRO_LENDING_API_KEY') || '',
        webhookUrl: this.configService.get('MICRO_LENDING_WEBHOOK_URL') || '',
        timeout: 60000,
        retryAttempts: 2,
      },
    };

    const config = configs[provider];

    if (!config || !config.apiUrl || !config.apiKey) {
      throw new BadRequestException(
        `Invalid configuration for provider: ${provider}`,
      );
    }

    return config;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Health check method for monitoring
  async healthCheck(provider: PaymentProvider): Promise<boolean> {
    try {
      const config = this.getProviderConfig(provider);

      const response = await firstValueFrom(
        this.httpService.get(config.apiUrl + '/health', {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
          timeout: 10000,
        }) as any,
      );

      return (response as any).status === 200;
    } catch (error) {
      this.logger.error(`Health check failed for provider ${provider}:`, error);
      return false;
    }
  }
}
