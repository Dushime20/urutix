import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from './../entities/email-template.entity';
import { BulkEmailLog } from './../entities/bulk-email-log.entity';
import { Tenant } from './../entities/tenant.entity';
import { User } from './../entities/user.entity';
import { EmailService } from './../modules/auth/services/email.service';

@Injectable()
export class BulkEmailService {
  private readonly logger = new Logger(BulkEmailService.name);

  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepository: Repository<EmailTemplate>,
    @InjectRepository(BulkEmailLog)
    private bulkEmailLogRepository: Repository<BulkEmailLog>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  // Email Template Management
  async createTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const template = this.emailTemplateRepository.create(data);
    return await this.emailTemplateRepository.save(template);
  }

  async updateTemplate(
    id: string,
    data: Partial<EmailTemplate>,
  ): Promise<EmailTemplate> {
    await this.emailTemplateRepository.update(id, data);
    return await this.emailTemplateRepository.findOne({ where: { id } });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.emailTemplateRepository.delete(id);
  }

  async getTemplate(id: string): Promise<EmailTemplate> {
    return await this.emailTemplateRepository.findOne({ where: { id } });
  }

  async getAllTemplates(): Promise<EmailTemplate[]> {
    return await this.emailTemplateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveTemplates(): Promise<EmailTemplate[]> {
    return await this.emailTemplateRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  // Bulk Email Sending
  async sendBulkEmailToTenants(
    adminUserId: string,
    adminEmail: string,
    templateId: string,
    filters?: {
      status?: string[];
      subscriptionPlan?: string[];
      tenantIds?: string[];
    },
  ): Promise<BulkEmailLog> {
    this.logger.log(
      `Starting bulk email send by admin ${adminEmail} using template ${templateId}`,
    );

    // Get template
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error('Email template not found');
    }

    // Get recipients (tenant admin users)
    const recipients = await this.getTenantRecipients(filters);
    this.logger.log(`Found ${recipients.length} recipients`);

    // Create log entry
    const log = this.bulkEmailLogRepository.create({
      createdBy: adminUserId,
      templateId,
      subject: template.subject,
      body: template.htmlBody,
      recipientsCount: recipients.length,
      status: 'sending',
      metadata: { filters, adminEmail },
    });
    await this.bulkEmailLogRepository.save(log);

    // Send emails asynchronously
    this.sendEmailsAsync(log.id, template, recipients);

    return log;
  }

  async sendCustomBulkEmail(
    adminUserId: string,
    adminEmail: string,
    subject: string,
    htmlBody: string,
    textBody: string,
    filters?: {
      status?: string[];
      subscriptionPlan?: string[];
      tenantIds?: string[];
    },
  ): Promise<BulkEmailLog> {
    this.logger.log(
      `Starting custom bulk email send by admin ${adminEmail}`,
    );

    // Get recipients
    const recipients = await this.getTenantRecipients(filters);
    this.logger.log(`Found ${recipients.length} recipients`);

    // Create log entry
    const log = this.bulkEmailLogRepository.create({
      createdBy: adminUserId,
      subject,
      body: htmlBody,
      recipientsCount: recipients.length,
      status: 'sending',
      metadata: { filters, adminEmail, customEmail: true },
    });
    await this.bulkEmailLogRepository.save(log);

    // Create temporary template
    const template: EmailTemplate = {
      id: null,
      name: 'Custom Email',
      subject,
      htmlBody,
      textBody,
      description: null,
      category: 'custom',
      variables: [],
      isActive: true,
      createdBy: adminUserId,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Send emails asynchronously
    this.sendEmailsAsync(log.id, template, recipients);

    return log;
  }

  private async getTenantRecipients(filters?: {
    status?: string[];
    subscriptionPlan?: string[];
    tenantIds?: string[];
  }): Promise<Array<{ email: string; tenantName: string; tenantId: string }>> {
    const queryBuilder = this.tenantRepository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.users', 'user')
      .where('user.role = :role', { role: 'TENANT_ADMIN' });

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      queryBuilder.andWhere('tenant.status IN (:...statuses)', {
        statuses: filters.status,
      });
    }

    if (filters?.tenantIds && filters.tenantIds.length > 0) {
      queryBuilder.andWhere('tenant.id IN (:...tenantIds)', {
        tenantIds: filters.tenantIds,
      });
    }

    // TODO: Add subscription plan filter when subscription relationship is available
    // if (filters?.subscriptionPlan && filters.subscriptionPlan.length > 0) {
    //   queryBuilder.andWhere('subscription.planName IN (:...plans)', {
    //     plans: filters.subscriptionPlan,
    //   });
    // }

    const tenants = await queryBuilder.getMany();

    // Extract admin user emails
    const recipients = [];
    for (const tenant of tenants) {
      const adminUsers = tenant.users?.filter(
        (u) => u.role === 'TENANT_ADMIN',
      );
      if (adminUsers && adminUsers.length > 0) {
        for (const user of adminUsers) {
          if (user.email) {
            recipients.push({
              email: user.email,
              tenantName: tenant.name,
              tenantId: tenant.id,
            });
          }
        }
      }
    }

    return recipients;
  }

  private async sendEmailsAsync(
    logId: string,
    template: EmailTemplate,
    recipients: Array<{ email: string; tenantName: string; tenantId: string }>,
    senderEmail?: string,
  ): Promise<void> {
    let sentCount = 0;
    let failedCount = 0;
    const failedRecipients: string[] = [];

    for (const recipient of recipients) {
      try {
        // Replace template variables
        const personalizedHtml = this.replaceTemplateVariables(
          template.htmlBody,
          recipient,
        );
        const personalizedText = template.textBody
          ? this.replaceTemplateVariables(template.textBody, recipient)
          : null;
        const personalizedSubject = this.replaceTemplateVariables(
          template.subject,
          recipient,
        );

        // Send email using EmailService
        const result = await this.emailService.sendGenericEmail({
          to: recipient.email,
          subject: personalizedSubject,
          textBody: personalizedText,
          htmlBody: personalizedHtml,
          replyTo: senderEmail,
          fromName: senderEmail ? `UrutiX (via ${senderEmail})` : 'UrutiX',
        });

        if (result.success) {
          sentCount++;
          this.logger.log(`Email sent successfully to ${recipient.email}`);
        } else {
          failedCount++;
          failedRecipients.push(recipient.email);
          this.logger.error(`Failed to send email to ${recipient.email}: ${result.error}`);
        }
      } catch (error) {
        failedCount++;
        failedRecipients.push(recipient.email);
        this.logger.error(
          `Failed to send email to ${recipient.email}: ${error.message}`,
        );
      }
    }

    // Update log
    await this.bulkEmailLogRepository.update(logId, {
      sentCount,
      failedCount,
      status: failedCount === 0 ? 'sent' : 'sent',
      sentAt: new Date(),
      errorMessage: failedRecipients.length > 0 
        ? `Failed to send to: ${failedRecipients.join(', ')}` 
        : null,
    });

    this.logger.log(
      `Bulk email completed: ${sentCount} success, ${failedCount} failures`,
    );
  }

  private replaceTemplateVariables(
    content: string,
    data: { email: string; tenantName: string; tenantId: string },
  ): string {
    return content
      .replace(/\{\{tenantName\}\}/g, data.tenantName)
      .replace(/\{\{email\}\}/g, data.email)
      .replace(/\{\{tenantId\}\}/g, data.tenantId);
  }

  /**
   * Wraps raw HTML content in a professional, branded email template.
   */
  private wrapInEmailTemplate(subject: string, bodyHtml: string, senderEmail: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">UrutiX</h1>
            </td>
          </tr>
          <!-- Subject -->
          <tr>
            <td style="padding: 32px 32px 8px 32px;">
              <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.4;">${subject}</h2>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 16px 32px 32px 32px; font-size: 15px; line-height: 1.7; color: #334155;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8;">
                Sent by <strong style="color: #475569;">${senderEmail}</strong> via UrutiX
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                You can reply directly to this email to contact the sender.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
          &copy; ${new Date().getFullYear()} UrutiX. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // ---- Tenant Admin: send to own partners ----

  async sendBulkEmailToPartners(
    tenantAdminId: string,
    tenantAdminEmail: string,
    tenantId: string,
    subject: string,
    htmlBody: string,
    textBody: string,
    filters?: {
      roles?: string[];
      status?: string[];
    },
  ): Promise<BulkEmailLog> {
    this.logger.log(
      `Tenant admin ${tenantAdminEmail} sending bulk email to partners in tenant ${tenantId}`,
    );

    // Build recipient list from users in this tenant
    const userQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('user.deletedAt IS NULL');

    if (filters?.roles && filters.roles.length > 0) {
      userQuery.andWhere('user.role IN (:...roles)', { roles: filters.roles });
    }
    if (filters?.status && filters.status.length > 0) {
      userQuery.andWhere('user.status IN (:...statuses)', { statuses: filters.status });
    }

    const users = await userQuery.getMany();
    const recipients = users
      .filter((u) => !!u.email)
      .map((u) => ({ email: u.email, tenantName: 'Partner', tenantId }));

    this.logger.log(`Found ${recipients.length} partner recipients`);

    const log = this.bulkEmailLogRepository.create({
      tenantId,
      createdBy: tenantAdminId,
      subject,
      body: htmlBody,
      recipientsCount: recipients.length,
      status: 'sending',
      metadata: { filters, tenantAdminEmail, partnerBulkEmail: true },
    });
    await this.bulkEmailLogRepository.save(log);

    // Wrap the plain message in a professional HTML email template
    const wrappedHtml = this.wrapInEmailTemplate(subject, htmlBody, tenantAdminEmail);

    const template: EmailTemplate = {
      id: null,
      name: 'Partner Email',
      subject,
      htmlBody: wrappedHtml,
      textBody,
      description: null,
      category: 'partner',
      variables: [],
      isActive: true,
      createdBy: tenantAdminId,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Pass tenantAdminEmail as sender for replyTo header
    this.sendEmailsAsync(log.id, template, recipients, tenantAdminEmail);

    return log;
  }


  async getPartnerEmailLogs(tenantId: string): Promise<BulkEmailLog[]> {
    try {
      this.logger.log(`Fetching email logs for tenantId: ${tenantId}`);
      const logs = await this.bulkEmailLogRepository
        .createQueryBuilder('log')
        .where('log.tenantId = :tenantId', { tenantId })
        .orderBy('log.createdAt', 'DESC')
        .take(100)
        .getMany();
      this.logger.log(`Found ${logs.length} logs for tenant ${tenantId}`);
      return logs;
    } catch (error) {
      this.logger.error(`Error fetching partner email logs: ${error.message}`);
      return [];
    }
  }

  // Bulk Email Logs
  async getBulkEmailLogs(): Promise<BulkEmailLog[]> {
    try {
      return await this.bulkEmailLogRepository.find({
        relations: ['template'],
        order: { createdAt: 'DESC' },
        take: 100,
      });
    } catch (error) {
      this.logger.error(`Error fetching bulk email logs: ${error.message}`, error.stack);
      // If relation fails, try without relations
      try {
        return await this.bulkEmailLogRepository.find({
          order: { createdAt: 'DESC' },
          take: 100,
        });
      } catch (fallbackError) {
        this.logger.error(`Fallback query also failed: ${fallbackError.message}`);
        throw error; // Throw original error
      }
    }
  }

  async getBulkEmailLog(id: string): Promise<BulkEmailLog> {
    return await this.bulkEmailLogRepository.findOne({
      where: { id },
      relations: ['template'],
    });
  }
}
