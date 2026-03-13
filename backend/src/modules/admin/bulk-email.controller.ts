import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BulkEmailService } from '../../services/bulk-email.service';
import { AIEmailAssistantService } from '../../services/ai-email-assistant.service';
import { SmsService } from '../notifications/services/sms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
} from '../../entities/notification.entity';

@Controller('admin/bulk-email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class BulkEmailController {
  private readonly logger = new Logger(BulkEmailController.name);

  constructor(
    private readonly bulkEmailService: BulkEmailService,
    private readonly aiEmailAssistant: AIEmailAssistantService,
    private readonly smsService: SmsService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantRepository: Repository<Tenant>,
  ) {}

  // ─── Unified Multi-Channel Send ──────────────────────────────────────────

  /**
   * POST /admin/bulk-email/send
   * Send to TENANTS (TENANT_ADMIN users) via any combination of:
   *   email | sms | whatsapp | in_app
   *
   * Body:
   * {
   *   channels: string[],       // ['email','sms','whatsapp','in_app']
   *   subject: string,
   *   message: string,          // plain-text (SMS / WhatsApp / In-App)
   *   htmlBody?: string,        // rich HTML for email
   *   filters?: {
   *     status?: string[],
   *     tenantIds?: string[]
   *   }
   * }
   */
  @Post('send')
  async sendMultiChannel(@Request() req, @Body() body: any) {
    const { channels = ['email'], subject, message, htmlBody, filters } = body;

    if (!subject || !message) {
      throw new HttpException(
        { success: false, message: 'subject and message are required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    // ── Resolve tenant-admin users ─────────────────────────────────────────
    const userQuery = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'TENANT_ADMIN' })
      .andWhere('user.deletedAt IS NULL');

    if (filters?.tenantIds?.length) {
      userQuery.andWhere('user.tenantId IN (:...tenantIds)', { tenantIds: filters.tenantIds });
    }
    if (filters?.status?.length) {
      userQuery.andWhere('user.status IN (:...statuses)', { statuses: filters.status });
    }

    const users = await userQuery.getMany();
    this.logger.log(`[admin/communicate] ${users.length} recipients | channels: ${channels.join(', ')}`);

    const results: Record<string, any> = {};

    // ── EMAIL ────────────────────────────────────────────────────────────
    if (channels.includes('email')) {
      try {
        const log = await this.bulkEmailService.sendCustomBulkEmail(
          req.user.userId,
          req.user.email,
          subject,
          htmlBody || `<p>${message}</p>`,
          message,
          filters,
        );
        results.email = { success: true, recipientsCount: log.recipientsCount };
      } catch (e) {
        results.email = { success: false, error: e.message };
      }
    }

    // ── SMS ──────────────────────────────────────────────────────────────
    if (channels.includes('sms')) {
      try {
        const smsRcpts = users.filter(u => !!u.phone).map(u => ({ phone: u.phone, message }));
        const smsRes = await this.smsService.sendBulkSms(smsRcpts);
        results.sms = { success: true, sent: smsRes.filter(r => r.success).length, total: smsRcpts.length };
      } catch (e) {
        results.sms = { success: false, error: e.message };
      }
    }

    // ── WHATSAPP ─────────────────────────────────────────────────────────
    if (channels.includes('whatsapp')) {
      try {
        const waRcpts = users
          .filter(u => !!u.phone)
          .map(u => ({ phone: `whatsapp:${u.phone}`, message: `*${subject}*\n\n${message}` }));
        const waRes = await this.smsService.sendBulkSms(waRcpts);
        results.whatsapp = { success: true, sent: waRes.filter(r => r.success).length, total: waRcpts.length };
      } catch (e) {
        results.whatsapp = { success: false, error: e.message };
      }
    }

    // ── IN-APP ───────────────────────────────────────────────────────────
    if (channels.includes('in_app')) {
      try {
        const notifications = users.map(u => ({
          type: NotificationType.GENERAL,
          priority: NotificationPriority.NORMAL,
          subject,
          content: message,
          userId: u.id,
          channel: NotificationChannel.IN_APP,
          category: NotificationCategory.SYSTEM,
          metadata: { sentBy: req.user.email, adminBroadcast: true },
          tenantId: u.tenantId,
          templateId: 'admin-broadcast',
        }));

        // Group by tenantId for createBulkNotifications
        const byTenant = notifications.reduce((acc: any, n: any) => {
          if (!acc[n.tenantId]) acc[n.tenantId] = [];
          acc[n.tenantId].push(n);
          return acc;
        }, {} as Record<string, any[]>);

        await Promise.all(
          Object.entries(byTenant).map(([tid, notifs]) =>
            this.notificationsService.createBulkNotifications(notifs as any, tid),
          ),
        );
        results.in_app = { success: true, sent: users.length };
      } catch (e) {
        results.in_app = { success: false, error: e.message };
      }
    }

    return {
      success: true,
      message: `Campaign dispatched via ${channels.join(', ')}`,
      recipientsFound: users.length,
      results,
    };
  }

  // ─── Tenant Picker ───────────────────────────────────────────────────────

  /**
   * GET /admin/bulk-email/tenants
   * Lightweight list of all tenants that have at least one TENANT_ADMIN user.
   * Used by the multi-select picker on the frontend.
   */
  @Get('tenants')
  async getTenantList() {
    try {
      // Find all distinct tenant IDs for active TENANT_ADMINs
      const activeAdminRecords = await this.userRepository
        .createQueryBuilder('user')
        .select('user.tenantId', 'tenantId')
        .where('user.role = :role', { role: 'TENANT_ADMIN' })
        .andWhere('user.deletedAt IS NULL')
        .getRawMany();

      // Extract raw IDs
      const tenantIds = activeAdminRecords
        .map(record => record.tenantId)
        .filter((id, index, self) => id && self.indexOf(id) === index); // unique and non-null

      if (tenantIds.length === 0) {
        return { success: true, data: [] };
      }

      // Fetch the Tenant entities for those IDs
      const tenants = await this.tenantRepository
        .createQueryBuilder('tenant')
        .select([
          'tenant.id',
          'tenant.name',
          'tenant.status',
          'tenant.subdomain',
          'tenant.contactEmail',
        ])
        .where('tenant.id IN (:...tenantIds)', { tenantIds })
        .orderBy('tenant.name', 'ASC')
        .getMany();

      return { success: true, data: tenants };
    } catch (error) {
      this.logger.error(`GET /admin/bulk-email/tenants failed: ${error.message}`, error.stack);
      return { success: false, message: error.message, data: [] };
    }
  }

  // Email Templates
  @Get('templates')
  async getAllTemplates() {
    try {
      const templates = await this.bulkEmailService.getAllTemplates();
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch email templates',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates/active')
  async getActiveTemplates() {
    try {
      const templates = await this.bulkEmailService.getActiveTemplates();
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch active templates',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    try {
      const template = await this.bulkEmailService.getTemplate(id);
      if (!template) {
        throw new HttpException(
          {
            success: false,
            message: 'Template not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: template,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('templates')
  async createTemplate(@Request() req, @Body() body: any) {
    try {
      const template = await this.bulkEmailService.createTemplate({
        ...body,
        createdBy: req.user.userId,
      });
      return {
        success: true,
        message: 'Email template created successfully',
        data: template,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create email template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('templates/:id')
  async updateTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    try {
      const template = await this.bulkEmailService.updateTemplate(id, {
        ...body,
        updatedBy: req.user.userId,
      });
      return {
        success: true,
        message: 'Email template updated successfully',
        data: template,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update email template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    try {
      await this.bulkEmailService.deleteTemplate(id);
      return {
        success: true,
        message: 'Email template deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete email template',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Bulk Email Sending
  @Post('send-template')
  async sendBulkEmailWithTemplate(@Request() req, @Body() body: any) {
    try {
      const { templateId, filters } = body;

      if (!templateId) {
        throw new HttpException(
          {
            success: false,
            message: 'Template ID is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const log = await this.bulkEmailService.sendBulkEmailToTenants(
        req.user.userId,
        req.user.email,
        templateId,
        filters,
      );

      return {
        success: true,
        message: 'Bulk email sending initiated',
        data: log,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send bulk email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-custom')
  async sendCustomBulkEmail(@Request() req, @Body() body: any) {
    try {
      const { subject, htmlBody, textBody, filters } = body;

      if (!subject || !htmlBody) {
        throw new HttpException(
          {
            success: false,
            message: 'Subject and HTML body are required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const log = await this.bulkEmailService.sendCustomBulkEmail(
        req.user.userId,
        req.user.email,
        subject,
        htmlBody,
        textBody,
        filters,
      );

      return {
        success: true,
        message: 'Custom bulk email sending initiated',
        data: log,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to send custom bulk email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Bulk Email Logs
  @Get('logs')
  async getBulkEmailLogs() {
    try {
      const logs = await this.bulkEmailService.getBulkEmailLogs();
      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch bulk email logs',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('logs/:id')
  async getBulkEmailLog(@Param('id') id: string) {
    try {
      const log = await this.bulkEmailService.getBulkEmailLog(id);
      if (!log) {
        throw new HttpException(
          {
            success: false,
            message: 'Log not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: log,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch bulk email log',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // AI Assistant Endpoints
  @Get('ai/status')
  async getAIStatus() {
    return {
      success: true,
      data: {
        available: this.aiEmailAssistant.isAvailable(),
        message: this.aiEmailAssistant.isAvailable()
          ? 'AI Email Assistant is ready'
          : 'AI Email Assistant is not configured. Add ANTHROPIC_API_KEY to enable.',
      },
    };
  }

  @Post('ai/generate')
  async generateEmail(@Body() body: any) {
    try {
      if (!this.aiEmailAssistant.isAvailable()) {
        throw new HttpException(
          {
            success: false,
            message: 'AI Email Assistant is not configured',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const suggestion = await this.aiEmailAssistant.generateEmail({
        purpose: body.purpose,
        tone: body.tone,
        keyPoints: body.keyPoints,
        targetAudience: body.targetAudience || 'logistics companies',
        additionalContext: body.additionalContext,
      });

      return {
        success: true,
        data: suggestion,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ai/improve')
  async improveEmail(@Body() body: any) {
    try {
      if (!this.aiEmailAssistant.isAvailable()) {
        throw new HttpException(
          {
            success: false,
            message: 'AI Email Assistant is not configured',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const suggestion = await this.aiEmailAssistant.improveEmail({
        currentSubject: body.currentSubject,
        currentBody: body.currentBody,
        improvementType: body.improvementType,
        tone: body.tone,
      });

      return {
        success: true,
        data: suggestion,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to improve email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ai/subject-lines')
  async generateSubjectLines(@Body() body: any) {
    try {
      if (!this.aiEmailAssistant.isAvailable()) {
        throw new HttpException(
          {
            success: false,
            message: 'AI Email Assistant is not configured',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const subjectLines = await this.aiEmailAssistant.generateSubjectLines(
        body.context,
        body.count || 5,
      );

      return {
        success: true,
        data: subjectLines,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate subject lines',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ai/analyze')
  async analyzeEmail(@Body() body: any) {
    try {
      if (!this.aiEmailAssistant.isAvailable()) {
        throw new HttpException(
          {
            success: false,
            message: 'AI Email Assistant is not configured',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const analysis = await this.aiEmailAssistant.analyzeEmailEffectiveness(
        body.subject,
        body.body,
      );

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to analyze email',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
