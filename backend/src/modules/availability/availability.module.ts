import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentReservation } from '../../entities/shipment-reservation.entity';
import { Trip } from '../../entities/trip.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Bid } from '../../entities/bid.entity';
import { Load } from '../../entities/load.entity';
import { LoadMatch } from '../../entities/load-match.entity';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { BidConflictResolutionService } from './services/bid-conflict-resolution.service';
import { TruckAvailabilityEngine } from './services/truck-availability.engine';
import { DriverSchedulingGuardService } from './services/driver-scheduling-guard.service';
import { AvailabilityReconciliationListener } from './listeners/availability-reconciliation.listener';
import { NotificationModule } from '../notifications/notification.module';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShipmentReservation,
      Trip,
      Truck,
      Driver,
      Bid,
      Load,
      LoadMatch,
    ]),
    NotificationModule,
    EnhancedAuthModule,
  ],
  providers: [
    TruckAvailabilityEngine,
    DriverSchedulingGuardService,
    AvailabilityService,
    BidConflictResolutionService,
    AvailabilityReconciliationListener,
  ],
  controllers: [AvailabilityController],
  exports: [
    AvailabilityService,
    BidConflictResolutionService,
    TruckAvailabilityEngine,
    DriverSchedulingGuardService,
  ],
})
export class AvailabilityModule {}
