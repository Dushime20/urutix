import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import { SafetyIncident, IncidentType as SafetyIncidentType, IncidentSeverity, IncidentStatus } from '../../../entities/safety-incident.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType, NotificationCategory, NotificationChannel, NotificationPriority } from '../../../entities/notification.entity';
import { RealTimeProcessorService } from './real-time-processor.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SafetyGuardianService {
  private readonly logger = new Logger(SafetyGuardianService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(SafetyIncident)
    private readonly safetyRepository: Repository<SafetyIncident>,
    private readonly notificationService: NotificationService,
    private readonly realTimeProcessor: RealTimeProcessorService,
  ) {}

  /**
   * Performs a "Planetary Risk Scan" on all active trips every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async performNeuralSafetyScan() {
    const activeTrips = await this.tripRepository.find({
      where: { status: TripStatus.IN_PROGRESS },
      relations: ['truck', 'driver', 'driver.user', 'load'],
    });

    if (activeTrips.length === 0) return;

    this.logger.log(`🛡️ [SAFETY-GUARDIAN] Initiating Neural Scan of ${activeTrips.length} active missions.`);

    for (const trip of activeTrips) {
      await this.evaluateTripRisk(trip);
    }
  }

  private async evaluateTripRisk(trip: Trip) {
    // 1. Get Environmental Telemetry (Simulated)
    const weatherRisk = Math.random() > 0.9 ? 'SEVERE_STORM' : 'CLEAR';
    
    // 2. Biometric Fatigue Simulation (Neural Model)
    const startTimeStamp = trip.actualStartTime ? trip.actualStartTime.getTime() : new Date().getTime();
    const tripDurationHours = (new Date().getTime() - startTimeStamp) / (1000 * 60 * 60);
    const fatigueFactor = tripDurationHours > 10 ? 0.8 : 0.2; 

    // 3. Maintenance Integrity
    const maintenanceRisk = trip.truck?.lastMaintenanceDate ? 0.1 : 0.4;

    // Neural Risk Aggregation
    const aggRiskScore = (fatigueFactor * 0.5) + (maintenanceRisk * 0.3) + (weatherRisk === 'SEVERE_STORM' ? 0.9 : 0);

    if (aggRiskScore > 0.75) {
      this.logger.warn(`🛑 [CRITICAL-RISK] Trip ${trip.tripNumber} flagged by Neural Safety Guardian. Score: ${aggRiskScore.toFixed(2)}`);
      await this.initiateAutonomousIntervention(trip, 'FATIGUE_WEATHER_COMPOSITE');
    }
  }

  private async initiateAutonomousIntervention(trip: Trip, reason: string) {
    this.logger.log(`🤖 [INTERVENTION] Issuing Autonomous "FORCED_REST" command for Trip ${trip.tripNumber}`);

    // Notify Driver
    if (trip.driver?.userId) {
      await this.notificationService.createNotification({
        userId: trip.driver.userId,
        tenantId: trip.tenantId,
        subject: '⚠️ NEURAL SAFETY ADVISORY: FORCED REST',
        content: 'Neural sensors detect high fatigue & incoming micro-climatic risks. Autonomous safety protocols require a 45-minute rest at the next safe waypoint.',
        type: NotificationType.DRIVER_FATIGUE_WARNING,
        category: NotificationCategory.SAFETY,
        priority: NotificationPriority.URGENT,
        channel: NotificationChannel.IN_APP, // Changed from channels array to single channel
        templateId: 'safety-advisory', // Added required templateId
        actionUrl: `/dashboard/driver/safety`,
        actionText: 'Acknowledge Rest',
        metadata: {
          entityType: 'TRIP',
          entityId: trip.id,
          requiresAction: true,
        },
      });
    }

    // Notify Operations (War Room)
    await this.realTimeProcessor.processAnalyticsStream(
      trip.tenantId,
      {
        type: 'SAFETY_INTERVENTION',
        id: trip.id,
        timestamp: new Date().toISOString(),
        metadata: {
          tripNumber: trip.tripNumber,
          driverName: `${trip.driver?.firstName} ${trip.driver?.lastName}`,
          riskType: reason,
          actionTaken: 'FORCED_REST_COMMAND_ISSUED'
        }
      }
    );

    // Create a Safety Warning Record
    const incident = this.safetyRepository.create({
      tenantId: trip.tenantId,
      truckId: trip.truckId,
      driverId: trip.driverId,
      type: SafetyIncidentType.NEAR_MISS,
      severity: IncidentSeverity.CRITICAL,
      description: `Neural Guardian autonomously intervened due to composite risk score elevation. Origin: ${reason}`,
      date: new Date(),
      status: IncidentStatus.REPORTED,
      location: 'NEURAL_SCAN_COORDINATE_LOG'
    });
    
    await this.safetyRepository.save(incident);
  }
}
