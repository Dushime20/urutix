import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from '../entities/email-template.entity';
import { BulkEmailLog } from '../entities/bulk-email-log.entity';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';
import { EmailService } from '../modules/auth/email.service';

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

        // Send email using existing email service
        await this.sendEmail(
          recipient.email,
          personalizedSubject,
          personalizedText,
          personalizedHtml,
        );

        sentCount++;
        this.logger.log(`Email sent successfully to ${recipient.email}`);
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

  private async sendEmail(
    to: string,
    subject: string,
    textBody: string,
    htmlBody: string,
  ): Promise<void> {
    // Use the existing email service's transporter
    // Since EmailService is injected, we can access its methods
    // For now, we'll need to add a generic send method to EmailService
    // or use nodemailer directly here
    
    // This is a placeholder - you'll need to either:
    // 1. Add a generic sendEmail method to EmailService
    // 2. Or inject nodemailer transporter here
    
    this.logger.log(`Sending email to ${to} with subject: ${subject}`);
    // TODO: Implement actual email sending
    // await this.emailService.sendGenericEmail(to, subject, textBody, htmlBody);
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

    const template: EmailTemplate = {
      id: null,
      name: 'Partner Email',
      subject,
      htmlBody,
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

    this.sendEmailsAsync(log.id, template, recipients);

    return log;
  }

  async getPartnerEmailLogs(tenantId: string): Promise<BulkEmailLog[]> {
    try {
      return await this.bulkEmailLogRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: 100,
      });
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
