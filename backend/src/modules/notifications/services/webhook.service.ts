import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private configService: ConfigService) {}

  async sendWebhook(
    url: string,
    payload: any,
    headers?: Record<string, string>,
    method: 'POST' | 'PUT' | 'PATCH' = 'POST',
  ): Promise<boolean> {
    try {
      this.logger.log(`Sending webhook to ${url}`);
      this.logger.log(`Method: ${method}`);
      this.logger.log(`Payload: ${JSON.stringify(payload)}`);
      this.logger.log(`Headers: ${JSON.stringify(headers)}`);

      // TODO: Implement actual webhook sending logic
      // This could use axios, node-fetch, or other HTTP clients

      // For now, just log the webhook details
      return true;
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error.message}`);
      return false;
    }
  }

  async sendBulkWebhooks(
    webhooks: Array<{
      url: string;
      payload: any;
      headers?: Record<string, string>;
      method?: 'POST' | 'PUT' | 'PATCH';
    }>,
  ): Promise<Array<{ url: string; success: boolean; error?: string }>> {
    try {
      this.logger.log(`Sending bulk webhooks to ${webhooks.length} endpoints`);

      const results = [];
      for (const webhook of webhooks) {
        try {
          const success = await this.sendWebhook(
            webhook.url,
            webhook.payload,
            webhook.headers,
            webhook.method,
          );
          results.push({
            url: webhook.url,
            success,
          });
        } catch (error) {
          results.push({
            url: webhook.url,
            success: false,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to send bulk webhooks: ${error.message}`);
      return webhooks.map((webhook) => ({
        url: webhook.url,
        success: false,
        error: error.message,
      }));
    }
  }

  async validateWebhookUrl(url: string): Promise<boolean> {
    try {
      // Basic URL validation
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch (error) {
      this.logger.error(`Invalid webhook URL: ${url}`);
      return false;
    }
  }

  async testWebhook(
    url: string,
    testPayload: any = { test: true, timestamp: new Date().toISOString() },
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      this.logger.log(`Testing webhook endpoint: ${url}`);

      // TODO: Implement actual webhook testing
      // This would send a test payload and verify the response

      return { success: true };
    } catch (error) {
      this.logger.error(`Webhook test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
