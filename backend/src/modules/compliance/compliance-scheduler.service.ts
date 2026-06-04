import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Driver } from '../../entities/driver.entity';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';

const EXPIRY_THRESHOLDS = [30, 15, 7, 1]; // days before expiry

@Injectable()
export class ComplianceSchedulerService {
  private readonly logger = new Logger(ComplianceSchedulerService.name);

  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async checkDriverCompliance(): Promise<void> {
    this.logger.log('Running driver compliance check...');
    const today = new Date();

    const drivers = await this.driverRepository.find({
      where: { status: 'ACTIVE' as any },
    });

    for (const driver of drivers) {
      await this.checkAndNotify(
        driver.userId,
        driver.tenantId,
        'Driver Licence',
        driver.licenseExpiry,
        today,
        `driver:${driver.id}`,
      );

      if (driver.medicalCertExpiry) {
        await this.checkAndNotify(
          driver.userId,
          driver.tenantId,
          'Medical Certificate',
          driver.medicalCertExpiry,
          today,
          `driver:${driver.id}`,
        );
      }
    }

    this.logger.log(`Driver compliance check complete. Checked ${drivers.length} drivers.`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async checkTruckCompliance(): Promise<void> {
    this.logger.log('Running truck compliance check...');
    const today = new Date();

    const trucks = await this.truckRepository.find();

    for (const truck of trucks) {
      const compliance = (truck as any).compliance || {};
      const ownerId = (truck as any).ownerId || (truck as any).truckOwnerId;

      if (compliance.insuranceExpiry) {
        const expired = await this.checkAndNotify(
          ownerId,
          truck.tenantId,
          'Truck Insurance',
          new Date(compliance.insuranceExpiry),
          today,
          `truck:${truck.id}`,
        );
        if (expired) {
          await this.truckRepository.update(truck.id, {
            status: VehicleStatus.OUT_OF_SERVICE,
          });
          this.logger.warn(`Truck ${truck.id} set OUT_OF_SERVICE — insurance expired`);
        }
      }

      if (compliance.registrationExpiry) {
        const expired = await this.checkAndNotify(
          ownerId,
          truck.tenantId,
          'Vehicle Registration',
          new Date(compliance.registrationExpiry),
          today,
          `truck:${truck.id}`,
        );
        if (expired) {
          await this.truckRepository.update(truck.id, {
            status: VehicleStatus.OUT_OF_SERVICE,
          });
        }
      }

      if (compliance.roadworthyExpiry) {
        await this.checkAndNotify(
          ownerId,
          truck.tenantId,
          'Roadworthy Certificate',
          new Date(compliance.roadworthyExpiry),
          today,
          `truck:${truck.id}`,
        );
      }
    }

    this.logger.log(`Truck compliance check complete. Checked ${trucks.length} trucks.`);
  }

  /**
   * Returns true if the document is already expired
   */
  private async checkAndNotify(
    userId: string,
    tenantId: string,
    documentName: string,
    expiryDate: Date,
    today: Date,
    entityRef: string,
  ): Promise<boolean> {
    if (!expiryDate || !userId) return false;

    const daysLeft = Math.floor(
      (new Date(expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysLeft < 0) {
      // Already expired
      await this.sendNotification(
        userId,
        tenantId,
        `⚠️ ${documentName} EXPIRED`,
        `Your ${documentName} expired ${Math.abs(daysLeft)} day(s) ago. Immediate action required.`,
        'CRITICAL',
        entityRef,
      );
      return true;
    }

    if (EXPIRY_THRESHOLDS.includes(daysLeft)) {
      await this.sendNotification(
        userId,
        tenantId,
        `📋 ${documentName} expiring in ${daysLeft} day(s)`,
        `Your ${documentName} will expire on ${new Date(expiryDate).toLocaleDateString()}. Please renew it to avoid service interruption.`,
        daysLeft <= 7 ? 'HIGH' : 'MEDIUM',
        entityRef,
      );
    }

    return false;
  }

  private async sendNotification(
    userId: string,
    tenantId: string,
    title: string,
    message: string,
    priority: string,
    entityRef: string,
  ): Promise<void> {
    try {
      const notification = this.notificationRepository.create({
        userId,
        tenantId,
        title,
        message,
        type: 'COMPLIANCE_ALERT' as any,
        isRead: false,
        metadata: { priority, entityRef },
      } as any);
      await this.notificationRepository.save(notification);
    } catch (err) {
      this.logger.error(`Failed to send compliance notification: ${err.message}`);
    }
  }
}
