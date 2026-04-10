import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../../../entities/payment.entity';
import { Invoice, InvoiceStatus, InvoiceItem, InvoiceItemType } from '../../financial/entities/invoice.entity';
import { Receipt, ReceiptStatus } from '../../../entities/receipt.entity';
import { Trip } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';
import { User } from '../../../entities/user.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationCategory } from '../../../entities/notification.entity';

@Injectable()
export class InvoiceReceiptService {
  private readonly logger = new Logger(InvoiceReceiptService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Generate invoice for cargo owner when lender pays
   */
  async generateInvoiceForCargoOwner(
    payment: Payment,
  ): Promise<Invoice> {
    try {
      // Check if invoice already exists for this payment
      const existingInvoice = await this.invoiceRepository.findOne({
        where: { tripId: payment.tripId },
        order: { createdAt: 'DESC' },
      });

      if (existingInvoice && existingInvoice.status === InvoiceStatus.PAID) {
        this.logger.log(`Invoice already exists and is paid for payment ${payment.id}`);
        return existingInvoice;
      }

      // Get trip and load details
      const trip = await this.tripRepository.findOne({
        where: { id: payment.tripId },
        relations: ['load'],
      });

      if (!trip || !trip.load) {
        throw new NotFoundException('Trip or load not found');
      }

      const load = trip.load;
      const cargoOwner = await this.userRepository.findOne({
        where: { id: load.cargoOwnerId },
        relations: ['profile'],
      });

      if (!cargoOwner) {
        throw new NotFoundException('Cargo owner not found');
      }

      // Get lender info from payment metadata
      const lenderId = payment.metadata?.lenderId;
      const lender = lenderId
        ? await this.userRepository.findOne({
            where: { id: lenderId },
            relations: ['profile'],
          })
        : null;

      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber();

      // Create invoice
      const invoice = this.invoiceRepository.create({
        invoiceNumber,
        customerId: cargoOwner.id,
        customerName:
          cargoOwner.profile?.companyName ||
          `${cargoOwner.profile?.firstName || ''} ${cargoOwner.profile?.lastName || ''}`.trim() ||
          cargoOwner.email ||
          'Cargo Owner',
        tripId: trip.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: InvoiceStatus.SENT,
        subtotal: parseFloat(payment.amount.toString()),
        taxAmount: 0,
        totalAmount: parseFloat(payment.amount.toString()),
        currency: payment.currency,
        paymentTerms: 'Net 30',
        paymentMethod: payment.paymentMethod,
        paidDate: payment.processedAt || new Date(),
        notes: `Payment received from ${lender?.profile?.companyName || lender?.email || 'Lender'} for cargo transportation.`,
        createdBy: cargoOwner,
        tenant: { id: payment.tenantId } as any,
      });

      // Create invoice items
      const invoiceItems: Partial<InvoiceItem>[] = [
        {
          description: `Transportation services for ${load.title || load.description || 'Cargo'}`,
          quantity: 1,
          unitPrice: parseFloat(payment.amount.toString()),
          totalPrice: parseFloat(payment.amount.toString()),
          type: InvoiceItemType.FREIGHT,
          tripId: trip.id,
          notes: `Trip: ${trip.tripNumber || trip.id}`,
        } as InvoiceItem,
      ];

      const savedInvoice = await this.invoiceRepository.save(invoice);
      
      // Save invoice items
      const items = invoiceItems.map((item) =>
        this.invoiceItemRepository.create({
          ...item,
          invoice: savedInvoice,
        }),
      );
      await this.invoiceItemRepository.save(items);

      // Send notification to cargo owner
      await this.notifyCargoOwnerInvoice(savedInvoice, cargoOwner, load);

      this.logger.log(
        `Invoice ${invoiceNumber} generated for cargo owner ${cargoOwner.id}`,
      );

      return savedInvoice;
    } catch (error) {
      this.logger.error(
        `Failed to generate invoice for payment ${payment.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generate receipt for lender when they pay
   */
  async generateReceiptForLender(
    payment: Payment,
  ): Promise<Receipt> {
    try {
      // Check if receipt already exists for this payment
      const existingReceipt = await this.receiptRepository.findOne({
        where: { paymentId: payment.id },
      });

      if (existingReceipt) {
        this.logger.log(`Receipt already exists for payment ${payment.id}`);
        return existingReceipt;
      }

      // Get trip and load details
      const trip = await this.tripRepository.findOne({
        where: { id: payment.tripId },
        relations: ['load'],
      });

      if (!trip || !trip.load) {
        throw new NotFoundException('Trip or load not found');
      }

      const load = trip.load;

      // Get lender info from payment metadata
      const lenderId = payment.metadata?.lenderId || payment.payerId;
      const lender = await this.userRepository.findOne({
        where: { id: lenderId },
        relations: ['profile'],
      });

      if (!lender) {
        throw new NotFoundException('Lender not found');
      }

      // Get cargo owner info
      const cargoOwner = await this.userRepository.findOne({
        where: { id: load.cargoOwnerId },
        relations: ['profile'],
      });

      if (!cargoOwner) {
        throw new NotFoundException('Cargo owner not found');
      }

      // Generate receipt number
      const receiptNumber = this.generateReceiptNumber();

      // Create receipt
      const receipt = this.receiptRepository.create({
        receiptNumber,
        tenantId: payment.tenantId,
        lenderId: lender.id,
        paymentId: payment.id,
        tripId: trip.id,
        cargoOwnerId: cargoOwner.id,
        cargoOwnerName:
          cargoOwner.profile?.companyName ||
          `${cargoOwner.profile?.firstName || ''} ${cargoOwner.profile?.lastName || ''}`.trim() ||
          cargoOwner.email ||
          'Cargo Owner',
        cargoOwnerEmail: cargoOwner.email,
        cargoOwnerPhone: cargoOwner.phone,
        cargoName: load.title || load.description || 'Cargo',
        amount: parseFloat(payment.amount.toString()),
        currency: payment.currency,
        status: ReceiptStatus.ISSUED,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        referenceNumber: payment.referenceNumber,
        paymentDate: payment.processedAt || payment.createdAt,
        notes: `Payment receipt for transportation of ${load.title || load.description || 'cargo'}`,
        metadata: {
          tripNumber: trip.tripNumber,
          cargoId: load.id,
          paymentType: payment.paymentType,
        },
        lender: lender,
        payment: payment,
        trip: trip,
        tenant: { id: payment.tenantId } as any,
      });

      const savedReceipt = await this.receiptRepository.save(receipt);

      // Send notification to lender
      await this.notifyLenderReceipt(savedReceipt, lender, load);

      this.logger.log(
        `Receipt ${receiptNumber} generated for lender ${lender.id}`,
      );

      return savedReceipt;
    } catch (error) {
      this.logger.error(
        `Failed to generate receipt for payment ${payment.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if payment is from lender and generate invoice/receipt
   */
  async handlePaymentCompletion(payment: Payment): Promise<void> {
    try {
      // Check if payment is completed
      if (payment.status !== PaymentStatus.COMPLETED) {
        return;
      }

      // Check if payment is from lender (check metadata)
      const isLenderPayment =
        payment.metadata?.lenderId ||
        payment.metadata?.financedAmount ||
        payment.metadata?.isLenderPayment;

      if (isLenderPayment) {
        // Generate invoice for cargo owner
        await this.generateInvoiceForCargoOwner(payment);

        // Generate receipt for lender
        await this.generateReceiptForLender(payment);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle payment completion for ${payment.id}:`,
        error,
      );
      // Don't throw - we don't want to break payment processing
    }
  }

  /**
   * Generate unique invoice number
   */
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `INV-${year}-${random}`;
  }

  /**
   * Generate unique receipt number
   */
  private generateReceiptNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `RCP-${year}-${random}`;
  }

  /**
   * Notify cargo owner about new invoice
   */
  private async notifyCargoOwnerInvoice(
    invoice: Invoice,
    cargoOwner: User,
    load: Load,
  ): Promise<void> {
    try {
      await this.notificationsService.createNotification(
        {
          type: 'INVOICE_GENERATED' as any,
          tenantId: invoice.tenant.id,
          userId: cargoOwner.id,
          subject: `Invoice Generated: ${invoice.invoiceNumber}`,
          content: `A new invoice has been generated for the payment received for cargo "${load.title || load.description || 'Cargo'}". Invoice Number: ${invoice.invoiceNumber}, Amount: ${invoice.currency} ${invoice.totalAmount}`,
          channel: 'IN_APP' as any,
          priority: 'NORMAL' as any,
          category: NotificationCategory.FINANCIAL,
          entityType: 'PAYMENT' as any,
          entityId: invoice.id,
          templateId: 'invoice-generated',
          relatedEntityId: invoice.id,
          relatedEntityType: 'Invoice',
          actionUrl: `/cargo-owner/invoices/${invoice.id}`,
          actionText: 'View Invoice',
          recipientEmail: cargoOwner.email,
          recipientName: invoice.customerName,
        },
        invoice.tenant.id,
      );
    } catch (error) {
      this.logger.error('Failed to notify cargo owner about invoice:', error);
    }
  }

  /**
   * Notify lender about new receipt
   */
  private async notifyLenderReceipt(
    receipt: Receipt,
    lender: User,
    load: Load,
  ): Promise<void> {
    try {
      await this.notificationsService.createNotification(
        {
          type: 'PAYMENT_RECEIVED' as any,
          tenantId: receipt.tenantId,
          userId: lender.id,
          subject: `Payment Receipt: ${receipt.receiptNumber}`,
          content: `Your payment receipt has been generated. Receipt Number: ${receipt.receiptNumber}, Amount: ${receipt.currency} ${receipt.amount}, Cargo: ${load.title || load.description || 'Cargo'}`,
          channel: 'IN_APP' as any,
          priority: 'NORMAL' as any,
          category: NotificationCategory.FINANCIAL,
          entityType: 'PAYMENT' as any,
          entityId: receipt.id,
          templateId: 'payment-receipt-generated',
          relatedEntityId: receipt.id,
          relatedEntityType: 'Receipt',
          actionUrl: `/lender/receipts/${receipt.id}`,
          actionText: 'View Receipt',
          recipientEmail: lender.email,
          recipientName: lender.profile?.companyName || lender.email,
        },
        receipt.tenantId,
      );
    } catch (error) {
      this.logger.error('Failed to notify lender about receipt:', error);
    }
  }
}

