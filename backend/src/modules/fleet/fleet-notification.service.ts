import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Truck } from '../../entities/truck.entity';
import { NotificationService } from '../notifications/notification.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationChannel,
  EntityType,
} from '../../entities/notification.entity';

@Injectable()
export class FleetNotificationService {
  private readonly logger = new Logger(FleetNotificationService.name);

  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Run daily at 9 AM to check for upcoming maintenance, inspection, and insurance dates
   */
  @Cron('0 9 * * *') // Every day at 9:00 AM
  async checkFleetReminders() {
    this.logger.log('Starting daily fleet reminder check...');
    
    try {
      await Promise.all([
        this.checkMaintenanceReminders(),
        this.checkInspectionReminders(),
        this.checkInsuranceReminders(),
      ]);
      
      this.logger.log('Fleet reminder check completed successfully');
    } catch (error) {
      this.logger.error(`Error during fleet reminder check: ${error.message}`, error.stack);
    }
  }

  /**
   * Check for maintenance records with nextDueDate approaching (1 day before)
   */
  async checkMaintenanceReminders() {
    this.logger.log('Checking maintenance reminders...');
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      // Get all trucks
      const trucks = await this.truckRepository.find({
        where: { isActive: true },
      });
      
      let notificationCount = 0;
      
      for (const truck of trucks) {
        if (!truck.maintenanceAlerts || truck.maintenanceAlerts.length === 0) {
          continue;
        }
        
        for (const maintenance of truck.maintenanceAlerts) {
          if (!maintenance.nextDueDate) {
            continue;
          }
          
          const nextDueDate = new Date(maintenance.nextDueDate);
          nextDueDate.setHours(0, 0, 0, 0);
          
          // Check if nextDueDate is tomorrow (1 day before)
          if (nextDueDate.getTime() === tomorrow.getTime()) {
            // Skip if already notified today (simple check)
            // The cron job runs once per day, so we don't need complex duplicate checking
            
            await this.createMaintenanceNotification(truck, maintenance);
            notificationCount++;
          }
        }
      }
      
      this.logger.log(`Maintenance reminders: ${notificationCount} notifications created`);
    } catch (error) {
      this.logger.error(`Error checking maintenance reminders: ${error.message}`, error.stack);
    }
  }

  /**
   * Check for inspection records with nextInspectionDate approaching (1 day before)
   */
  async checkInspectionReminders() {
    this.logger.log('Checking inspection reminders...');
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Get all trucks
      const trucks = await this.truckRepository.find({
        where: { isActive: true },
      });
      
      let notificationCount = 0;
      
      for (const truck of trucks) {
        if (!truck.inspectionAlerts || truck.inspectionAlerts.length === 0) {
          continue;
        }
        
        for (const inspection of truck.inspectionAlerts) {
          if (!inspection.nextInspectionDate) {
            continue;
          }
          
          const nextInspectionDate = new Date(inspection.nextInspectionDate);
          nextInspectionDate.setHours(0, 0, 0, 0);
          
          // Check if nextInspectionDate is tomorrow (1 day before)
          if (nextInspectionDate.getTime() === tomorrow.getTime()) {
            // Skip if already notified today (simple check)
            // The cron job runs once per day, so we don't need complex duplicate checking
            
            await this.createInspectionNotification(truck, inspection);
            notificationCount++;
          }
        }
      }
      
      this.logger.log(`Inspection reminders: ${notificationCount} notifications created`);
    } catch (error) {
      this.logger.error(`Error checking inspection reminders: ${error.message}`, error.stack);
    }
  }

  /**
   * Check for insurance records with endDate approaching (1 day before)
   */
  async checkInsuranceReminders() {
    this.logger.log('Checking insurance reminders...');
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Get all trucks
      const trucks = await this.truckRepository.find({
        where: { isActive: true },
      });
      
      let notificationCount = 0;
      
      for (const truck of trucks) {
        if (!truck.insuranceAlerts || truck.insuranceAlerts.length === 0) {
          continue;
        }
        
        for (const insurance of truck.insuranceAlerts) {
          if (!insurance.endDate) {
            continue;
          }
          
          const endDate = new Date(insurance.endDate);
          endDate.setHours(0, 0, 0, 0);
          
          // Check if endDate is tomorrow (1 day before)
          if (endDate.getTime() === tomorrow.getTime()) {
            // Skip if already notified today (simple check)
            // The cron job runs once per day, so we don't need complex duplicate checking
            
            await this.createInsuranceNotification(truck, insurance);
            notificationCount++;
          }
        }
      }
      
      this.logger.log(`Insurance reminders: ${notificationCount} notifications created`);
    } catch (error) {
      this.logger.error(`Error checking insurance reminders: ${error.message}`, error.stack);
    }
  }

  /**
   * Create maintenance notification
   */
  private async createMaintenanceNotification(truck: Truck, maintenance: any) {
    try {
      const nextDueDate = new Date(maintenance.nextDueDate);
      const formattedDate = nextDueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const notificationData: any = {
        recipientId: truck.ownerId,
        notificationType: NotificationType.VEHICLE_MAINTENANCE_DUE,
        category: NotificationCategory.MAINTENANCE,
        priority: NotificationPriority.HIGH,
        title: `Maintenance Due Tomorrow: ${truck.plateNumber}`,
        message: `Maintenance "${maintenance.title || maintenance.type}" is due tomorrow (${formattedDate}) for truck ${truck.plateNumber}. Please schedule maintenance to avoid service interruptions.`,
        entityType: EntityType.TRUCK,
        entityId: truck.id,
        channels: [NotificationChannel.IN_APP],
        metadata: {
          tenantId: truck.tenantId,
          truckId: truck.id,
          truckPlateNumber: truck.plateNumber,
          maintenanceId: maintenance.id,
          maintenanceType: maintenance.type,
          maintenanceTitle: maintenance.title,
          nextDueDate: maintenance.nextDueDate,
          notificationKey: `maintenance-${truck.id}-${maintenance.id}`,
          actionUrl: `/fleet/trucks/${truck.id}/maintenance`,
        },
      };
      
      // Add tenantId directly to the notification object
      (notificationData as any).tenantId = truck.tenantId;
      
      await this.notificationService.createNotification(notificationData);
      
      this.logger.log(
        `Created maintenance notification for truck ${truck.plateNumber}, maintenance ${maintenance.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating maintenance notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Create inspection notification
   */
  private async createInspectionNotification(truck: Truck, inspection: any) {
    try {
      const nextInspectionDate = new Date(inspection.nextInspectionDate);
      const formattedDate = nextInspectionDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const notificationData: any = {
        recipientId: truck.ownerId,
        notificationType: NotificationType.VEHICLE_INSPECTION_DUE,
        category: NotificationCategory.COMPLIANCE,
        priority: NotificationPriority.HIGH,
        title: `Inspection Due Tomorrow: ${truck.plateNumber}`,
        message: `Inspection "${inspection.title || inspection.type}" is due tomorrow (${formattedDate}) for truck ${truck.plateNumber}. Please schedule inspection to maintain compliance.`,
        entityType: EntityType.TRUCK,
        entityId: truck.id,
        channels: [NotificationChannel.IN_APP],
        metadata: {
          tenantId: truck.tenantId,
          truckId: truck.id,
          truckPlateNumber: truck.plateNumber,
          inspectionId: inspection.id,
          inspectionType: inspection.type,
          inspectionTitle: inspection.title,
          nextInspectionDate: inspection.nextInspectionDate,
          notificationKey: `inspection-${truck.id}-${inspection.id}`,
          actionUrl: `/fleet/trucks/${truck.id}/inspections`,
        },
      };
      
      // Add tenantId directly to the notification object
      (notificationData as any).tenantId = truck.tenantId;
      
      await this.notificationService.createNotification(notificationData);
      
      this.logger.log(
        `Created inspection notification for truck ${truck.plateNumber}, inspection ${inspection.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating inspection notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Create insurance notification
   */
  private async createInsuranceNotification(truck: Truck, insurance: any) {
    try {
      const endDate = new Date(insurance.endDate);
      const formattedDate = endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      const notificationData: any = {
        recipientId: truck.ownerId,
        notificationType: NotificationType.VEHICLE_INSURANCE_EXPIRY,
        category: NotificationCategory.COMPLIANCE,
        priority: NotificationPriority.URGENT,
        title: `Insurance Expiring Tomorrow: ${truck.plateNumber}`,
        message: `Insurance policy "${insurance.policyNumber || insurance.policyType}" expires tomorrow (${formattedDate}) for truck ${truck.plateNumber}. Please renew immediately to avoid coverage gaps.`,
        entityType: EntityType.TRUCK,
        entityId: truck.id,
        channels: [NotificationChannel.IN_APP],
        metadata: {
          tenantId: truck.tenantId,
          truckId: truck.id,
          truckPlateNumber: truck.plateNumber,
          insuranceId: insurance.id,
          policyNumber: insurance.policyNumber,
          policyType: insurance.policyType,
          endDate: insurance.endDate,
          notificationKey: `insurance-${truck.id}-${insurance.id}`,
          actionUrl: `/fleet/trucks/${truck.id}/insurance`,
        },
      };
      
      // Add tenantId directly to the notification object
      (notificationData as any).tenantId = truck.tenantId;
      
      await this.notificationService.createNotification(notificationData);
      
      this.logger.log(
        `Created insurance notification for truck ${truck.plateNumber}, insurance ${insurance.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error creating insurance notification: ${error.message}`,
        error.stack,
      );
    }
  }

}

