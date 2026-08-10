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
 * Collection pattern  (user pays platform) — USSD reliably fires:
 *   phoneNumber  = user's phone         ← charged
 *   transfers[0] = MOBILE_MONEY_ACCOUNT_PHONE  ← receives funds
 *
 * Disbursement / payout (platform pays beneficiary):
 *   phoneNumber  = MOBILE_MONEY_ACCOUNT_PHONE  ← charged (PIN on merchant SIM)
 *   transfers[0] = beneficiary phone           ← receives funds
 *
 * IMPORTANT: lender → truck-owner direct (P2P) does NOT reliably push USSD on Ishema.
 * Loan disbursement uses collection then payout (two legs).
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
    const currencyRaw = this.configService.get<string>('MOBILE_MONEY_CURRENCY');
    if (!currencyRaw || !/^[A-Z]{3}$/i.test(currencyRaw)) {
      throw new BadRequestException(
        'MOBILE_MONEY_CURRENCY must be configured as a valid ISO 4217 code.',
      );
    }
    // Ishema Rwanda only supports RWF regardless of env default
    const currency = apiUrl.includes('ishema.rw')
      ? 'RWF'
      : currencyRaw.toUpperCase();
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
   * Format phone number to ishema format: 250XXXXXXXXX (12 digits, no +).
   * This is the number that receives the MoMo PIN / USSD popup when used as payer.
   */
  formatPhoneNumber(phone: string): string {
    if (!phone || typeof phone !== 'string') {
      throw new BadRequestException('Phone number is required.');
    }

    let cleaned = phone.replace(/\D/g, '');

    // Strip leading trunk zeros (0788… → 788…, 00250… → 250…)
    while (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    if (!cleaned.startsWith('250')) {
      cleaned = '250' + cleaned;
    }

    // Rwanda Mobile Numbers: 250 + 9 digits = 12 total digits
    // MTN (078/079), Airtel (072/073)
    if (!/^250(78|79|72|73)\d{7}$/.test(cleaned)) {
      throw new BadRequestException(
        `Invalid mobile money phone "${phone}". Rwanda mobile numbers: 250 + 9 digits (12 total). Examples: 250781234567 (MTN), 250791234567 (MTN), 250721234567 (Airtel), 250731234567 (Airtel).`,
      );
    }

    return cleaned;
  }

  /**
   * Detect mobile network operator from phone number
   */
  detectNetworkOperator(phoneNumber: string): 'MTN' | 'AIRTEL' | 'UNKNOWN' {
    const cleaned = this.formatPhoneNumber(phoneNumber);
    
    if (/^250(78|79)\d{7}$/.test(cleaned)) {
      return 'MTN';
    } else if (/^250(72|73)\d{7}$/.test(cleaned)) {
      return 'AIRTEL';
    }
    
    return 'UNKNOWN';
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
    const networkOperator = this.detectNetworkOperator(payerPhone);
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
          `| payer: ${formattedPayer} (${networkOperator}) ` +
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
