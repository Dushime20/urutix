import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface MobileMoneyConfig {
  apiUrl: string;
  apiKey: string;
  callbackUrl: string;
  currency: string;
  accountPhoneNumber?: string; // Platform's ishema-registered account phone
}

export interface MobileMoneyTransfer {
  percentage: number;
  phoneNumber: string;
  receiverMessage: string;
}

/**
 * Payload sent to the ishema API.
 *
 * Field semantics:
 *   phoneNumber  – the PAYER (the phone that gets the PIN popup and is charged)
 *   transfers[]  – the RECEIVER(S) of the money (REQUIRED by the API)
 *
 * Collection pattern  (user pays platform):
 *   phoneNumber  = user's phone         ← charged
 *   transfers[0] = MOBILE_MONEY_ACCOUNT_PHONE  ← receives funds
 *
 * Disbursement pattern (platform pays truck owner / lender):
 *   phoneNumber  = MOBILE_MONEY_ACCOUNT_PHONE  ← charged (platform account)
 *   transfers[0] = truck owner / lender phone  ← receives funds
 */
export interface MobileMoneyCreateTransactionRequest {
  amount: number;
  callbackUrl: string;
  currency: string;
  phoneNumber: string;
  referenceId: string;
  senderMessage: string;
  transfers: MobileMoneyTransfer[]; // REQUIRED by the ishema API — never omit
}

export interface MobileMoneyTransactionResponse {
  savedTransaction?: {
    id: string;
    externalId: string;
    referenceId: string;
    amount: number;
    currency: string;
    phoneNumber: string;
    status: string;
    createdAt: string;
    callbackUrl: string;
  };
  transaction?: {
    id: string;
    externalId: string;
    referenceId: string;
    amount: number;
    currency: string;
    phoneNumber: string;
    status: 'pending' | 'success' | 'failed';
    createdAt: string;
    callbackUrl: string;
  };
}

export interface MobileMoneyCallbackPayload {
  referenceId: string;
  status: 'success' | 'failed' | 'pending';
  statusCode: number;
  date: string;
  amount: number;
  message: string;
}

@Injectable()
export class MobileMoneyPaymentService {
  private readonly logger = new Logger(MobileMoneyPaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Get Mobile Money Payment configuration
   */
  private getConfig(): MobileMoneyConfig {
    const apiUrl =
      this.configService.get<string>('MOBILE_MONEY_API_URL') ||
      'https://api.payment.ishema.rw';
    const apiKey = this.configService.get<string>('MOBILE_MONEY_API_KEY');
    const callbackUrl =
      this.configService.get<string>('MOBILE_MONEY_CALLBACK_URL') || '';
    const currency =
      this.configService.get<string>('MOBILE_MONEY_CURRENCY') || 'RWF';
    const accountPhoneNumber = this.configService.get<string>(
      'MOBILE_MONEY_ACCOUNT_PHONE',
    );

    if (!apiKey) {
      throw new BadRequestException(
        'Mobile Money API key is not configured. Set MOBILE_MONEY_API_KEY.',
      );
    }

    if (!accountPhoneNumber) {
      throw new BadRequestException(
        'Mobile Money account phone is not configured. Set MOBILE_MONEY_ACCOUNT_PHONE.',
      );
    }

    return { apiUrl, apiKey, callbackUrl, currency, accountPhoneNumber };
  }

  /**
   * Format phone number to ishema format: 250XXXXXXXXX (12 digits, no +)
   */
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    if (!cleaned.startsWith('250')) {
      cleaned = '250' + cleaned;
    }

    return cleaned;
  }

