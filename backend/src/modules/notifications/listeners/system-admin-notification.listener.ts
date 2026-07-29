import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EntityType,
  Notification,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '../../../entities/notification.entity';
import { User, UserRole, UserStatus } from '../../../entities/user.entity';
import { EventsGateway } from '../../events/events.gateway';

type NotifyOptions = {
  tenantId: string;
  title: string;
  message: string;
  entityType: EntityType;
  entityId?: string;
  metadata?: Record<string, any>;
  notificationType?: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  requiresAction?: boolean;
};

/**
 * Central platform-ops inbox for SUPER_ADMIN users.
 * Domain services emit `system.admin.*` (or selected domain events);
 * this listener persists in-app notifications and pushes them over websocket.
 */
@Injectable()
export class SystemAdminNotificationListener {
  private readonly logger = new Logger(SystemAdminNotificationListener.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async getSuperAdmins(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
  }

  private async notifySuperAdmins(options: NotifyOptions): Promise<void> {
    const {
      tenantId,
      title,
      message,
      entityType,
      entityId,
      metadata,
      notificationType = NotificationType.SYSTEM_UPDATE,
      category = NotificationCategory.SYSTEM,
      priority = NotificationPriority.HIGH,
      actionUrl = '/admin/onboarding',
      actionText = 'Open Notifications Hub',
      requiresAction = true,
    } = options;

    if (!tenantId) {
      this.logger.warn(`Skipping "${title}" — missing tenantId`);
      return;
    }

    const superAdmins = await this.getSuperAdmins();
    if (!superAdmins.length) {
      this.logger.warn(`No active super admins available for "${title}"`);
      return;
    }

    await Promise.all(
      superAdmins.map(async (admin) => {
        try {
          const notification = this.notificationRepository.create({
            tenantId,
            recipientId: admin.id,
            notificationType,
            category,
            priority,
            title,
            message,
            shortMessage: title,
            entityType,
            entityId,
            channels: [NotificationChannel.IN_APP],
            status: NotificationStatus.SENT,
            isRead: false,
            requiresAction,
            actionUrl,
            actionText,
            metadata: {
              ...metadata,
              recipientRole: admin.role,
              audience: 'SUPER_ADMIN',
              eventTitle: title,
            },
          });

          const saved = await this.notificationRepository.save(notification);
          this.eventsGateway.emitNotification(admin.id, saved);
        } catch (error) {
          this.logger.error(
            `Failed to notify super admin ${admin.id} for "${title}": ${error.message}`,
          );
        }
      }),
    );

    this.logger.log(
      `Notified ${superAdmins.length} super admin(s): ${title}`,
    );
  }

  // ── Credits / billing ────────────────────────────────────────────────────

  @OnEvent('system.admin.credit_purchased')
  async onCreditPurchased(payload: {
    tenantId: string;
    actorId: string;
    actorRole: string;
    packageId: string;
    packageName: string;
    credits: number;
    amount: number;
    currency: string;
    paymentId: string;
  }) {
    await this.notifySuperAdmins({
      tenantId: payload.tenantId,
      title: 'Credits Purchased',
      message: `${payload.actorRole || 'A user'} purchased ${payload.credits} credits (${payload.packageName}) for ${payload.currency} ${payload.amount}.`,
      entityType: EntityType.PAYMENT,
      entityId: payload.paymentId,
      metadata: payload,
      category: NotificationCategory.FINANCIAL,
      notificationType: NotificationType.PAYMENT_RECEIVED,
      actionUrl: '/admin/credits',
      actionText: 'View Credits',
    });
  }

  // ── Fleet ─────────────────────────────────────────────────────────────────

  @OnEvent('system.admin.truck_created')
  async onTruckCreated(payload: {
    tenantId: string;
    actorId: string;
    actorRole: string;
    truckId: string;
    plateNumber: string;
    make?: string;
    model?: string;
  }) {
    const truckLabel =
      [payload.make, payload.model].filter(Boolean).join(' ') || 'truck';
    await this.notifySuperAdmins({
      tenantId: payload.tenantId,
      title: 'New Truck Added',
      message: `${payload.actorRole || 'A user'} added a new truck (${truckLabel}, plate ${payload.plateNumber}).`,
      entityType: EntityType.TRUCK,
      entityId: payload.truckId,
      metadata: payload,
      category: NotificationCategory.VEHICLE,
      actionUrl: '/admin/trucks',
      actionText: 'View Trucks',
    });
  }

  @OnEvent('system.admin.driver_created')
  async onDriverCreated(payload: {
    tenantId: string;
    actorId: string;
    actorRole: string;
    driverId: string;
    driverEmail?: string;
    driverName?: string;
    licenseNumber?: string;
  }) {
    const who =
      payload.driverName ||
      payload.driverEmail ||
      payload.licenseNumber ||
      payload.driverId;
    await this.notifySuperAdmins({
      tenantId: payload.tenantId,
      title: 'New Driver Added',
      message: `${payload.actorRole || 'A user'} created a new driver (${who}).`,
      entityType: EntityType.DRIVER,
      entityId: payload.driverId,
      metadata: payload,
      category: NotificationCategory.DRIVER,
      actionUrl: '/admin/drivers',
      actionText: 'View Drivers',
    });
  }

  // ── Cargo ─────────────────────────────────────────────────────────────────

  @OnEvent('system.admin.cargo_created')
  async onCargoCreated(payload: {
    tenantId: string;
    actorId: string;
    actorRole: string;
    cargoId: string;
    title: string;
    origin: string;
    destination: string;
    weight: number;
    amount: number;
  }) {
    await this.notifySuperAdmins({
      tenantId: payload.tenantId,
      title: 'New Cargo / Load Added',
      message: `${payload.actorRole || 'A user'} added cargo "${payload.title}" (${payload.origin} → ${payload.destination}).`,
      entityType: EntityType.CARGO,
      entityId: payload.cargoId,
      metadata: payload,
      category: NotificationCategory.CARGO,
      actionUrl: '/admin/loads',
      actionText: 'View Loads',
    });
  }

  // ── Users / tenants ───────────────────────────────────────────────────────

  @OnEvent('system.admin.tenant_user_created')
  async onTenantUserCreated(payload: {
    tenantId: string;
    actorId: string;
    actorRole: string;
    newUserId: string;
    newUserRole: string;
    newUserEmail: string;
  }) {
    await this.notifySuperAdmins({
      tenantId: payload.tenantId,
      title: 'New Tenant User Created',
      message: `${payload.actorRole || 'A user'} created ${payload.newUserEmail} with role ${payload.newUserRole}.`,
      entityType: EntityType.USER,
      entityId: payload.newUserId,
      metadata: payload,
      category: NotificationCategory.USER,
      actionUrl: '/admin/users',
      actionText: 'View Users',
    });
  }

  @OnEvent('system.admin.tenant_created')
  async onTenantCreated(payload: {
    tenantId: string;
    tenantName: string;
    subdomain?: string;
    contactEmail?: string;
    plan?: string;
    actorId?: string;
    actorRole?: string;
  }) {
    await this.notifySuperAdmins({
      tenantId: payload.tenantId,
      title: 'New Tenant Created',
      message: `Tenant "${payload.tenantName}"${payload.subdomain ? ` (${payload.subdomain})` : ''} was created${payload.contactEmail ? ` — contact ${payload.contactEmail}` : ''}.`,
      entityType: EntityType.TENANT,
      entityId: payload.tenantId,
      metadata: payload,
      category: NotificationCategory.BUSINESS,
      priority: NotificationPriority.URGENT,
      actionUrl: '/admin/tenants',
      actionText: 'View Tenants',
    });
  }

  @OnEvent('system.admin.tenant_kyc_submitted')
  async onTenantKycSubmitted(payload: {
    tenantId: string;
    tenantName?: string;
    kycStatus?: string;
  }) {
    await this.notifySuperAdmins({
      tenantId: payload.tenantId,
      title: 'Tenant KYC Submitted',
      message: `KYC was submitted for review${payload.tenantName ? ` by "${payload.tenantName}"` : ''}.`,
      entityType: EntityType.TENANT,
      entityId: payload.tenantId,
      metadata: payload,
      category: NotificationCategory.COMPLIANCE,
      priority: NotificationPriority.URGENT,
      actionUrl: '/admin/tenants',
      actionText: 'Review KYC',
    });
  }

  // ── Lending ───────────────────────────────────────────────────────────────

  @OnEvent('system.admin.loan_requested')
  async onLoanRequested(payload: {
    tenantId: string;
    loanId: string;
    actorId?: string;
    actorRole?: string;
    amount?: number;
    currency?: string;
    cargoId?: string;
  }) {
    const amountLabel =
      payload.amount != null
        ? `${payload.currency || 'USD'} ${payload.amount}`
        : 'an undisclosed amount';
    await this.notifySuperAdmins({
      tenantId: payload.tenantId,
      title: 'New Loan Request',
      message: `${payload.actorRole || 'A user'} requested a loan for ${amountLabel}.`,
      entityType: EntityType.LOAN,
      entityId: payload.loanId,
      metadata: payload,
      category: NotificationCategory.LOAN,
      notificationType: NotificationType.LOAN_REQUESTED,
      actionUrl: '/admin/lending',
      actionText: 'View Loans',
    });
  }

  // ── Payments (platform visibility) ────────────────────────────────────────

  @OnEvent('system.admin.payment_received')
  async onPaymentReceived(payload: {
    tenantId: string;
    paymentId: string;
    amount: number;
    currency?: string;
    paymentSource?: string;
    recipientName?: string;
    senderName?: string;
  }) {
    await this.notifySuperAdmins({
      tenantId: payload.tenantId,
      title: 'Payment Completed',
      message: `Payment of ${payload.currency || 'USD'} ${payload.amount} completed${payload.paymentSource ? ` (${payload.paymentSource})` : ''}${payload.recipientName ? ` → ${payload.recipientName}` : ''}.`,
      entityType: EntityType.PAYMENT,
      entityId: payload.paymentId,
      metadata: payload,
      category: NotificationCategory.FINANCIAL,
      notificationType: NotificationType.PAYMENT_RECEIVED,
      priority: NotificationPriority.NORMAL,
      requiresAction: false,
      actionUrl: '/admin/payments',
      actionText: 'View Payments',
    });
  }
}