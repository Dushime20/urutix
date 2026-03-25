import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BulkEmailService } from '../../services/bulk-email.service';
import { SmsService } from '../notifications/services/sms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../../entities/user.entity';
import {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
} from '../../entities/notification.entity';

@Controller('tenant-dashboard/communicate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TENANT_ADMIN', 'ADMIN', 'TRUCK_OWNER', 'CARGO_OWNER')
export class TenantBulkEmailController {
  private readonly logger = new Logger(TenantBulkEmailController.name);

  constructor(
    private readonly bulkEmailService: BulkEmailService,
    private readonly smsService: SmsService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  /** ── GET available partners for communication ── */
  @Get('partners')
  async getAvailablePartners(@Request() req) {
    try {
      const tenantId = req.user.tenantId;
      
      // Get all users in the tenant except TENANT_ADMIN (to avoid self-communication)
      const partners = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('user.tenantId = :tenantId', { tenantId })
        .andWhere('user.deletedAt IS NULL')
        .andWhere('user.role != :adminRole', { adminRole: 'TENANT_ADMIN' })
        .andWhere('user.status = :status', { status: 'ACTIVE' })
        .select([
          'user.id',
          'user.email',
          'user.phone',
          'user.role',
          'user.status',
          'user.lastLoginAt',
          'profile.firstName',
          'profile.lastName',
          'profile.companyName',
          'profile.avatarUrl'
        ])
        .orderBy('user.role', 'ASC')
        .addOrderBy('profile.firstName', 'ASC')
        .getMany();

      // Group partners by role for better organization
      const groupedPartners = partners.reduce((acc, partner) => {
        const role = partner.role;
        if (!acc[role]) {
          acc[role] = [];
        }
        acc[role].push({
          id: partner.id,
          email: partner.email,
          phone: partner.phone,
          role: partner.role,
          status: partner.status,
          lastLoginAt: partner.lastLoginAt,
          name: partner.profile ? 
            `${partner.profile.firstName || ''} ${partner.profile.lastName || ''}`.trim() || 
            partner.profile.companyName || 
            partner.email.split('@')[0] : 
            partner.email.split('@')[0],
          companyName: partner.profile?.companyName,
          profilePictureUrl: partner.profile?.avatarUrl
        });
        return acc;
      }, {});

      return { 
        success: true, 
        data: {
          partners: groupedPartners,
          totalCount: partners.length,
          roleStats: Object.keys(groupedPartners).map(role => ({
            role,
            count: groupedPartners[role].length
          }))
        }
      };
    } catch (error) {
      this.logger.error(`Failed to fetch partners: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Failed to fetch partners', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** ── GET logs ── */
  @Get('logs')
  async getPartnerEmailLogs(@Request() req) {
    try {
      const logs = await this.bulkEmailService.getPartnerEmailLogs(req.user.tenantId);
      return { success: true, data: logs };
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Failed to fetch logs', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** ── GET templates (shared library from super-admin) ── */
  @Get('templates')
  async getTemplates() {
    try {
      const templates = await this.bulkEmailService.getActiveTemplates();
      return { success: true, data: templates };
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Failed to fetch templates', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * POST /tenant-dashboard/communicate/send
   * Unified multi-channel send: EMAIL, SMS, WHATSAPP (via SMS), IN_APP
   *
   * Body:
   * {
   *   channels: string[],        // ['email','sms','whatsapp','in_app']
   *   subject: string,           // used by email & in-app title
   *   message: string,           // plain-text body (SMS / WhatsApp / In-App)
   *   htmlBody?: string,         // rich HTML for email
   *   filters?: {
   *     roles?: string[],        // Filter by user roles
   *     status?: string[],       // Filter by user status
   *     partnerIds?: string[]    // Specific partner IDs to send to
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

    const tenantId: string = req.user.tenantId;

    // ── Resolve recipient users ──────────────────────────────────────────
    const userQuery = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('user.deletedAt IS NULL')
      .andWhere('user.role != :adminRole', { adminRole: 'TENANT_ADMIN' }); // Exclude tenant admin

    // If specific partner IDs are provided, use them
    if (filters?.partnerIds?.length) {
      userQuery.andWhere('user.id IN (:...partnerIds)', { partnerIds: filters.partnerIds });
    } else {
      // Otherwise, use role and status filters
      if (filters?.roles?.length) {
        userQuery.andWhere('user.role IN (:...roles)', { roles: filters.roles });
      }
      if (filters?.status?.length) {
        userQuery.andWhere('user.status IN (:...statuses)', { statuses: filters.status });
      } else {
        // Default to active users only
        userQuery.andWhere('user.status = :status', { status: 'ACTIVE' });
      }
    }

    const users = await userQuery.getMany();
    this.logger.log(`[communicate] ${users.length} recipients | channels: ${channels.join(', ')}`);

    if (users.length === 0) {
      throw new HttpException(
        { success: false, message: 'No recipients found matching the criteria' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const results: Record<string, any> = {};

    // ── EMAIL ────────────────────────────────────────────────────────────
    if (channels.includes('email')) {
      try {
        const log = await this.bulkEmailService.sendBulkEmailToPartners(
          req.user.userId,
          req.user.email,
          tenantId,
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
        const smsRecipients = users
          .filter(u => !!u.phone)
          .map(u => ({ phone: u.phone, message }));

        if (smsRecipients.length === 0) {
          results.sms = { success: false, error: 'No recipients with phone numbers found' };
        } else {
          const smsResults = await this.smsService.sendBulkSms(smsRecipients);
          const successCount = smsResults.filter(r => r.success).length;
          results.sms = { success: true, sent: successCount, total: smsRecipients.length };
        }
      } catch (e) {
        results.sms = { success: false, error: e.message };
      }
    }

    // ── WHATSAPP (via WhatsApp Business / Twilio sandbox prefix) ─────────
    if (channels.includes('whatsapp')) {
      try {
        const waRecipients = users
          .filter(u => !!u.phone)
          .map(u => ({ phone: `whatsapp:${u.phone}`, message: `*${subject}*\n\n${message}` }));

        if (waRecipients.length === 0) {
          results.whatsapp = { success: false, error: 'No recipients with phone numbers found' };
        } else {
          const waResults = await this.smsService.sendBulkSms(waRecipients);
          const successCount = waResults.filter(r => r.success).length;
          results.whatsapp = { success: true, sent: successCount, total: waRecipients.length };
        }
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
          relatedEntityType: 'USER',
          relatedEntityId: u.id,
          metadata: { 
            sentBy: req.user.email, 
            broadcast: true,
            recipientRole: u.role,
            recipientName: u.profile ? 
              `${u.profile.firstName || ''} ${u.profile.lastName || ''}`.trim() || 
              u.profile.companyName || 
              u.email.split('@')[0] : 
              u.email.split('@')[0]
          },
          tenantId,
          templateId: 'partner-broadcast',
        }));

        await this.notificationsService.createBulkNotifications(
          notifications as any,
          tenantId,
        );
        results.in_app = { success: true, sent: users.length };
      } catch (e) {
        require('fs').appendFileSync('C:\\Users\\HP\\Desktop\\urutix\\in-app-error.log', '\n' + e.stack);
        results.in_app = { success: false, error: e.message };
      }
    }

    // Create a summary of recipients by role
    const recipientSummary = users.reduce((acc, user) => {
      const role = user.role;
      if (!acc[role]) {
        acc[role] = 0;
      }
      acc[role]++;
      return acc;
    }, {});

    return {
      success: true,
      message: `Campaign dispatched via ${channels.join(', ')}`,
      recipientsFound: users.length,
      recipientSummary,
      results,
    };
  }
}
