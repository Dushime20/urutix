import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationTemplate,
  TemplateType,
  TemplateCategory,
} from '../entities/notification-template.entity';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {}

  async createTemplate(
    templateData: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    const template = this.templateRepository.create({
      ...templateData,
      version: 1,
      isActive: true,
    });

    const savedTemplate = await this.templateRepository.save(template);

    this.logger.log(
      `Created template ${savedTemplate.id} for tenant ${templateData.tenantId}`,
    );

    return savedTemplate;
  }

  async updateTemplate(
    templateId: string,
    tenantId: string,
    updateData: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Increment version
    const newVersion = template.version + 1;

    const updatedTemplate = await this.templateRepository.save({
      ...template,
      ...updateData,
      version: newVersion,
      updatedAt: new Date(),
    });

    this.logger.log(`Updated template ${templateId} to version ${newVersion}`);

    return updatedTemplate;
  }

  async getTemplate(
    templateId: string,
    tenantId: string,
    language: string = 'en',
  ): Promise<NotificationTemplate | null> {
    return this.templateRepository.findOne({
      where: [
        { id: templateId, tenantId, language, isActive: true },
        { id: templateId, tenantId, language: 'en', isActive: true }, // Fallback to English
      ],
      order: { version: 'DESC' },
    });
  }

  async getTemplatesByCategory(
    tenantId: string,
    category: TemplateCategory,
    language: string = 'en',
  ): Promise<NotificationTemplate[]> {
    return this.templateRepository.find({
      where: [
        { tenantId, category, language, isActive: true },
        { tenantId, category, language: 'en', isActive: true }, // Fallback to English
      ],
      order: { version: 'DESC' },
    });
  }

  async getTemplatesByType(
    tenantId: string,
    type: TemplateType,
    language: string = 'en',
  ): Promise<NotificationTemplate[]> {
    return this.templateRepository.find({
      where: [
        { tenantId, type, language, isActive: true },
        { tenantId, type, language: 'en', isActive: true }, // Fallback to English
      ],
      order: { version: 'DESC' },
    });
  }

  async getAllTemplates(
    tenantId: string,
    language: string = 'en',
  ): Promise<NotificationTemplate[]> {
    return this.templateRepository.find({
      where: [
        { tenantId, language, isActive: true },
        { tenantId, language: 'en', isActive: true }, // Fallback to English
      ],
      order: { category: 'ASC', version: 'DESC' },
    });
  }

  async deleteTemplate(templateId: string, tenantId: string): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, tenantId },
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Soft delete by setting isActive to false
    await this.templateRepository.update(
      { id: templateId, tenantId },
      { isActive: false },
    );

    this.logger.log(`Deleted template ${templateId}`);
  }

  async duplicateTemplate(
    templateId: string,
    tenantId: string,
    newName: string,
    newSlug: string,
  ): Promise<NotificationTemplate> {
    const originalTemplate = await this.templateRepository.findOne({
      where: { id: templateId, tenantId, isActive: true },
    });

    if (!originalTemplate) {
      throw new Error(`Template ${templateId} not found`);
    }

    const duplicatedTemplate = this.templateRepository.create({
      ...originalTemplate,
      id: undefined, // Let TypeORM generate new ID
      name: newName,
      slug: newSlug,
      version: 1,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedTemplate =
      await this.templateRepository.save(duplicatedTemplate);

    this.logger.log(`Duplicated template ${templateId} to ${savedTemplate.id}`);

    return savedTemplate;
  }

  async setDefaultTemplate(
    templateId: string,
    tenantId: string,
    category: TemplateCategory,
    type: TemplateType,
  ): Promise<void> {
    // Remove default flag from other templates in the same category and type
    await this.templateRepository.update(
      { tenantId, category, type, isDefault: true },
      { isDefault: false },
    );

    // Set the new default template
    await this.templateRepository.update(
      { id: templateId, tenantId },
      { isDefault: true },
    );

    this.logger.log(
      `Set template ${templateId} as default for ${category}/${type}`,
    );
  }

  async getDefaultTemplate(
    tenantId: string,
    category: TemplateCategory,
    type: TemplateType,
    language: string = 'en',
  ): Promise<NotificationTemplate | null> {
    return this.templateRepository.findOne({
      where: [
        { tenantId, category, type, language, isDefault: true, isActive: true },
        {
          tenantId,
          category,
          type,
          language: 'en',
          isDefault: true,
          isActive: true,
        }, // Fallback to English
      ],
      order: { version: 'DESC' },
    });
  }

  async validateTemplate(template: Partial<NotificationTemplate>): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check required fields
    if (!template.name) {
      errors.push('Template name is required');
    }

    if (!template.slug) {
      errors.push('Template slug is required');
    }

    if (!template.content) {
      errors.push('Template content is required');
    }

    if (!template.type) {
      errors.push('Template type is required');
    }

    if (!template.category) {
      errors.push('Template category is required');
    }

    // Validate slug format
    if (template.slug && !/^[a-z0-9-]+$/.test(template.slug)) {
      errors.push(
        'Template slug must contain only lowercase letters, numbers, and hyphens',
      );
    }

    // Validate email template has subject
    if (template.type === TemplateType.EMAIL && !template.subject) {
      errors.push('Email templates must have a subject');
    }

    // Validate content length
    if (template.content && template.content.length > 10000) {
      errors.push('Template content is too long (max 10,000 characters)');
    }

    // Validate SMS content length
    if (
      template.type === TemplateType.SMS &&
      template.content &&
      template.content.length > 160
    ) {
      errors.push('SMS template content is too long (max 160 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async processTemplate(
    template: NotificationTemplate,
    data: Record<string, any>,
  ): Promise<{
    subject?: string;
    content: string;
    htmlContent?: string;
    plainTextContent?: string;
  }> {
    const processText = (text: string): string => {
      if (!text) return '';

      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = data[key];
        if (value === undefined || value === null) {
          this.logger.warn(`Template variable ${key} not found in data`);
          return match;
        }
        return String(value);
      });
    };

    return {
      subject: template.subject ? processText(template.subject) : undefined,
      content: processText(template.content),
      htmlContent: template.htmlContent
        ? processText(template.htmlContent)
        : undefined,
      plainTextContent: template.plainTextContent
        ? processText(template.plainTextContent)
        : undefined,
    };
  }

  async getTemplateVariables(
    template: NotificationTemplate,
  ): Promise<string[]> {
    const variables: string[] = [];
    const regex = /\{\{(\w+)\}\}/g;
    let match;

    // Extract variables from content
    while ((match = regex.exec(template.content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    // Extract variables from subject
    if (template.subject) {
      regex.lastIndex = 0; // Reset regex
      while ((match = regex.exec(template.subject)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
    }

    // Extract variables from HTML content
    if (template.htmlContent) {
      regex.lastIndex = 0; // Reset regex
      while ((match = regex.exec(template.htmlContent)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
    }

    return variables;
  }

  async createDefaultTemplates(tenantId: string): Promise<void> {
    const defaultTemplates = [
      // Trip Status Templates
      {
        name: 'Trip Started',
        slug: 'trip-started',
        type: TemplateType.EMAIL,
        category: TemplateCategory.TRIP_STATUS,
        subject: 'Trip {{tripId}} has started',
        content:
          'Your trip {{tripId}} from {{origin}} to {{destination}} has started. Estimated arrival: {{eta}}.',
        variables: ['tripId', 'origin', 'destination', 'eta'],
      },
      {
        name: 'Trip Completed',
        slug: 'trip-completed',
        type: TemplateType.EMAIL,
        category: TemplateCategory.TRIP_STATUS,
        subject: 'Trip {{tripId}} completed successfully',
        content:
          'Your trip {{tripId}} has been completed successfully. Total distance: {{distance}}km.',
        variables: ['tripId', 'distance'],
      },
      {
        name: 'Trip Delayed',
        slug: 'trip-delayed',
        type: TemplateType.SMS,
        category: TemplateCategory.TRIP_STATUS,
        content:
          'Trip {{tripId}} is delayed. New ETA: {{newEta}}. Reason: {{reason}}.',
        variables: ['tripId', 'newEta', 'reason'],
      },

      // Payment Templates
      {
        name: 'Payment Received',
        slug: 'payment-received',
        type: TemplateType.EMAIL,
        category: TemplateCategory.PAYMENT,
        subject: 'Payment received for trip {{tripId}}',
        content:
          'Payment of {{amount}} has been received for trip {{tripId}}. Thank you!',
        variables: ['tripId', 'amount'],
      },
      {
        name: 'Payment Failed',
        slug: 'payment-failed',
        type: TemplateType.SMS,
        category: TemplateCategory.PAYMENT,
        content:
          'Payment for trip {{tripId}} failed. Please update payment method.',
        variables: ['tripId'],
      },

      // Safety Templates
      {
        name: 'Safety Alert',
        slug: 'safety-alert',
        type: TemplateType.PUSH,
        category: TemplateCategory.SAFETY,
        content:
          'Safety alert: {{alertType}} detected. Please check your vehicle.',
        variables: ['alertType'],
      },
      {
        name: 'Emergency Contact',
        slug: 'emergency-contact',
        type: TemplateType.SMS,
        category: TemplateCategory.SAFETY,
        content:
          'EMERGENCY: {{message}}. Location: {{location}}. Contact: {{contactNumber}}.',
        variables: ['message', 'location', 'contactNumber'],
      },

      // Performance Templates
      {
        name: 'Performance Report',
        slug: 'performance-report',
        type: TemplateType.EMAIL,
        category: TemplateCategory.PERFORMANCE,
        subject: 'Your performance report for {{period}}',
        content:
          'Your performance score for {{period}} is {{score}}. View detailed report: {{reportUrl}}.',
        variables: ['period', 'score', 'reportUrl'],
      },

      // Maintenance Templates
      {
        name: 'Maintenance Due',
        slug: 'maintenance-due',
        type: TemplateType.EMAIL,
        category: TemplateCategory.MAINTENANCE,
        subject: 'Vehicle maintenance due',
        content:
          'Maintenance is due for vehicle {{vehicleId}} on {{dueDate}}. Schedule appointment: {{scheduleUrl}}.',
        variables: ['vehicleId', 'dueDate', 'scheduleUrl'],
      },

      // System Templates
      {
        name: 'System Maintenance',
        slug: 'system-maintenance',
        type: TemplateType.EMAIL,
        category: TemplateCategory.SYSTEM,
        subject: 'Scheduled system maintenance',
        content:
          'System maintenance scheduled for {{startTime}} to {{endTime}}. Service may be temporarily unavailable.',
        variables: ['startTime', 'endTime'],
      },
    ];

    for (const templateData of defaultTemplates) {
      await this.createTemplate({
        ...templateData,
        tenantId,
        language: 'en',
        isDefault: true,
      });
    }

    this.logger.log(
      `Created ${defaultTemplates.length} default templates for tenant ${tenantId}`,
    );
  }
}
