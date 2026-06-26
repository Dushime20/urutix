/**
 * Notifications email service — thin wrapper around the auth EmailService.
 *
 * This file previously contained stub implementations that silently discarded
 * all emails.  It now delegates to the real SMTP-backed EmailService so that
 * notification emails are actually delivered.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService as AuthEmailService } from '../../auth/services/email.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authEmailService: AuthEmailService,
  ) {}

  async sendEmail(
    to: string | string[],
    subject: string,
    body: string,
    htmlBody?: string,
  ): Promise<boolean> {
    const recipients = Array.isArray(to) ? to : [to];
    let allOk = true;

    for (const recipient of recipients) {
      const result = await this.authEmailService.sendGenericEmail({
        to: recipient,
        subject,
        htmlBody: htmlBody || undefined,
        textBody: body,
      });
      if (!result.success) allOk = false;
    }

    return allOk;
  }

  async sendTemplateEmail(
    to: string | string[],
    templateName: string,
    templateData: any,
    subject?: string,
  ): Promise<boolean> {
    // Build a simple fallback email from the template data when no dedicated
    // template method exists.  This prevents silent data loss.
    const subjectLine = subject || `UrutiX — ${templateName}`;
    const body = Object.entries(templateData || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    this.logger.log(`sendTemplateEmail: template="${templateName}", to=${Array.isArray(to) ? to.join(', ') : to}`);
    return this.sendEmail(to, subjectLine, body);
  }
}
