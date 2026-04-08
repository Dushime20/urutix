import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SafetyIncident,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from '../../entities/safety-incident.entity';
import {
  SafetyInspection,
  InspectionType,
  InspectionStatus,
  ComplianceStatus,
} from '../../entities/safety-inspection.entity';
import {
  SafetyTraining,
  TrainingType,
  TrainingFrequency,
  TrainingStatus,
} from '../../entities/safety-training.entity';
import {
  Notification,
  NotificationStatus,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  EntityType,
  NotificationChannel,
} from '../../entities/notification.entity';
import { CreateSafetyIncidentDto } from './dto/create-safety-incident.dto';
import { CreateSafetyInspectionDto } from './dto/create-safety-inspection.dto';
import { CreateSafetyTrainingDto } from './dto/create-safety-training.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class SafetyService {
  constructor(
    @InjectRepository(SafetyIncident)
    private readonly incidentRepository: Repository<SafetyIncident>,
    @InjectRepository(SafetyInspection)
    private readonly inspectionRepository: Repository<SafetyInspection>,
    @InjectRepository(SafetyTraining)
    private readonly trainingRepository: Repository<SafetyTraining>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationService: NotificationService,
  ) {}

  async createIncident(
    createDto: CreateSafetyIncidentDto,
    tenantId: string,
    userId: string,
  ): Promise<SafetyIncident> {
    try {
      const incident = this.incidentRepository.create({
        ...createDto,
        tenantId,
        createdBy: userId,
        date: new Date(createDto.date),
        status: createDto.status || IncidentStatus.REPORTED,
        propertyDamage: createDto.propertyDamage || 0,
        cost: createDto.cost || 0,
        policeReport: createDto.policeReport || false,
        insuranceClaim: createDto.insuranceClaim || false,
        correctiveActions: createDto.correctiveActions || [],
      });

      return await this.incidentRepository.save(incident);
    } catch (error) {
      console.error('❌ Error creating safety incident:', error);
      throw new BadRequestException(
        `Failed to create safety incident: ${error.message}`,
      );
    }
  }

  async findAllIncidents(
    tenantId: string,
    filters?: {
      status?: IncidentStatus;
      severity?: IncidentSeverity;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<SafetyIncident[]> {
    try {
      const query = this.incidentRepository
        .createQueryBuilder('incident')
        .leftJoinAndSelect('trucks', 'truck', 'incident.truckId = truck.id')
        .where('incident.tenantId = :tenantId', { tenantId })
        .andWhere('incident.deletedAt IS NULL')
        .orderBy('incident.date', 'DESC');

      if (filters?.status) {
        query.andWhere('incident.status = :status', { status: filters.status });
      }

      if (filters?.severity) {
        query.andWhere('incident.severity = :severity', {
          severity: filters.severity,
        });
      }

      if (filters?.startDate) {
        query.andWhere('incident.date >= :startDate', {
          startDate: filters.startDate,
        });
      }

      if (filters?.endDate) {
        query.andWhere('incident.date <= :endDate', {
          endDate: filters.endDate,
        });
      }

      const incidents = await query.getRawAndEntities();
      
      // Map truck plate numbers to incidents
      return incidents.entities.map((incident, index) => {
        const raw = incidents.raw[index];
        if (raw && raw.truck_plateNumber && !incident.truckPlate) {
          incident.truckPlate = raw.truck_plateNumber;
        }
        return incident;
      });
    } catch (error) {
      console.error('❌ Error fetching safety incidents:', error);
      throw new BadRequestException(
        `Failed to fetch safety incidents: ${error.message}`,
      );
    }
  }

  async findOneIncident(
    incidentId: string,
    tenantId: string,
  ): Promise<SafetyIncident> {
    const incident = await this.incidentRepository.findOne({
      where: { id: incidentId, tenantId, deletedAt: null },
    });

    if (!incident) {
      throw new NotFoundException('Safety incident not found');
    }

    return incident;
  }

  async updateIncident(
    incidentId: string,
    updateDto: Partial<CreateSafetyIncidentDto>,
    tenantId: string,
  ): Promise<SafetyIncident> {
    const incident = await this.findOneIncident(incidentId, tenantId);

    const updateData: any = { ...updateDto };
    if (updateDto.date) {
      updateData.date = new Date(updateDto.date);
    }

    Object.assign(incident, updateData);
    return await this.incidentRepository.save(incident);
  }

  async deleteIncident(incidentId: string, tenantId: string): Promise<void> {
    const incident = await this.findOneIncident(incidentId, tenantId);
    incident.deletedAt = new Date();
    await this.incidentRepository.save(incident);
  }

  // ===== INSPECTION METHODS =====

  async createInspection(
    createDto: CreateSafetyInspectionDto,
    tenantId: string,
    userId: string,
  ): Promise<SafetyInspection> {
    try {
      const inspection = this.inspectionRepository.create({
        ...createDto,
        tenantId,
        createdBy: userId,
        inspectionDate: new Date(createDto.inspectionDate),
        nextInspectionDate: createDto.nextInspectionDate
          ? new Date(createDto.nextInspectionDate)
          : null,
        score: createDto.score || 0,
        maxScore: createDto.maxScore || 100,
        items: createDto.items || [],
        complianceStatus:
          createDto.complianceStatus || ComplianceStatus.COMPLIANT,
      });

      return await this.inspectionRepository.save(inspection);
    } catch (error) {
      console.error('❌ Error creating safety inspection:', error);
      throw new BadRequestException(
        `Failed to create safety inspection: ${error.message}`,
      );
    }
  }

  async findAllInspections(
    tenantId: string,
    filters?: {
      status?: InspectionStatus;
      truckId?: string;
      inspectorId?: string;
    },
  ): Promise<SafetyInspection[]> {
    try {
      const query = this.inspectionRepository
        .createQueryBuilder('inspection')
        .where('inspection.tenantId = :tenantId', { tenantId })
        .andWhere('inspection.deletedAt IS NULL')
        .orderBy('inspection.inspectionDate', 'DESC');

      if (filters?.status) {
        query.andWhere('inspection.status = :status', {
          status: filters.status,
        });
      }

      if (filters?.truckId) {
        query.andWhere('inspection.truckId = :truckId', {
          truckId: filters.truckId,
        });
      }

      if (filters?.inspectorId) {
        query.andWhere('inspection.inspector = :inspectorId', {
          inspectorId: filters.inspectorId,
        });
      }

      return await query.getMany();
    } catch (error) {
      console.error('❌ Error fetching safety inspections:', error);
      throw new BadRequestException(
        `Failed to fetch safety inspections: ${error.message}`,
      );
    }
  }

  async findOneInspection(
    inspectionId: string,
    tenantId: string,
  ): Promise<SafetyInspection> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id: inspectionId, tenantId, deletedAt: null },
    });

    if (!inspection) {
      throw new NotFoundException('Safety inspection not found');
    }

    return inspection;
  }

  async updateInspection(
    inspectionId: string,
    updateDto: Partial<CreateSafetyInspectionDto>,
    tenantId: string,
  ): Promise<SafetyInspection> {
    const inspection = await this.findOneInspection(inspectionId, tenantId);

    const updateData: any = { ...updateDto };
    if (updateDto.inspectionDate) {
      updateData.inspectionDate = new Date(updateDto.inspectionDate);
    }
    if (updateDto.nextInspectionDate) {
      updateData.nextInspectionDate = new Date(updateDto.nextInspectionDate);
    }

    Object.assign(inspection, updateData);
    return await this.inspectionRepository.save(inspection);
  }

  async deleteInspection(
    inspectionId: string,
    tenantId: string,
  ): Promise<void> {
    const inspection = await this.findOneInspection(inspectionId, tenantId);
    inspection.deletedAt = new Date();
    await this.inspectionRepository.save(inspection);
  }

  // ===== TRAINING METHODS =====

  async createTraining(
    createDto: CreateSafetyTrainingDto,
    tenantId: string,
    userId: string,
  ): Promise<SafetyTraining> {
    try {
      const scheduledDate = new Date(createDto.scheduledDate);
      const nextDue = new Date(createDto.nextDue);

      const training = this.trainingRepository.create({
        ...createDto,
        tenantId,
        createdBy: userId,
        scheduledDate,
        nextDue,
        lastCompleted: createDto.lastCompleted
          ? new Date(createDto.lastCompleted)
          : null,
        status: createDto.status || TrainingStatus.PENDING,
        required: createDto.required || false,
      });

      const savedTraining = await this.trainingRepository.save(training);

      // Schedule notification 1 day before training
      await this.scheduleTrainingReminder(savedTraining, tenantId, userId);

      return savedTraining;
    } catch (error) {
      console.error('❌ Error creating safety training:', error);
      throw new BadRequestException(
        `Failed to create safety training: ${error.message}`,
      );
    }
  }

  private async scheduleTrainingReminder(
    training: SafetyTraining,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    try {
      const trainingDate = new Date(training.scheduledDate);
      const reminderDate = new Date(trainingDate);
      reminderDate.setDate(reminderDate.getDate() - 1); // 1 day before

      // Only schedule if reminder date is in the future
      if (reminderDate > new Date()) {
        const trainingDateStr = trainingDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const trainingTimeStr = trainingDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });

        // Create notification directly using repository since we need tenantId
        const notification = this.notificationRepository.create({
          recipientId: training.driverId || userId,
          tenantId,
          notificationType: NotificationType.REMINDER,
          category: NotificationCategory.SAFETY,
          priority: NotificationPriority.NORMAL,
          title: `Training Reminder: ${training.title}`,
          message: `You have a training session scheduled for tomorrow: "${training.title}". The training will take place on ${trainingDateStr} at ${trainingTimeStr}. Instructor: ${training.instructor}. Duration: ${training.duration} hours.`,
          shortMessage: `Training reminder: ${training.title}`,
          channels: [NotificationChannel.IN_APP],
          scheduledAt: reminderDate,
          entityId: training.id,
          entityType: EntityType.DRIVER,
          status: NotificationStatus.PENDING,
          metadata: {
            trainingId: training.id,
            trainingTitle: training.title,
            trainingDate: training.scheduledDate,
            trainingType: training.type,
            instructor: training.instructor,
            duration: training.duration,
          },
        });
        await this.notificationRepository.save(notification);
      }
    } catch (error) {
      console.error('❌ Error scheduling training reminder:', error);
      // Don't throw - training creation should still succeed even if notification fails
    }
  }

  async findAllTrainings(
    tenantId: string,
    filters?: {
      status?: TrainingStatus;
      driverId?: string;
      type?: TrainingType;
    },
  ): Promise<SafetyTraining[]> {
    try {
      const query = this.trainingRepository
        .createQueryBuilder('training')
        .where('training.tenantId = :tenantId', { tenantId })
        .andWhere('training.deletedAt IS NULL')
        .orderBy('training.scheduledDate', 'DESC');

      if (filters?.status) {
        query.andWhere('training.status = :status', { status: filters.status });
      }

      if (filters?.driverId) {
        query.andWhere('training.driverId = :driverId', {
          driverId: filters.driverId,
        });
      }

      if (filters?.type) {
        query.andWhere('training.type = :type', { type: filters.type });
      }

      return await query.getMany();
    } catch (error) {
      console.error('❌ Error fetching safety trainings:', error);
      throw new BadRequestException(
        `Failed to fetch safety trainings: ${error.message}`,
      );
    }
  }

  async findOneTraining(
    trainingId: string,
    tenantId: string,
  ): Promise<SafetyTraining> {
    const training = await this.trainingRepository.findOne({
      where: { id: trainingId, tenantId, deletedAt: null },
    });

    if (!training) {
      throw new NotFoundException('Safety training not found');
    }

    return training;
  }

  async updateTraining(
    trainingId: string,
    updateDto: Partial<CreateSafetyTrainingDto>,
    tenantId: string,
  ): Promise<SafetyTraining> {
    const training = await this.findOneTraining(trainingId, tenantId);

    const updateData: any = { ...updateDto };
    if (updateDto.scheduledDate) {
      updateData.scheduledDate = new Date(updateDto.scheduledDate);
    }
    if (updateDto.nextDue) {
      updateData.nextDue = new Date(updateDto.nextDue);
    }
    if (updateDto.lastCompleted) {
      updateData.lastCompleted = new Date(updateDto.lastCompleted);
    }

    Object.assign(training, updateData);
    return await this.trainingRepository.save(training);
  }

  async deleteTraining(trainingId: string, tenantId: string): Promise<void> {
    const training = await this.findOneTraining(trainingId, tenantId);
    training.deletedAt = new Date();
    await this.trainingRepository.save(training);
  }
}
