import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  NotificationStatus,
  EntityType,
} from '../../../entities/notification.entity';
import { EventsGateway } from '../../events/events.gateway';

interface PaymentReceivedPayload {
  paymentId: string;
  recipientId: string;
  recipientName: string;
  senderId: string;
  senderName: string;
  amount: number;
  tenantId: string;
  paymentSource?: 'WALLET' | 'LOAN' | 'BANK_TRANSFER';
  tripId?: string;
  cargoTitle?: string;
}

interface PaymentReminderPayload {
  invoiceId: string;
  cargoOwnerId: string;
  amount: number;
  dueDate: Date;
  tenantId: string;
  tripId?: string;
  cargoTitle?: string;
  daysOverdue?: number;
}

@Injectable()
export class PaymentNotificationListener {
  private readonly logger = new Logger(PaymentNotificationListener.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Truck Owner receives: Payment received
   */
  @OnEvent('payment.received')
  async handlePaymentReceived(payload: PaymentReceivedPayload) {
    this.logger.log(
      `Handling payment.received event for payment ${payload.paymentId}`,
    );

    try {
      const paymentSourceText = payload.paymentSource === 'LOAN' 
        ? ' (via lender financing)' 
        : '';

      const notification = this.notificationRepository.create({
        recipientId: payload.recipientId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.PAYMENT_RECEIVED,
        category: NotificationCategory.FINANCIAL,
        priority: NotificationPriority.HIGH,
        title: '💰 Payment Received',
        message: `You have received a payment of ${payload.amount.toLocaleString()} RWF from ${payload.senderName}${paymentSourceText}${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}.`,
        shortMessage: `+${payload.amount.toLocaleString()} RWF`,
        entityType: EntityType.PAYMENT,
        entityId: payload.paymentId,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
        ],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/dashboard/payments`,
        actionText: 'View Payment',
        metadata: {
          paymentId: payload.paymentId,
          senderId: payload.senderId,
          senderName: payload.senderName,
          amount: payload.amount,
          paymentSource: payload.paymentSource,
          tripId: payload.tripId,
          cargoTitle: payload.cargoTitle,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(payload.recipientId, saved);

      this.logger.log(
        `Successfully sent payment received notification to ${payload.recipientId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment received notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Truck Owner receives: Payment received (specific for truck owners)
   */
  @OnEvent('payment.truck.owner.received')
  async handleTruckOwnerPaymentReceived(payload: PaymentReceivedPayload) {
    this.logger.log(
      `Handling payment.truck.owner.received event for payment ${payload.paymentId}`,
    );

    try {
      const paymentSourceText = payload.paymentSource === 'LOAN' 
        ? ' The payment was made by a lender on behalf of the cargo owner.' 
        : '';

      const notification = this.notificationRepository.create({
        recipientId: payload.recipientId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.TRUCK_OWNER_PAYMENT_RECEIVED,
        category: NotificationCategory.FINANCIAL,
        priority: NotificationPriority.HIGH,
        title: '💵 Payment Received',
        message: `You have received ${payload.amount.toLocaleString()} RWF from ${payload.senderName}${payload.cargoTitle ? ` for trip "${payload.cargoTitle}"` : ''}.${paymentSourceText}`,
        shortMessage: `Payment: ${payload.amount.toLocaleString()} RWF`,
        entityType: EntityType.PAYMENT,
        entityId: payload.paymentId,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.SMS,
        ],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: false,
        actionUrl: `/dashboard/fleet/financial`,
        actionText: 'View Payments',
        metadata: {
          paymentId: payload.paymentId,
          senderId: payload.senderId,
          senderName: payload.senderName,
          amount: payload.amount,
          paymentSource: payload.paymentSource,
          tripId: payload.tripId,
          cargoTitle: payload.cargoTitle,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(payload.recipientId, saved);

      this.logger.log(
        `Successfully sent truck owner payment received notification to ${payload.recipientId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send truck owner payment received notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cargo Owner receives: Payment reminder
   */
  @OnEvent('payment.reminder')
  async handlePaymentReminder(payload: PaymentReminderPayload) {
    this.logger.log(
      `Handling payment.reminder event for invoice ${payload.invoiceId}`,
    );

    try {
      const dueDateStr = new Date(payload.dueDate).toLocaleDateString();
      const isOverdue = payload.daysOverdue && payload.daysOverdue > 0;
      const overdueText = isOverdue 
        ? ` This payment is ${payload.daysOverdue} day${payload.daysOverdue > 1 ? 's' : ''} overdue.` 
        : '';

      const notification = this.notificationRepository.create({
        recipientId: payload.cargoOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.PAYMENT_REMINDER,
        category: NotificationCategory.FINANCIAL,
        priority: isOverdue ? NotificationPriority.URGENT : NotificationPriority.HIGH,
        title: isOverdue ? '⚠️ Payment Overdue' : '📅 Payment Reminder',
        message: `Payment of ${payload.amount.toLocaleString()} RWF is ${isOverdue ? 'overdue' : 'due'} on ${dueDateStr}${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}.${overdueText} Please make the payment as soon as possible.`,
        shortMessage: `Payment ${isOverdue ? 'overdue' : 'due'}: ${payload.amount.toLocaleString()} RWF`,
        entityType: EntityType.PAYMENT,
        entityId: payload.invoiceId,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
          ...(isOverdue ? [NotificationChannel.SMS] : []),
        ],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl: `/dashboard/payments`,
        actionText: 'Make Payment',
        metadata: {
          invoiceId: payload.invoiceId,
          amount: payload.amount,
          dueDate: payload.dueDate,
          tripId: payload.tripId,
          cargoTitle: payload.cargoTitle,
          daysOverdue: payload.daysOverdue,
          isOverdue,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: isOverdue,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(payload.cargoOwnerId, saved);

      this.logger.log(
        `Successfully sent payment reminder notification to cargo owner ${payload.cargoOwnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment reminder notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cargo Owner receives: Payment due soon (3 days before)
   */
  @OnEvent('payment.due.soon')
  async handlePaymentDueSoon(payload: PaymentReminderPayload) {
    this.logger.log(
      `Handling payment.due.soon event for invoice ${payload.invoiceId}`,
    );

    try {
      const dueDateStr = new Date(payload.dueDate).toLocaleDateString();

      const notification = this.notificationRepository.create({
        recipientId: payload.cargoOwnerId,
        tenantId: payload.tenantId,
        notificationType: NotificationType.PAYMENT_DUE,
        category: NotificationCategory.FINANCIAL,
        priority: NotificationPriority.NORMAL,
        title: '📌 Payment Due Soon',
        message: `Reminder: Payment of ${payload.amount.toLocaleString()} RWF is due on ${dueDateStr}${payload.cargoTitle ? ` for "${payload.cargoTitle}"` : ''}.`,
        shortMessage: `Payment due: ${dueDateStr}`,
        entityType: EntityType.PAYMENT,
        entityId: payload.invoiceId,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        status: NotificationStatus.SENT,
        isRead: false,
        requiresAction: true,
        actionUrl: `/dashboard/payments`,
        actionText: 'View Invoice',
        metadata: {
          invoiceId: payload.invoiceId,
          amount: payload.amount,
          dueDate: payload.dueDate,
          tripId: payload.tripId,
          cargoTitle: payload.cargoTitle,
        },
        userPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
        },
        analytics: {
          openCount: 0,
          clickCount: 0,
        },
      });

      const saved = await this.notificationRepository.save(notification);
      this.eventsGateway.emitNotification(payload.cargoOwnerId, saved);

      this.logger.log(
        `Successfully sent payment due soon notification to cargo owner ${payload.cargoOwnerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment due soon notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
