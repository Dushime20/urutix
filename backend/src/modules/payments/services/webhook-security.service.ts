import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentProvider } from '../types/payment.types';

export interface WebhookSignature {
  signature: string;
  timestamp: string;
  payload: string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  provider: PaymentProvider;
  payload: any;
  error?: string;
}

@Injectable()
export class WebhookSecurityService {
  private readonly logger = new Logger(WebhookSecurityService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate webhook signature and payload
   */
  async validateWebhook(
    provider: PaymentProvider,
    signature: string,
    timestamp: string,
    payload: string,
    headers: Record<string, string>,
  ): Promise<WebhookValidationResult> {
    try {
      // Validate timestamp to prevent replay attacks
      if (!this.validateTimestamp(timestamp)) {
        throw new UnauthorizedException(
          'Webhook timestamp is too old or invalid',
        );
      }

      // Validate signature based on provider
      const isValidSignature = await this.validateSignature(
        provider,
        signature,
        timestamp,
        payload,
        headers,
      );

      if (!isValidSignature) {
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // Parse and validate payload
      const parsedPayload = this.parseAndValidatePayload(payload, provider);

      return {
        isValid: true,
        provider,
        payload: parsedPayload,
      };
    } catch (error) {
      this.logger.error(
        `Webhook validation failed for provider ${provider}:`,
        error,
      );
      return {
        isValid: false,
        provider,
        payload: null,
        error: error.message,
      };
    }
  }

  /**
   * Validate webhook timestamp to prevent replay attacks
   */
  private validateTimestamp(timestamp: string): boolean {
    try {
      const webhookTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const tolerance = 300; // 5 minutes tolerance

      // Check if timestamp is within tolerance
      return Math.abs(currentTime - webhookTime) <= tolerance;
    } catch (error) {
      this.logger.error('Timestamp validation error:', error);
      return false;
    }
  }

  /**
   * Validate webhook signature based on provider
   */
  private async validateSignature(
    provider: PaymentProvider,
    signature: string,
    timestamp: string,
    payload: string,
    headers: Record<string, string>,
  ): Promise<boolean> {
    try {
      const secret = this.getProviderSecret(provider);

      if (!secret) {
        this.logger.error(`No secret configured for provider ${provider}`);
        return false;
      }

      switch (provider) {
        case PaymentProvider.MOBILE_MONEY:
          return this.validateMobileMoneySignature(
            signature,
            timestamp,
            payload,
            secret,
          );

        case PaymentProvider.BANK_TRANSFER:
          return this.validateBankTransferSignature(
            signature,
            timestamp,
            payload,
            secret,
            headers,
          );

        case PaymentProvider.MICRO_LENDING:
          return this.validateMicroLendingSignature(
            signature,
            timestamp,
            payload,
            secret,
          );

        default:
          this.logger.error(
            `Unknown provider for signature validation: ${provider}`,
          );
          return false;
      }
    } catch (error) {
      this.logger.error(
        `Signature validation error for provider ${provider}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Validate Mobile Money webhook signature
   */
  private validateMobileMoneySignature(
    signature: string,
    timestamp: string,
    payload: string,
    secret: string,
  ): boolean {
    try {
      // Mobile Money typically uses HMAC-SHA256
      const expectedSignature = this.generateHMACSignature(
        payload,
        secret,
        'sha256',
      );
      return this.compareSignatures(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Mobile Money signature validation error:', error);
      return false;
    }
  }

  /**
   * Validate Bank Transfer webhook signature
   */
  private validateBankTransferSignature(
    signature: string,
    timestamp: string,
    payload: string,
    secret: string,
    headers: Record<string, string>,
  ): boolean {
    try {
      // Bank Transfer might use different signature methods
      const signatureMethod = headers['x-signature-method'] || 'sha256';
      const expectedSignature = this.generateHMACSignature(
        payload,
        secret,
        signatureMethod,
      );
      return this.compareSignatures(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Bank Transfer signature validation error:', error);
      return false;
    }
  }

  /**
   * Validate Micro Lending webhook signature
   */
  private validateMicroLendingSignature(
    signature: string,
    timestamp: string,
    payload: string,
    secret: string,
  ): boolean {
    try {
      // Micro Lending might use a different signature format
      const expectedSignature = this.generateHMACSignature(
        payload,
        secret,
        'sha256',
      );
      return this.compareSignatures(signature, expectedSignature);
    } catch (error) {
      this.logger.error('Micro Lending signature validation error:', error);
      return false;
    }
  }

  /**
   * Generate HMAC signature
   */
  private generateHMACSignature(
    payload: string,
    secret: string,
    algorithm: string,
  ): string {
    const hmac = createHmac(algorithm, secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  /**
   * Compare signatures using timing-safe comparison
   */
  private compareSignatures(signature1: string, signature2: string): boolean {
    try {
      const buffer1 = Buffer.from(signature1, 'hex');
      const buffer2 = Buffer.from(signature2, 'hex');

      if (buffer1.length !== buffer2.length) {
        return false;
      }

      return timingSafeEqual(buffer1, buffer2);
    } catch (error) {
      this.logger.error('Signature comparison error:', error);
      return false;
    }
  }

  /**
   * Get provider secret from configuration
   */
  private getProviderSecret(provider: PaymentProvider): string | null {
    const secretMap = {
      [PaymentProvider.MOBILE_MONEY]: this.configService.get(
        'MOBILE_MONEY_WEBHOOK_SECRET',
      ),
      [PaymentProvider.BANK_TRANSFER]: this.configService.get(
        'BANK_TRANSFER_WEBHOOK_SECRET',
      ),
      [PaymentProvider.MICRO_LENDING]: this.configService.get(
        'MICRO_LENDING_WEBHOOK_SECRET',
      ),
    };

    return secretMap[provider] || null;
  }

  /**
   * Parse and validate webhook payload
   */
  private parseAndValidatePayload(
    payload: string,
    provider: PaymentProvider,
  ): any {
    try {
      const parsed = JSON.parse(payload);

      // Validate required fields based on provider
      this.validatePayloadStructure(parsed, provider);

      return parsed;
    } catch (error) {
      this.logger.error(
        `Payload parsing error for provider ${provider}:`,
        error,
      );
      throw new BadRequestException('Invalid webhook payload format');
    }
  }

  /**
   * Validate payload structure based on provider
   */
  private validatePayloadStructure(
    payload: any,
    provider: PaymentProvider,
  ): void {
    const requiredFields = this.getRequiredFields(provider);

    for (const field of requiredFields) {
      if (!payload.hasOwnProperty(field)) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Get required fields for each provider
   */
  private getRequiredFields(provider: PaymentProvider): string[] {
    const fieldMap = {
      [PaymentProvider.MOBILE_MONEY]: ['transaction_id', 'status', 'amount'],
      [PaymentProvider.BANK_TRANSFER]: [
        'transaction_id',
        'status',
        'amount',
        'currency',
      ],
      [PaymentProvider.MICRO_LENDING]: [
        'transaction_id',
        'status',
        'amount',
        'loan_id',
      ],
    };

    return fieldMap[provider] || ['transaction_id', 'status'];
  }

  /**
   * Generate webhook signature for outgoing webhooks
   */
  async generateOutgoingSignature(
    provider: PaymentProvider,
    payload: string,
    timestamp: string,
  ): Promise<string> {
    try {
      const secret = this.getProviderSecret(provider);

      if (!secret) {
        throw new Error(`No secret configured for provider ${provider}`);
      }

      return this.generateHMACSignature(payload, secret, 'sha256');
    } catch (error) {
      this.logger.error(
        `Error generating outgoing signature for provider ${provider}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Verify webhook endpoint health
   */
  async verifyWebhookEndpoint(
    url: string,
    provider: PaymentProvider,
  ): Promise<boolean> {
    try {
      // This would make a test request to verify the webhook endpoint
      // For now, we'll just log the verification attempt
      this.logger.log(
        `Verifying webhook endpoint: ${url} for provider ${provider}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Webhook endpoint verification failed: ${url}`, error);
      return false;
    }
  }

  /**
   * Get webhook security statistics
   */
  async getSecurityStats(): Promise<any> {
    return {
      signatureValidationEnabled: true,
      timestampValidationEnabled: true,
      replayAttackProtection: true,
      supportedProviders: Object.values(PaymentProvider),
      timestamp: new Date().toISOString(),
    };
  }
}