  /**
   * Create a Mobile Money transaction.
   *
   * Callers MUST supply the correctly-oriented transfers array:
   *
   *   Collection (user → platform):
   *     payerPhone  = user phone
   *     transfers   = [{ percentage: 100, phoneNumber: MOBILE_MONEY_ACCOUNT_PHONE }]
   *
   *   Disbursement (platform → beneficiary):
   *     payerPhone  = MOBILE_MONEY_ACCOUNT_PHONE
   *     transfers   = [{ percentage: 100, phoneNumber: beneficiaryPhone }]
   *
   * The `transfers` array is REQUIRED by the ishema API.
   */
  async createTransaction(
    amount: number,
    payerPhone: string,
    referenceId: string,
    senderMessage: string = 'Payment for cargo transportation',
    transfers: MobileMoneyTransfer[],
    callbackUrl?: string,
  ): Promise<MobileMoneyTransactionResponse> {
    const config = this.getConfig();

    // Guard: transfers must always be provided
    if (!transfers || transfers.length === 0) {
      throw new BadRequestException(
        'transfers array is required. ' +
          'Collection: receiver = platform account. ' +
          'Disbursement: receiver = beneficiary phone.',
      );
    }

    // Validate percentages sum to exactly 100
    const totalPct = transfers.reduce((sum, t) => sum + t.percentage, 0);
    if (totalPct !== 100) {
      throw new BadRequestException(
        `Transfer percentages must sum to 100 (got ${totalPct}).`,
      );
    }

    const formattedPayer = this.formatPhoneNumber(payerPhone);
    const truncatedMessage = senderMessage.substring(0, 160);

    const formattedTransfers: MobileMoneyTransfer[] = transfers.map((t) => ({
      percentage: t.percentage,
      phoneNumber: this.formatPhoneNumber(t.phoneNumber),
      receiverMessage: t.receiverMessage.substring(0, 160),
    }));

    const payload: MobileMoneyCreateTransactionRequest = {
      amount: Math.round(amount), // API expects whole numbers (RWF has no cents)
      callbackUrl: callbackUrl || config.callbackUrl,
      currency: config.currency,
      phoneNumber: formattedPayer,
      referenceId,
      senderMessage: truncatedMessage,
      transfers: formattedTransfers,
    };

    try {
      this.logger.log(
        `Creating Mobile Money transaction: ${payload.amount} ${config.currency} ` +
          `| payer: ${formattedPayer} ` +
          `| receiver(s): ${formattedTransfers.map((t) => t.phoneNumber).join(', ')} ` +
          `| reference: ${referenceId}`,
      );

      const response: any = await firstValueFrom(
        this.httpService.post(
          `${config.apiUrl}/api/v3/transaction?apiKey=${config.apiKey}`,
          payload,
          {
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        ) as any,
      );

      const transactionData: MobileMoneyTransactionResponse = response.data;

      const externalId =
        transactionData.savedTransaction?.externalId ||
        transactionData.transaction?.externalId;
      this.logger.log(`Mobile Money transaction created: externalId=${externalId}`);

      return transactionData;
    } catch (error: any) {
      this.logger.error('Mobile Money transaction creation failed:', error);

      // Log the full API error body for debugging
      if (error.response?.data) {
        this.logger.error(
          'API error response:',
          JSON.stringify(error.response.data),
        );
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Payment request failed';

      throw new BadRequestException(`Mobile Money payment failed: ${errorMessage}`);
    }
  }

  /**
   * Check transaction status by reference ID
   */
  async checkTransactionStatus(
    referenceId: string,
  ): Promise<MobileMoneyTransactionResponse> {
    const config = this.getConfig();

    try {
      const response: any = await firstValueFrom(
        this.httpService.get(
          `${config.apiUrl}/api/v3/transaction/${referenceId}?apiKey=${config.apiKey}`,
          {
            headers: { accept: 'application/json' },
            timeout: 30000,
          },
        ) as any,
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to check transaction status for ${referenceId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to check transaction status from Mobile Money provider.',
      );
    }
  }

  /**
   * Verify callback signature (implement when provider adds webhook signing)
   */
  verifyCallbackSignature(payload: any, signature?: string): boolean {
    // TODO: implement HMAC verification once ishema provides webhook signing
    return true;
  }

  /**
   * Process callback from Mobile Money provider
   */
  async processCallback(payload: MobileMoneyCallbackPayload): Promise<{
    referenceId: string;
    status: 'success' | 'failed' | 'pending';
    amount: number;
    message: string;
  }> {
    try {
      this.logger.log(
        `Mobile Money callback received: ${payload.referenceId} → ${payload.status}`,
      );

      return {
        referenceId: payload.referenceId,
        status: payload.status,
        amount: payload.amount,
        message: payload.message || 'Payment processed',
      };
    } catch (error: any) {
      this.logger.error('Failed to process Mobile Money callback:', error);
      throw error;
    }
  }

  /**
   * Health check — confirms API key and account phone are configured
   */
  async healthCheck(): Promise<boolean> {
    try {
      const config = this.getConfig();
      return !!config.apiKey && !!config.accountPhoneNumber;
    } catch (error) {
      this.logger.error('Mobile Money health check failed:', error);
      return false;
    }
  }
}
