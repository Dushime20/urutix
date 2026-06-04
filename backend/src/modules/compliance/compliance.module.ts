import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ComplianceSchedulerService } from './compliance-scheduler.service';
import { ComplianceGateService } from './compliance-gate.service';
import { ComplianceController } from './compliance.controller';
import { Driver } from '../../entities/driver.entity';
import { Truck } from '../../entities/truck.entity';
import { Tenant } from '../../entities/tenant.entity';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, Truck, Tenant, Notification, User]),
    ScheduleModule.forRoot(),
    EnhancedAuthModule,
  ],
  controllers: [ComplianceController],
  providers: [ComplianceSchedulerService, ComplianceGateService],
  exports: [ComplianceGateService],
})
export class ComplianceModule {}
