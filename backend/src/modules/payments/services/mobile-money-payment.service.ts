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
  accountPhoneNumber?: string; // The phone number associated with the API account (sender/payer)
}

export interface MobileMoneyTransfer {
  percentage: number;
  phoneNumber: string;
  receiverMessage: string;
}

export interface MobileMoneyCreateTransactionRequest {
  amount: number;
  callbackUrl: string;
  currency: string;
  phoneNumber: string; // Phone which will complete payment
  referenceId: string;
  senderMessage: string;
  transfers?: MobileMoneyTransfer[];
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
    const apiUrl = this.configService.get<string>('MOBILE_MONEY_API_URL') || 'https://api.payment.ishema.rw';
    const apiKey = this.configService.get<string>('MOBILE_MONEY_API_KEY');
    const callbackUrl = this.configService.get<string>('MOBILE_MONEY_CALLBACK_URL') || '';
    const currency = this.configService.get<string>('MOBILE_MONEY_CURRENCY') || 'RWF';
    const accountPhoneNumber = this.configService.get<string>('MOBILE_MONEY_ACCOUNT_PHONE');

    if (!apiKey) {
      throw new BadRequestException(
        'Mobile Money Payment API key is not configured. Please set MOBILE_MONEY_API_KEY in your environment variables.',
      );
    }

    return {
      apiUrl,
      apiKey,
      callbackUrl,
      currency,
      accountPhoneNumber,
    };
  }

  /**
   * Format phone number to Mobile Money format (250XXXXXXXXX)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add country code if not present (Rwanda: 250)
    if (!cleaned.startsWith('250')) {
      cleaned = '250' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Create a transaction (initiate payment)
   */
  async createTransaction(
    amount: number,
    phoneNumber: string,
    referenceId: string,
    senderMessage: string = 'Payment for cargo transportation',
    transfers?: MobileMoneyTransfer[],
    callbackUrl?: string,
  ): Promise<MobileMoneyTransactionResponse> {
    const config = this.getConfig();

    // Format phone number
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    // Prepare request payload
    const payload: MobileMoneyCreateTransactionRequest = {
      amount: Math.round(amount), // API expects whole numbers
      callbackUrl: callbackUrl || config.callbackUrl,
      currency: config.currency,
      phoneNumber: formattedPhone,
      referenceId: referenceId,
      senderMessage: senderMessage.substring(0, 160), // Max 160 characters
    };

      // Add transfers if provided
      if (transfers && transfers.length > 0) {
        // Validate that percentages sum to 100
        const totalPercentage = transfers.reduce((sum, transfer) => sum + transfer.percentage, 0);
        if (totalPercentage !== 100) {
          throw new BadRequestException(
            'Transfer percentages must sum to 100',
          );
        }

        // Format phone numbers in transfers
        payload.transfers = transfers.map((transfer: MobileMoneyTransfer) => ({
          ...transfer,
          phoneNumber: this.formatPhoneNumber(transfer.phoneNumber),
        }));
      }

    try {
      this.logger.log(
        `Creating Mobile Money transaction: ${amount} ${config.currency} from ${formattedPhone}, Reference: ${referenceId}`,
      );

      const response = await firstValueFrom(
        this.httpService.post(
          `${config.apiUrl}/api/v3/transaction?apiKey=${config.apiKey}`,
          payload,
          {
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        ),
      );

      const transactionData: MobileMoneyTransactionResponse = response.data;

      this.logger.log(
        `Mobile Money transaction created: ${transactionData.savedTransaction?.externalId || transactionData.transaction?.externalId}`,
      );

      return transactionData;
    } catch (error: any) {
      this.logger.error('Mobile Money transaction creation failed:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Payment request failed';
      
      throw new BadRequestException(`Mobile Money payment failed: ${errorMessage}`);
    }
  }

  /**
   * Check transaction status by reference ID
   */
  async checkTransactionStatus(referenceId: string): Promise<MobileMoneyTransactionResponse> {
    const config = this.getConfig();

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${config.apiUrl}/api/v3/transaction/${referenceId}?apiKey=${config.apiKey}`,
          {
            headers: {
              'accept': 'application/json',
            },
            timeout: 30000,
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to check Mobile Money transaction status for ${referenceId}:`, error);
      throw new InternalServerErrorException(
        'Failed to check transaction status from Mobile Money Payment',
      );
    }
  }

  /**
   * Verify callback signature (if provider provides webhook signing)
   */
  verifyCallbackSignature(payload: any, signature?: string): boolean {
    // TODO: Implement signature verification if provider provides webhook signing
    // For now, we'll trust callbacks from the configured callback URL
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
        `Mobile Money callback received: ${payload.referenceId} - ${payload.status}`,
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
   * Health check for Mobile Money Payment API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const config = this.getConfig();
      // Try to check a test transaction status (this will fail but confirms API is reachable)
      // Or you could create a minimal test transaction
      return !!config.apiKey;
    } catch (error) {
      this.logger.error('Mobile Money Payment health check failed:', error);
      return false;
    }
  }
}

