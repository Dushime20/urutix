import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {}

  async sendSms(
    to: string | string[],
    message: string,
    from?: string,
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Sending SMS to ${Array.isArray(to) ? to.join(', ') : to}`,
      );
      this.logger.log(`Message: ${message}`);
      this.logger.log(`From: ${from || 'Default'}`);

      // TODO: Implement actual SMS sending logic
      // This could use Twilio, AWS SNS, MessageBird, etc.

      // For now, just log the SMS details
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      return false;
    }
  }

  async sendBulkSms(
    recipients: Array<{ phone: string; message: string }>,
    from?: string,
  ): Promise<Array<{ phone: string; success: boolean; error?: string }>> {
    try {
      this.logger.log(`Sending bulk SMS to ${recipients.length} recipients`);

      const results = [];
      for (const recipient of recipients) {
        try {
          const success = await this.sendSms(
            recipient.phone,
            recipient.message,
            from,
          );
          results.push({
            phone: recipient.phone,
            success,
          });
        } catch (error) {
          results.push({
            phone: recipient.phone,
            success: false,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to send bulk SMS: ${error.message}`);
      return recipients.map((recipient) => ({
        phone: recipient.phone,
        success: false,
        error: error.message,
      }));
    }
  }
}
