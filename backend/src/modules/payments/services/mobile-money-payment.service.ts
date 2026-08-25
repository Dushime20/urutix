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
    
    // Log configuration status (without sensitive values)
    this.logger.debug(`Mobile Money Config Check:`);
    this.logger.debug(`API URL: ${apiUrl}`);
    this.logger.debug(`API Key: ${apiKey ? '[CONFIGURED]' : '[MISSING]'}`);
    this.logger.debug(`Callback URL: ${callbackUrl || '[EMPTY]'}`);
    this.logger.debug(`Currency: ${currencyRaw || '[NOT SET]'}`);
    
    if (!currencyRaw || !/^[A-Z]{3}$/i.test(currencyRaw)) {
      this.logger.error('MOBILE_MONEY_CURRENCY must be configured as a valid ISO 4217 code.');
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
    
    this.logger.debug(`Account Phone: ${accountPhoneNumber ? '[CONFIGURED]' : '[MISSING]'}`);

    if (!apiKey) {
      this.logger.error('Mobile Money API key is not configured. Set MOBILE_MONEY_API_KEY.');
      throw new BadRequestException(
        'Mobile Money API key is not configured. Set MOBILE_MONEY_API_KEY.',
      );
    }

    if (!accountPhoneNumber) {
      this.logger.error('Mobile Money account phone is not configured. Set MOBILE_MONEY_ACCOUNT_PHONE.');
      throw new BadRequestException(
        'Mobile Money account phone is not configured. Set MOBILE_MONEY_ACCOUNT_PHONE.',
      );
    }

    return { apiUrl, apiKey, callbackUrl, currency, accountPhoneNumber };
  }

  /**
   * Canonical Rwanda MSISDN: 250XXXXXXXXX (12 digits, no +).
   * Use this for validation and storage. The Ishema HTTP payload uses
   * {@link toIshemaApiPhoneNumber} (`0783544364` per CreateTransactionDto).
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
   * Phone format required by Ishema CreateTransactionDto (example: `0783544364`).
   * @see https://api.payment.ishema.rw/api/v3/docs/index.html
   */
  toIshemaApiPhoneNumber(phone: string): string {
    const canonical = this.formatPhoneNumber(phone);
    return `0${canonical.slice(3)}`;
  }

  extractCreatedAt(response?: MobileMoneyTransactionResponse | Record<string, any>): string | undefined {
    const extra = (response || {}) as Record<string, any>;
    const value =
      extra.savedTransaction?.createdAt ||
      extra.transaction?.createdAt ||
      extra.createdAt ||
      extra.date;
    return typeof value === 'string' && value ? value : undefined;
  }

  extractExternalId(response?: MobileMoneyTransactionResponse | Record<string, any>): string | undefined {
    const extra = (response || {}) as Record<string, any>;
    const value =
      extra.savedTransaction?.externalId ||
      extra.transaction?.externalId ||
      extra.externalId ||
      extra.data?.externalId;
    return typeof value === 'string' && value ? value : undefined;
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

    const formattedPayer = this.toIshemaApiPhoneNumber(payerPhone);
    const networkOperator = this.detectNetworkOperator(payerPhone);
    const truncatedMessage = senderMessage.substring(0, 160);
    const chargedAmount = Math.round(amount);
    if (!Number.isFinite(chargedAmount) || chargedAmount < 5) {
      throw new BadRequestException('Ishema amount must be an integer of at least 5 RWF.');
    }

    const formattedTransfers: MobileMoneyTransfer[] = transfers.map((t) => ({
      percentage: t.percentage,
      phoneNumber: this.toIshemaApiPhoneNumber(t.phoneNumber),
      receiverMessage: t.receiverMessage.substring(0, 160),
    }));

    const payload: MobileMoneyCreateTransactionRequest = {
      amount: chargedAmount,
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

      this.logger.debug(`Mobile Money API payload: ${JSON.stringify(payload, null, 2)}`);
      this.logger.debug(`API URL: ${config.apiUrl}/api/v3/transaction?apiKey=${config.apiKey ? '[REDACTED]' : '[MISSING]'}`);

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
      
      this.logger.log(`Mobile Money transaction created successfully: externalId=${externalId}, status=${transactionData.savedTransaction?.status || transactionData.transaction?.status}`);
      this.logger.debug(`Full API response: ${JSON.stringify(transactionData, null, 2)}`);

      return transactionData;
    } catch (error: any) {
      this.logger.error(`Mobile Money transaction creation failed for payer ${formattedPayer} (${networkOperator}):`, error.message);

      // Log detailed error information
      if (error.response) {
        this.logger.error(`API Error Response Status: ${error.response.status}`);
        this.logger.error(`API Error Response Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
        this.logger.error(`API Error Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
        
        // Check for specific Ishema API error patterns
        if (error.response.data?.message) {
          this.logger.error(`Ishema API Error Message: ${error.response.data.message}`);
        }
        
        if (error.response.data?.error) {
          this.logger.error(`Ishema API Error Details: ${error.response.data.error}`);
        }

        // Log potential network operator compatibility issues
        if (networkOperator === 'AIRTEL' && error.response.status >= 400) {
          this.logger.warn(`Potential Airtel compatibility issue detected. Status: ${error.response.status}`);
        }
      } else if (error.request) {
        this.logger.error('No response received from Ishema API');
        this.logger.error(`Request timeout or network error: ${error.code || 'UNKNOWN'}`);
      } else {
        this.logger.error(`Request setup error: ${error.message}`);
      }

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
   * Ishema DB copy of the transaction (GET /transaction/{referenceId}).
   * This is not live MoPay status — use {@link getVerifiedTransactionOutcome}.
   */
  async checkTransactionStatus(
    referenceId: string,
  ): Promise<MobileMoneyTransactionResponse> {
    const config = this.getConfig();

    try {
      const response: any = await firstValueFrom(
        this.httpService.get(
          `${config.apiUrl}/api/v3/transaction/${encodeURIComponent(referenceId)}?apiKey=${config.apiKey}`,
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
   * Live MoPay status (GET /transaction/external/{externalId}).
   * Official docs: "Get the current status of a transaction from MoPay using external ID".
   */
  async checkMopayTransactionStatus(
    externalId: string,
  ): Promise<MobileMoneyTransactionResponse> {
    const config = this.getConfig();
    const path = `${config.apiUrl}/api/v3/transaction/external/${encodeURIComponent(externalId)}`;
    const urls = [
      { label: 'path-only', url: path },
      { label: 'apiKey', url: `${path}?apiKey=${config.apiKey}` },
    ];

    let lastError: string | undefined;
    for (const attempt of urls) {
      try {
        const response: any = await firstValueFrom(
          this.httpService.get(attempt.url, {
            headers: { accept: 'application/json' },
            timeout: 30000,
            validateStatus: () => true,
          }) as any,
        );
        const httpStatus = Number(response?.status);
        this.logger.log(
          `MoPay GET ${attempt.label} HTTP ${httpStatus} for externalId=${externalId}`,
        );
        if (httpStatus >= 200 && httpStatus < 300) {
          return response.data;
        }
        lastError = `HTTP ${httpStatus}: ${JSON.stringify(response?.data)}`;
        if (httpStatus === 401 || httpStatus === 403 || httpStatus === 404) {
          continue;
        }
        return response.data ?? { status: httpStatus };
      } catch (error: any) {
        lastError = error.message;
        this.logger.warn(
          `MoPay GET ${attempt.label} failed for externalId=${externalId}: ${error.message}`,
        );
      }
    }

    this.logger.error(
      `Failed to check MoPay status for externalId=${externalId}: ${lastError}`,
    );
    throw new InternalServerErrorException(
      'Failed to check live transaction status from MoPay.',
    );
  }

  async getVerifiedTransactionOutcome(
    referenceId: string,
    externalId?: string,
  ): Promise<{
    referenceId: string;
    status: 'success' | 'failed' | 'pending';
    amount: number;
    message: string;
    externalId?: string;
    createdAt?: string;
    source: 'mopay' | 'database';
  }> {
    let dbResponse: MobileMoneyTransactionResponse | undefined;
    let resolvedExternalId = externalId;
    if (!resolvedExternalId) {
      dbResponse = await this.checkTransactionStatus(referenceId);
      resolvedExternalId = this.extractExternalId(dbResponse);
    }

    if (resolvedExternalId) {
      const mopayResponse = await this.checkMopayTransactionStatus(resolvedExternalId);
      const normalized = this.normalizeCallbackPayload({
        ...mopayResponse,
        referenceId,
      });
      const extra = mopayResponse as Record<string, any>;
      this.logger.log(
        `Ishema MoPay status for ${referenceId} (externalId=${resolvedExternalId}): ${normalized.status}` +
          ` raw=${JSON.stringify({
            status: extra?.status,
            savedStatus: extra?.savedTransaction?.status,
            txnStatus: extra?.transaction?.status,
            dataStatus: extra?.data?.status,
            message: extra?.message || extra?.savedTransaction?.message,
          })}`,
      );
      return {
        referenceId: normalized.referenceId || referenceId,
        status: normalized.status,
        amount: normalized.amount,
        message: normalized.message || 'MoPay status checked',
        externalId: resolvedExternalId,
        createdAt: this.extractCreatedAt(mopayResponse) || this.extractCreatedAt(dbResponse),
        source: 'mopay',
      };
    }

    if (!dbResponse) {
      dbResponse = await this.checkTransactionStatus(referenceId);
    }

    const dbRecord = dbResponse;
    const normalized = this.normalizeCallbackPayload({
      ...dbRecord,
      referenceId,
      savedTransaction: {
        ...(dbRecord.savedTransaction || {}),
        referenceId: dbRecord.savedTransaction?.referenceId || referenceId,
      },
    });
    this.logger.log(
      `Ishema DB status for ${referenceId}: ${normalized.status} (no MoPay externalId)`,
    );
    return {
      referenceId: normalized.referenceId || referenceId,
      status: normalized.status,
      amount: normalized.amount,
      message: normalized.message || 'Provider status checked',
      externalId: resolvedExternalId,
      createdAt: this.extractCreatedAt(dbRecord),
      source: 'database',
    };
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
  normalizeCallbackPayload(payload: any): MobileMoneyCallbackPayload {
    const nested =
      payload?.savedTransaction ||
      payload?.transaction ||
      payload?.data ||
      payload?.body ||
      payload;
    const statusCode = Number(nested?.statusCode ?? payload?.statusCode ?? 0);
    const rawStatus = nested?.status ?? payload?.status ?? payload?.paymentStatus;
    const statusRaw = String(rawStatus ?? '').trim().toLowerCase();
    const numericStatus = Number(rawStatus);
    let status: 'success' | 'failed' | 'pending' = 'pending';
    if (['success', 'successful', 'completed', 'paid'].includes(statusRaw)) {
      status = 'success';
    } else if (
      ['failed', 'failure', 'rejected', 'cancelled', 'canceled', 'error'].includes(statusRaw) ||
      (Number.isFinite(statusCode) && statusCode >= 400) ||
      (Number.isFinite(numericStatus) && numericStatus >= 400)
    ) {
      status = 'failed';
    }
    return {
      referenceId: String(
        nested?.referenceId ||
          payload?.referenceId ||
          nested?.externalId ||
          payload?.externalId ||
          '',
      ),
      status,
      statusCode: Number.isFinite(statusCode) && statusCode > 0
        ? statusCode
        : Number.isFinite(numericStatus)
          ? numericStatus
          : 0,
      date: String(nested?.date || nested?.createdAt || payload?.date || ''),
      amount: Number(nested?.amount ?? payload?.amount ?? 0),
      message: String(nested?.message || payload?.message || nested?.senderMessage || ''),
    };
  }

  async processCallback(payload: MobileMoneyCallbackPayload | any): Promise<{
    referenceId: string;
    status: 'success' | 'failed' | 'pending';
    amount: number;
    message: string;
    statusCode: number;
  }> {
    try {
      const normalized = this.normalizeCallbackPayload(payload);
      this.logger.log(
        `Mobile Money callback received: ${normalized.referenceId} → ${normalized.status}`,
      );
      this.logger.debug(`Normalized webhook payload: ${JSON.stringify(normalized)}`);

      return {
        referenceId: normalized.referenceId,
        status: normalized.status,
        amount: normalized.amount,
        message: normalized.message || 'Payment processed',
        statusCode: normalized.statusCode,
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
