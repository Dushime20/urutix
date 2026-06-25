import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getEnvConfig } from '../../../config/env.config';

import { User } from '../../../entities/user.entity';
import { Payment } from '../../../entities/payment.entity';
import { Trip } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';
import { NotificationService } from './notification.service';
import { EmailService } from '../../auth/services/email.service';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannel,
} from '../../../entities/notification.entity';

@Injectable()
export class PaymentNotificationService {
  private readonly logger = new Logger(PaymentNotificationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Send comprehensive payment notifications following international logistics standards
   */
  async sendPaymentCreatedNotifications(
    payment: Payment,
    trip: Trip,
    cargoOwner: User,
    truckOwner: User,
    tenantId: string,
  ): Promise<void> {
    this.logger.log(`Sending payment notifications for payment ${payment.id}`);

    const cargoTitle = trip.load?.title || trip.load?.cargoType || 'Cargo';
    const tripNumber = trip.tripNumber || trip.id.slice(-8).toUpperCase();
    const formattedAmount = this.formatCurrency(payment.amount, payment.currency);
    const dueDate = payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'Not specified';

    // Get user names for personalization
    const cargoOwnerName = this.getUserDisplayName(cargoOwner);
    const truckOwnerName = this.getUserDisplayName(truckOwner);

    // 1. Notify Cargo Owner (Payer) - Payment Due
    await this.sendCargoOwnerPaymentDueNotification(
      payment,
      trip,
      cargoOwner,
      truckOwner,
      {
        cargoTitle,
        tripNumber,
        formattedAmount,
        dueDate,
        truckOwnerName,
      },
      tenantId,
    );

    // 2. Notify Truck Owner (Payee) - Payment Expected
    await this.sendTruckOwnerPaymentExpectedNotification(
      payment,
      trip,
      cargoOwner,
      truckOwner,
      {
        cargoTitle,
        tripNumber,
        formattedAmount,
        dueDate,
        cargoOwnerName,
      },
      tenantId,
    );

    // 3. Send Email Notifications (Professional Templates)
    await this.sendPaymentEmailNotifications(
      payment,
      trip,
      cargoOwner,
      truckOwner,
      {
        cargoTitle,
        tripNumber,
        formattedAmount,
        dueDate,
        cargoOwnerName,
        truckOwnerName,
      },
    );

    // 4. Emit events for external integrations (ERP, Accounting systems)
    this.emitPaymentEvents(payment, trip, cargoOwner, truckOwner, tenantId);
  }

  /**
   * Send cargo owner payment due notification (International Standard)
   */
  private async sendCargoOwnerPaymentDueNotification(
    payment: Payment,
    trip: Trip,
    cargoOwner: User,
    truckOwner: User,
    context: any,
    tenantId: string,
  ): Promise<void> {
    // High Priority In-App Notification
    await this.notificationService.createNotification({
      userId: cargoOwner.id,
      tenantId,
      subject: `💳 Payment Due - Cargo Delivered Successfully`,
      content: `Your cargo "${context.cargoTitle}" (Trip #${context.tripNumber}) has been delivered and confirmed. Payment of ${context.formattedAmount} is due to ${context.truckOwnerName} by ${context.dueDate}. Please process payment to maintain your logistics credit rating.`,
      type: NotificationType.PAYMENT_DUE,
      category: NotificationCategory.FINANCIAL,
      channel: NotificationChannel.IN_APP,
      priority: 'HIGH' as any,
      actionUrl: `/dashboard/pending-payments`,
      actionText: 'Pay Now',
      metadata: {
        paymentId: payment.id,
        tripId: trip.id,
        truckOwnerId: truckOwner.id,
        amount: payment.amount,
        currency: payment.currency,
        dueDate: payment.dueDate,
        paymentType: 'CARGO_DELIVERY',
        urgencyLevel: 'HIGH',
        complianceRequired: true,
        internationalStandard: 'ISO_20022',
      },
    } as any);

    // Push Notification for Mobile
    await this.notificationService.createNotification({
      userId: cargoOwner.id,
      tenantId,
      subject: `Payment Due: ${context.formattedAmount}`,
      content: `Cargo delivered. Payment due by ${context.dueDate}`,
      type: NotificationType.PAYMENT_DUE,
      category: NotificationCategory.FINANCIAL,
      channel: NotificationChannel.PUSH,
      priority: 'HIGH' as any,
      metadata: {
        paymentId: payment.id,
        shortMessage: true,
      },
    } as any);
  }

  /**
   * Send truck owner payment expected notification (International Standard)
   */
  private async sendTruckOwnerPaymentExpectedNotification(
    payment: Payment,
    trip: Trip,
    cargoOwner: User,
    truckOwner: User,
    context: any,
    tenantId: string,
  ): Promise<void> {
    // Normal Priority In-App Notification
    await this.notificationService.createNotification({
      userId: truckOwner.id,
      tenantId,
      subject: `💰 Payment Expected - Trip Completed Successfully`,
      content: `Excellent work! Trip #${context.tripNumber} for "${context.cargoTitle}" has been completed. You will receive ${context.formattedAmount} from ${context.cargoOwnerName} by ${context.dueDate}. Payment terms: Net 30 days as per international logistics standards.`,
      type: NotificationType.PAYMENT_RECEIVED,
      category: NotificationCategory.FINANCIAL,
      channel: NotificationChannel.IN_APP,
      priority: 'NORMAL' as any,
      actionUrl: `/dashboard/fleet/financial`,
      actionText: 'View Expected Payments',
      metadata: {
        paymentId: payment.id,
        tripId: trip.id,
        cargoOwnerId: cargoOwner.id,
        amount: payment.amount,
        currency: payment.currency,
        dueDate: payment.dueDate,
        paymentType: 'CARGO_DELIVERY_EARNING',
        earningType: 'FREIGHT_REVENUE',
        internationalStandard: 'FIATA_STANDARD',
      },
    } as any);

    // SMS Notification for immediate awareness
    await this.notificationService.createNotification({
      userId: truckOwner.id,
      tenantId,
      subject: `Trip Completed - Payment Expected`,
      content: `Trip #${context.tripNumber} completed. Expected payment: ${context.formattedAmount} by ${context.dueDate}`,
      type: NotificationType.PAYMENT_RECEIVED,
      category: NotificationCategory.FINANCIAL,
      channel: NotificationChannel.SMS,
      priority: 'NORMAL' as any,
      metadata: {
        paymentId: payment.id,
        shortMessage: true,
      },
    } as any);
  }

  /**
   * Send professional email notifications following international standards
   */
  private async sendPaymentEmailNotifications(
    payment: Payment,
    trip: Trip,
    cargoOwner: User,
    truckOwner: User,
    context: any,
  ): Promise<void> {
    const { frontendUrl, smtpFrom: fromAddress } = getEnvConfig();

    // Email to Cargo Owner (Payment Due)
    if (cargoOwner.email) {
      const cargoOwnerEmailHtml = this.generateCargoOwnerPaymentEmail(
        context,
        payment,
        trip,
        frontendUrl,
      );

      await (this.emailService as any).transporter?.sendMail({
        from: `"UrutiX Logistics" <${fromAddress}>`,
        to: cargoOwner.email,
        subject: `Payment Due: ${context.formattedAmount} - Trip #${context.tripNumber} | UrutiX`,
        text: `Payment Due Notice\n\nDear ${context.cargoOwnerName},\n\nYour cargo "${context.cargoTitle}" has been successfully delivered.\n\nPayment Details:\n- Amount: ${context.formattedAmount}\n- Due Date: ${context.dueDate}\n- Trip: #${context.tripNumber}\n- Carrier: ${context.truckOwnerName}\n\nPlease process payment at: ${frontendUrl}/dashboard/pending-payments\n\nThank you for choosing UrutiX Logistics.`,
        html: cargoOwnerEmailHtml,
      });

      this.logger.log(`Payment due email sent to cargo owner: ${cargoOwner.email}`);
    }

    // Email to Truck Owner (Payment Expected)
    if (truckOwner.email) {
      const truckOwnerEmailHtml = this.generateTruckOwnerPaymentEmail(
        context,
        payment,
        trip,
        frontendUrl,
      );

      await (this.emailService as any).transporter?.sendMail({
        from: `"UrutiX Logistics" <${fromAddress}>`,
        to: truckOwner.email,
        subject: `Payment Expected: ${context.formattedAmount} - Trip #${context.tripNumber} | UrutiX`,
        text: `Payment Expected Notice\n\nDear ${context.truckOwnerName},\n\nCongratulations! Trip #${context.tripNumber} has been completed successfully.\n\nPayment Details:\n- Amount: ${context.formattedAmount}\n- Expected by: ${context.dueDate}\n- Cargo: "${context.cargoTitle}"\n- Client: ${context.cargoOwnerName}\n\nPayment will be processed according to standard Net 30 terms.\n\nView details at: ${frontendUrl}/dashboard/fleet/financial\n\nThank you for your excellent service.`,
        html: truckOwnerEmailHtml,
      });

      this.logger.log(`Payment expected email sent to truck owner: ${truckOwner.email}`);
    }
  }

  /**
   * Generate professional cargo owner payment email (International Standard)
   */
  private generateCargoOwnerPaymentEmail(
    context: any,
    payment: Payment,
    trip: Trip,
    frontendUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Due Notice - UrutiX Logistics</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a56db 0%, #1e40af 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Payment Due Notice</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">International Logistics Payment Standard</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px;">
            <div style="background: #f1f5f9; border-left: 4px solid #1a56db; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 18px;">Cargo Delivered Successfully ✅</h2>
              <p style="color: #64748b; margin: 0; font-size: 14px;">Your cargo has been delivered and confirmed by the receiver.</p>
            </div>

            <p style="font-size: 16px; color: #1e293b; margin: 0 0 8px;">Dear <strong>${context.cargoOwnerName}</strong>,</p>
            <p style="color: #64748b; margin: 0 0 30px; font-size: 14px; line-height: 1.6;">
              We are pleased to inform you that your cargo shipment has been successfully delivered and confirmed. 
              Payment is now due according to our standard Net 30 terms.
            </p>

            <!-- Payment Details Card -->
            <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 20px; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 40%;">Amount Due</td>
                  <td style="padding: 8px 0; color: #1a56db; font-size: 18px; font-weight: 700;">${context.formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Due Date</td>
                  <td style="padding: 8px 0; color: #dc2626; font-size: 14px; font-weight: 600;">${context.dueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Trip Number</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">#${context.tripNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Cargo</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${context.cargoTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Carrier</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${context.truckOwnerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment Terms</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Net 30 Days</td>
                </tr>
              </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${frontendUrl}/dashboard/pending-payments" 
                 style="display: inline-block; background: #1a56db; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(26, 86, 219, 0.3);">
                Process Payment Now
              </a>
            </div>

            <!-- Important Notice -->
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400e;">
                <strong>Important:</strong> Timely payment helps maintain your logistics credit rating and ensures continued priority service.
              </p>
            </div>

            <!-- Footer Info -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                This payment notice is generated automatically according to international logistics standards (ISO 20022). 
                For questions, please contact our finance team or visit your dashboard.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} UrutiX Smart Logistics Platform. All rights reserved.
            </p>
            <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0;">
              Professional Logistics Solutions | International Standards Compliant
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate professional truck owner payment email (International Standard)
   */
  private generateTruckOwnerPaymentEmail(
    context: any,
    payment: Payment,
    trip: Trip,
    frontendUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Expected - UrutiX Logistics</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Trip Completed! 🎉</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Payment Expected Notification</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px;">
            <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 18px;">Excellent Service Delivery! 🚛</h2>
              <p style="color: #64748b; margin: 0; font-size: 14px;">Your trip has been completed successfully and payment is being processed.</p>
            </div>

            <p style="font-size: 16px; color: #1e293b; margin: 0 0 8px;">Dear <strong>${context.truckOwnerName}</strong>,</p>
            <p style="color: #64748b; margin: 0 0 30px; font-size: 14px; line-height: 1.6;">
              Congratulations on another successful delivery! Your professional service has been confirmed by the cargo receiver. 
              Payment will be processed according to our standard Net 30 terms.
            </p>

            <!-- Payment Details Card -->
            <div style="background: #ffffff; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 20px; font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">Payment Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 40%;">Expected Amount</td>
                  <td style="padding: 8px 0; color: #059669; font-size: 18px; font-weight: 700;">${context.formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Expected By</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${context.dueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Trip Number</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">#${context.tripNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Cargo Delivered</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${context.cargoTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Client</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${context.cargoOwnerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Payment Terms</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Net 30 Days (Standard)</td>
                </tr>
              </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${frontendUrl}/dashboard/fleet/financial" 
                 style="display: inline-block; background: #059669; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                View Financial Dashboard
              </a>
            </div>

            <!-- Performance Recognition -->
            <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="margin: 0; font-size: 13px; color: #1e40af;">
                <strong>Performance Recognition:</strong> Your timely and professional delivery service contributes to our platform's excellent reputation. Thank you for your commitment to quality logistics.
              </p>
            </div>

            <!-- Footer Info -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                Payment processing follows international logistics standards (FIATA). You will receive confirmation once payment is completed by the cargo owner.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} UrutiX Smart Logistics Platform. All rights reserved.
            </p>
            <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0;">
              Professional Logistics Solutions | Carrier Excellence Program
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Emit payment events for external integrations (ERP, Accounting, etc.)
   */
  private emitPaymentEvents(
    payment: Payment,
    trip: Trip,
    cargoOwner: User,
    truckOwner: User,
    tenantId: string,
  ): void {
    // Event for ERP Integration
    this.eventEmitter.emit('payment.created.erp', {
      paymentId: payment.id,
      tripId: trip.id,
      tenantId,
      payerId: cargoOwner.id,
      payeeId: truckOwner.id,
      amount: payment.amount,
      currency: payment.currency,
      dueDate: payment.dueDate,
      paymentType: 'FREIGHT_PAYMENT',
      standard: 'ISO_20022',
      createdAt: new Date().toISOString(),
    });

    // Event for Accounting System Integration
    this.eventEmitter.emit('accounting.invoice.due', {
      paymentId: payment.id,
      invoiceNumber: payment.referenceNumber,
      customerId: cargoOwner.id,
      vendorId: truckOwner.id,
      amount: payment.amount,
      currency: payment.currency,
      dueDate: payment.dueDate,
      category: 'FREIGHT_SERVICES',
      tenantId,
    });

    // Event for Credit Rating System
    this.eventEmitter.emit('credit.payment.created', {
      payerId: cargoOwner.id,
      paymentId: payment.id,
      amount: payment.amount,
      dueDate: payment.dueDate,
      tenantId,
      riskLevel: 'STANDARD',
    });

    this.logger.log(`Payment events emitted for payment ${payment.id}`);
  }

  /**
   * Utility methods
   */
  private getUserDisplayName(user: User): string {
    if ((user as any).profile?.companyName) {
      return (user as any).profile.companyName;
    }
    
    if ((user as any).profile?.firstName && (user as any).profile?.lastName) {
      return `${(user as any).profile.firstName} ${(user as any).profile.lastName}`.trim();
    }
    
    return user.email || 'User';
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}