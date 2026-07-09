import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getEnvConfig } from '../../config/env.config';

import { Epod, EpodStatus } from '../../entities/epod.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { User } from '../../entities/user.entity';
import { Driver } from '../../entities/driver.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Invoice, InvoiceItem, InvoiceStatus, InvoiceItemType } from '../financial/entities/invoice.entity';
import { Tenant } from '../../entities/tenant.entity';
import { NotificationService } from '../notifications/services/notification.service';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannel,
} from '../../entities/notification.entity';
import { EmailService } from '../auth/services/email.service';
import { SubmitEpodDto } from './dto/submit-epod.dto';
import { TripCompletionService } from './services/trip-completion.service';

@Injectable()
export class EpodService {
  private readonly logger = new Logger(EpodService.name);
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Epod)
    private readonly epodRepository: Repository<Epod>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepository: Repository<InvoiceItem>,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly tripCompletionService: TripCompletionService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
  }

  // ── Submit ePOD ────────────────────────────────────────────────────────────

  async submitEpod(
    tripId: string,
    tenantId: string,
    driverUserId: string,
    dto: SubmitEpodDto,
    signatureFile?: Express.Multer.File,
    photoFiles?: Express.Multer.File[],
  ): Promise<Epod> {
    // 1. Load trip
    const trip = await this.tripRepository.findOne({
      where: { id: tripId, tenantId },
      relations: ['load', 'truck'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status !== TripStatus.IN_PROGRESS) {
      throw new BadRequestException('ePOD can only be submitted for trips that are IN_PROGRESS');
    }

    // 2. Check for duplicate
    const existing = await this.epodRepository.findOne({ where: { tripId } });
    if (existing) throw new ConflictException('ePOD already submitted for this trip');

    // 3. Resolve driver record
    const driver = await this.driverRepository.findOne({
      where: { userId: driverUserId, tenantId },
    });
    if (!driver) throw new NotFoundException('Driver record not found');

    const load = trip.load;
    if (!load) throw new NotFoundException('Load not found for this trip');

    // 4. Save signature file
    let signatureFileUrl: string | undefined;
    if (signatureFile) {
      signatureFileUrl = await this.saveFile(signatureFile, `epod/signatures/${tripId}`);
    }

    // 5. Save photo files
    const photoUrls: string[] = [];
    if (photoFiles?.length) {
      for (const photo of photoFiles) {
        const url = await this.saveFile(photo, `epod/photos/${tripId}`);
        photoUrls.push(url);
      }
    }

    // 6. Create ePOD record — map all fields including new international-standard ones
    const epod = this.epodRepository.create({
      tenantId,
      tripId,
      driverId: driver.id,
      cargoOwnerId: load.cargoOwnerId,

      // ── Recipient identity ──────────────────────────────────────────────
      recipientName:      dto.recipientName,
      recipientPhone:     dto.recipientPhone,
      recipientIdNumber:  dto.recipientIdNumber,
      recipientCompany:   dto.recipientCompany,

      // ── Delivery details ────────────────────────────────────────────────
      deliveredAt:     dto.deliveredAt ? new Date(dto.deliveredAt) : new Date(),
      deliveryAddress: dto.deliveryAddress,
      odometerReading: dto.odometerReading,
      deliveryCoordinates:
        dto.latitude && dto.longitude
          ? { latitude: Number(dto.latitude), longitude: Number(dto.longitude) }
          : undefined,

      // ── Cargo condition (CMR / BoL) ─────────────────────────────────────
      cargoCondition: dto.cargoCondition ?? CargoConditionOnDelivery.INTACT,
      unitsDelivered: dto.unitsDelivered,
      deliveryNotes:  dto.deliveryNotes,
      exceptionNotes: dto.exceptionNotes,

      // ── Files ───────────────────────────────────────────────────────────
      signatureFileUrl,
      photoUrls,

      status:      EpodStatus.PENDING,
      submittedAt: new Date(),
    });

    const savedEpod = await this.epodRepository.save(epod);
    this.logger.log(`ePOD ${savedEpod.id} submitted for trip ${tripId}`);

    // 7. Mark trip as COMPLETED
    trip.status = TripStatus.COMPLETED;
    trip.actualEndTime = new Date();
    trip.completedAt = new Date();
    await this.tripRepository.save(trip);
    this.logger.log(`Trip ${tripId} marked COMPLETED via ePOD`);

    // 8. Generate invoice (async, non-blocking)
    this.generateInvoiceForTrip(savedEpod, trip, load, tenantId)
      .then(invoice => {
        if (invoice) {
          this.epodRepository.update(savedEpod.id, { invoiceId: invoice.id });
        }
      })
      .catch(err => this.logger.error(`Invoice generation failed for trip ${tripId}: ${err.message}`, err.stack));

    // 8.1. Create pending payment for cargo owner (NEW)
    this.tripCompletionService.handleTripCompletion(tripId, tenantId, 'EPOD_SUBMISSION')
      .then(result => {
        this.logger.log(`Created pending payment ${result.payment.id} for trip ${tripId}`);
      })
      .catch(err => this.logger.error(`Pending payment creation failed for trip ${tripId}: ${err.message}`, err.stack));

    // 9. Emit trip.completed event — triggers TripNotificationListener and CargoNotificationListener
    //    which send in-app + push notifications to cargo owner, truck owner, and driver.
    //    sendEpodNotifications() adds the ePOD-specific "View ePOD & Invoice" action link.
    try {
      const pickupLoc = load.locations?.find(l => l.type === 'PICKUP');
      const deliveryLoc = load.locations?.find(l => l.type === 'DELIVERY');
      const driverUser = trip.driverId
        ? await this.userRepository.findOne({ where: { id: trip.driverId }, relations: ['profile'] })
        : null;
      const driverName = driverUser?.profile
        ? `${(driverUser.profile as any).firstName || ''} ${(driverUser.profile as any).lastName || ''}`.trim() || driverUser.email
        : 'Driver';

      this.eventEmitter.emit('trip.completed', {
        tripId: trip.id,
        driverId: trip.driverId,
        driverName,
        cargoOwnerId: load.cargoOwnerId,
        truckOwnerId: trip.truck?.ownerId,
        tenantId,
        cargoTitle: load.title || load.cargoType,
        deliveryLocation: deliveryLoc?.locationData?.city || deliveryLoc?.locationData?.address,
        completedAt: trip.actualEndTime || new Date(),
        tripDetails: {
          cargoTitle: load.title || load.cargoType || 'Cargo',
          origin: pickupLoc?.locationData?.city || pickupLoc?.locationData?.address || 'Origin',
          destination: deliveryLoc?.locationData?.city || deliveryLoc?.locationData?.address || 'Destination',
          completedAt: trip.actualEndTime || new Date(),
          distance: trip.totalDistance || null,
          duration: trip.actualStartTime && trip.actualEndTime
            ? (new Date(trip.actualEndTime).getTime() - new Date(trip.actualStartTime).getTime()) / 1000
            : null,
        },
      });
      this.logger.log(`Emitted trip.completed event for trip ${tripId} (via ePOD)`);
    } catch (eventErr) {
      this.logger.error(`Failed to emit trip.completed event: ${eventErr.message}`);
    }

    // 10. Send ePOD-specific notification with "View ePOD & Invoice" action link (async)
    this.sendEpodNotifications(savedEpod, trip, load, tenantId).catch(err =>
      this.logger.error(`ePOD notifications failed: ${err.message}`, err.stack),
    );

    return savedEpod;
  }

  // ── Get ePOD ───────────────────────────────────────────────────────────────

  async getEpodByTrip(tripId: string, tenantId: string): Promise<Epod> {
    const epod = await this.epodRepository.findOne({ where: { tripId, tenantId } });
    if (!epod) throw new NotFoundException('ePOD not found for this trip');
    return epod;
  }

  async getEpodById(id: string, tenantId: string): Promise<Epod> {
    const epod = await this.epodRepository.findOne({ where: { id, tenantId } });
    if (!epod) throw new NotFoundException('ePOD not found');
    return epod;
  }

  // ── Confirm ePOD (cargo owner) ─────────────────────────────────────────────

  async confirmEpod(epodId: string, tenantId: string): Promise<Epod> {
    const epod = await this.getEpodById(epodId, tenantId);
    if (epod.status !== EpodStatus.PENDING) {
      throw new BadRequestException(`ePOD is already ${epod.status}`);
    }
    epod.status = EpodStatus.CONFIRMED;
    epod.confirmedAt = new Date();
    
    const confirmedEpod = await this.epodRepository.save(epod);
    
    // Handle cargo receiver confirmation - create/update pending payment
    if (epod.tripId) {
      this.tripCompletionService.handleCargoReceiverConfirmation(epod.tripId, tenantId, epod.cargoOwnerId)
        .then(payment => {
          this.logger.log(`Updated payment ${payment.id} with cargo receiver confirmation`);
        })
        .catch(err => this.logger.error(`Failed to handle cargo receiver confirmation: ${err.message}`, err.stack));
    }
    
    return confirmedEpod;
  }

  // ── Invoice generation ─────────────────────────────────────────────────────

  async generateInvoiceForTrip(
    epod: Epod,
    trip: Trip,
    load: Load,
    tenantId: string,
  ): Promise<Invoice | null> {
    try {
      // Idempotency: skip if invoice already exists for this trip
      const existing = await this.invoiceRepository.findOne({ where: { tripId: trip.id } });
      if (existing) {
        this.logger.log(`Invoice already exists for trip ${trip.id}`);
        return existing;
      }

      // Resolve cargo owner
      const cargoOwner = await this.userRepository.findOne({
        where: { id: load.cargoOwnerId },
        relations: ['profile'],
      });
      if (!cargoOwner) throw new NotFoundException('Cargo owner not found');

      // Resolve truck owner
      const truckOwner = trip.truck?.ownerId
        ? await this.userRepository.findOne({
            where: { id: trip.truck.ownerId },
            relations: ['profile'],
          })
        : null;

      // Build cargo owner name with proper fallbacks
      const profile = (cargoOwner as any).profile;
      const cargoOwnerName =
        profile?.companyName ||
        (profile?.firstName || profile?.lastName
          ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
          : null) ||
        cargoOwner.email ||
        'Cargo Owner';

      const truckOwnerName =
        (truckOwner as any)?.profile?.companyName ||
        `${(truckOwner as any)?.profile?.firstName || ''} ${(truckOwner as any)?.profile?.lastName || ''}`.trim() ||
        truckOwner?.email ||
        'Carrier';

      const invoiceNumber = this.generateInvoiceNumber();
      const agreedPrice = Number(trip.agreedPrice) || 0;
      const fuelCost = Number(trip.fuelCost) || 0;
      const tollsCost = Number(trip.tollsCost) || 0;
      const otherExpenses = Number(trip.otherExpenses) || 0;
      const subtotal = agreedPrice + fuelCost + tollsCost + otherExpenses;
      const taxRate = 0; // extend later
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      const pickupLoc = load.locations?.find(l => l.type === 'PICKUP');
      const deliveryLoc = load.locations?.find(l => l.type === 'DELIVERY');
      const origin = pickupLoc?.locationData?.city || pickupLoc?.locationData?.address || 'Origin';
      const destination = deliveryLoc?.locationData?.city || deliveryLoc?.locationData?.address || 'Destination';

      // Create invoice
      const invoice = this.invoiceRepository.create({
        invoiceNumber,
        customerId: cargoOwner.id,
        customerName: cargoOwnerName,
        senderId: truckOwner?.id,
        senderName: truckOwnerName,
        tripId: trip.id,
        truckId: trip.truckId,
        driverId: trip.driverId,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30
        status: InvoiceStatus.SENT,
        subtotal,
        taxAmount,
        totalAmount,
        currency: trip.currencyCode || 'RWF',
        paymentTerms: 'Net 30',
        notes: `ePOD submitted by driver. Recipient: ${epod.recipientName}. Route: ${origin} → ${destination}. Trip: ${trip.tripNumber}.`,
        createdBy: cargoOwner,
        tenant: { id: tenantId } as any,
      });

      const savedInvoice = await this.invoiceRepository.save(invoice);

      // Create line items
      const items: Partial<InvoiceItem>[] = [];

      items.push({
        description: `Freight service — ${load.title || load.cargoType || 'Cargo'} (${origin} → ${destination})`,
        quantity: 1,
        unitPrice: agreedPrice,
        totalPrice: agreedPrice,
        type: InvoiceItemType.FREIGHT,
        tripId: trip.id,
        notes: `Carrier: ${truckOwnerName} | Trip: ${trip.tripNumber}`,
      } as InvoiceItem);

      if (fuelCost > 0) {
        items.push({
          description: 'Fuel surcharge',
          quantity: 1,
          unitPrice: fuelCost,
          totalPrice: fuelCost,
          type: InvoiceItemType.FUEL_SURCHARGE,
          tripId: trip.id,
        } as InvoiceItem);
      }

      if (tollsCost > 0) {
        items.push({
          description: 'Toll charges',
          quantity: 1,
          unitPrice: tollsCost,
          totalPrice: tollsCost,
          type: InvoiceItemType.TOLL,
          tripId: trip.id,
        } as InvoiceItem);
      }

      if (otherExpenses > 0) {
        items.push({
          description: 'Other expenses',
          quantity: 1,
          unitPrice: otherExpenses,
          totalPrice: otherExpenses,
          type: InvoiceItemType.ACCESSORIAL,
          tripId: trip.id,
        } as InvoiceItem);
      }

      const savedItems = items.map(item =>
        this.invoiceItemRepository.create({ ...item, invoice: savedInvoice }),
      );
      await this.invoiceItemRepository.save(savedItems);

      this.logger.log(`Invoice ${invoiceNumber} generated for trip ${trip.id}`);

      // Send invoice email to cargo owner
      this.sendInvoiceEmail(cargoOwner, savedInvoice, trip, load, origin, destination, truckOwnerName).catch(
        err => this.logger.error(`Invoice email failed: ${err.message}`),
      );

      return savedInvoice;
    } catch (err) {
      this.logger.error(`generateInvoiceForTrip failed: ${err.message}`, err.stack);
      return null;
    }
  }

  // ── Get invoice by trip ────────────────────────────────────────────────────

  async getInvoiceByTrip(tripId: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { tripId },
      relations: ['items'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found for this trip');
    return invoice;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async saveFile(file: Express.Multer.File, subdir: string): Promise<string> {
    const dir = path.join(this.uploadDir, subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const ext = path.extname(file.originalname) || '.bin';
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Return a URL path relative to the uploads root
    return `/uploads/${subdir}/${fileName}`;
  }

  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(Math.random() * 90000) + 10000;
    return `INV-${year}${month}-${rand}`;
  }

  private async sendEpodNotifications(
    epod: Epod,
    trip: Trip,
    load: Load,
    tenantId: string,
  ): Promise<void> {
    const cargoTitle   = load.title || load.cargoType || 'Cargo';
    const conditionMap: Record<string, string> = {
      INTACT:          '✅ Intact',
      PARTIAL_DAMAGE:  '⚠️ Partial damage reported',
      SHORT_DELIVERY:  '⚠️ Short delivery reported',
      FULL_DAMAGE:     '🔴 Full damage reported',
    };
    const conditionLabel = conditionMap[epod.cargoCondition] ?? '✅ Intact';

    // ── Cargo owner ────────────────────────────────────────────────────────
    await this.notificationService.createNotification({
      userId:   load.cargoOwnerId,
      tenantId,
      subject:  '📦 Delivery Confirmed — ePOD Submitted',
      content:  `Your cargo "${cargoTitle}" (Trip ${trip.tripNumber}) has been delivered. `
              + `Recipient: ${epod.recipientName}${epod.recipientCompany ? ` (${epod.recipientCompany})` : ''}. `
              + `Condition: ${conditionLabel}. `
              + `An invoice has been generated and a payment obligation has been created.`,
      type:      NotificationType.TRIP_COMPLETED,
      category:  NotificationCategory.TRIP,
      channel:   NotificationChannel.IN_APP,
      priority:  epod.cargoCondition === 'INTACT' ? 'HIGH' : 'CRITICAL',
      actionUrl: `/dashboard/trips`,
      actionText:'View ePOD & Invoice',
      metadata:  { tripId: trip.id, epodId: epod.id, cargoCondition: epod.cargoCondition },
    } as any);

    // ── Truck owner ────────────────────────────────────────────────────────
    if (trip.truck?.ownerId) {
      await this.notificationService.createNotification({
        userId:   trip.truck.ownerId,
        tenantId,
        subject:  '✅ Trip Completed — ePOD Submitted',
        content:  `Trip ${trip.tripNumber} has been completed. `
                + `ePOD submitted. Recipient: ${epod.recipientName}. `
                + `Cargo condition: ${conditionLabel}. `
                + `A payment obligation has been created — you will be paid once the cargo owner settles.`,
        type:      NotificationType.TRIP_COMPLETED,
        category:  NotificationCategory.TRIP,
        channel:   NotificationChannel.IN_APP,
        priority:  'NORMAL',
        actionUrl: `/dashboard/fleet/trips`,
        actionText:'View Trip & Payment',
        metadata:  { tripId: trip.id, epodId: epod.id },
      } as any);
    }

    // ── Driver ─────────────────────────────────────────────────────────────
    if (trip.driverId) {
      await this.notificationService.createNotification({
        userId:   trip.driverId,
        tenantId,
        subject:  '🏁 Mission Complete',
        content:  `Trip ${trip.tripNumber} has been finalized. ePOD recorded. `
                + `Cargo condition: ${conditionLabel}.`,
        type:      NotificationType.TRIP_COMPLETED,
        category:  NotificationCategory.TRIP,
        channel:   NotificationChannel.IN_APP,
        priority:  'NORMAL',
        actionUrl: `/dashboard/missions`,
        actionText:'View Completed Trip',
        metadata:  { tripId: trip.id, epodId: epod.id },
      } as any);
    }
  }

  private async sendInvoiceEmail(
    cargoOwner: User,
    invoice: Invoice,
    trip: Trip,
    load: Load,
    origin: string,
    destination: string,
    carrierName: string,
  ): Promise<void> {
    if (!cargoOwner.email) return;

    const { frontendUrl } = getEnvConfig();
    const invoiceUrl = `${frontendUrl}/dashboard/trips`;

    const cargoOwnerName =
      (cargoOwner as any).profile?.companyName ||
      `${(cargoOwner as any).profile?.firstName || ''} ${(cargoOwner as any).profile?.lastName || ''}`.trim() ||
      cargoOwner.email;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; margin: 0;">
        <div style="max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background: #1a56db; padding: 32px 40px;">
            <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 800;">Invoice Generated</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${invoice.invoiceNumber}</p>
          </div>

          <!-- Body -->
          <div style="padding: 36px 40px;">
            <p style="font-size: 16px; color: #1e293b; margin: 0 0 8px;">Hi <strong>${cargoOwnerName}</strong>,</p>
            <p style="color: #64748b; margin: 0 0 28px; font-size: 14px; line-height: 1.6;">
              Your cargo has been successfully delivered and an invoice has been generated for trip <strong>${trip.tripNumber}</strong>.
            </p>

            <!-- Invoice Summary -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 28px;">
              <h3 style="margin: 0 0 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;">Invoice Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Invoice Number</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Route</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${origin} → ${destination}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Carrier</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${carrierName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Cargo</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${load.title || load.cargoType || 'Cargo'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Issue Date</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${new Date(invoice.issueDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Due Date</td>
                  <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${new Date(invoice.dueDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
                </tr>
                <tr style="border-top: 2px solid #e2e8f0;">
                  <td style="padding: 12px 0 0; color: #1e293b; font-size: 16px; font-weight: 800;">Total Amount</td>
                  <td style="padding: 12px 0 0; color: #1a56db; font-size: 18px; font-weight: 800; text-align: right;">${invoice.currency} ${Number(invoice.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${invoiceUrl}" style="display: inline-block; background: #1a56db; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 700;">View Invoice & ePOD</a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
              Payment terms: ${invoice.paymentTerms}. If you have any questions about this invoice, please contact your platform administrator.
            </p>
          </div>

          <div style="background: #f8fafc; padding: 20px 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
            © ${new Date().getFullYear()} UrutiX Smart Logistics. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    await this.emailService.sendGenericEmail({
      to:       cargoOwner.email,
      subject:  `Invoice ${invoice.invoiceNumber} — Trip ${trip.tripNumber} Completed | UrutiX`,
      textBody: `Hi ${cargoOwnerName},\n\nYour cargo has been delivered. Invoice: ${invoice.invoiceNumber}\nTotal: ${invoice.currency} ${invoice.totalAmount}\nDue: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nView: ${invoiceUrl}\n\nUrutiX Smart Logistics`,
      htmlBody: html,
    });

    this.logger.log(`Invoice email sent to ${cargoOwner.email}`);
  }
}
