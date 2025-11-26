import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { User } from '../../entities/user.entity';
import { Payment } from '../../entities/payment.entity';
import { Notification } from '../../entities/notification.entity';
import { Tenant } from '../../entities/tenant.entity';
import { Dispute } from '../../entities/dispute.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Route } from '../../entities/route.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Payment,
      Notification,
      Tenant,
      Dispute,
      AuditLog,
      Trip,
      Load,
      Truck,
      Route,
    ]),
    UsersModule, // Import UsersModule to use UsersService
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
