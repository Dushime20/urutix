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

  private async notifySuperAdmins(
    tenantId: string,
    title: string,
    message: string,
    entityType: EntityType,
    entityId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const superAdmins = await this.getSuperAdmins();
    if (!superAdmins.length) {
      this.logger.warn(`No active super admins available for "${title}"`);
      return;
    }

    await Promise.all(
      superAdmins.map(async (admin) => {
        const notification = this.notificationRepository.create({
          tenantId,
          recipientId: admin.id,
          notificationType: NotificationType.SYSTEM_UPDATE,
          category: NotificationCategory.SYSTEM,
          priority: NotificationPriority.HIGH,
          title,
          message,
          shortMessage: title,
          entityType,
          entityId,
          channels: [NotificationChannel.IN_APP],
          status: NotificationStatus.SENT,
          isRead: false,
          requiresAction: true,
          actionUrl: '/admin/notifications',
          actionText: 'Open Notifications',
          metadata: {
            ...metadata,
            recipientRole: admin.role,
            audience: 'SUPER_ADMIN',
          },
        });

        const saved = await this.notificationRepository.save(notification);
        this.eventsGateway.emitNotification(admin.id, saved);
      }),
    );
  }

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
    await this.notifySuperAdmins(
      payload.tenantId,
      'Tenant Admin Purchased Credits',
      `A tenant admin purchased ${payload.credits} credits (${payload.packageName}) for ${payload.currency} ${payload.amount}.`,
      EntityType.PAYMENT,
      payload.paymentId,
      payload,
    );
  }

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
    await this.notifySuperAdmins(
      payload.tenantId,
      'New Truck Added',
      `A truck owner added a new truck (${truckLabel}, plate ${payload.plateNumber}).`,
      EntityType.TRUCK,
      payload.truckId,
      payload,
    );
  }

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
    await this.notifySuperAdmins(
      payload.tenantId,
      'New Cargo/Load Added',
      `A cargo owner added new cargo "${payload.title}" (${payload.origin} -> ${payload.destination}).`,
      EntityType.CARGO,
      payload.cargoId,
      payload,
    );
  }

  @OnEvent('system.admin.tenant_user_created')
  async onTenantUserCreated(payload: {
    tenantId: string;
    actorId: string;
    actorRole: string;
    newUserId: string;
    newUserRole: string;
    newUserEmail: string;
  }) {
    await this.notifySuperAdmins(
      payload.tenantId,
      'Tenant Admin Added New User',
      `A tenant admin created a new user (${payload.newUserEmail}) with role ${payload.newUserRole}.`,
      EntityType.USER,
      payload.newUserId,
      payload,
    );
  }
}
