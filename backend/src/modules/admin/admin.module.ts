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
import { AdminPermissionsController } from './admin-permissions.controller';
import { AdminMonitoringController } from './admin-monitoring.controller';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { MonitoringService } from '../../services/monitoringService';

// New imports for advanced admin features
import { ActivityLog } from '../../entities/activity-log.entity';
import { UserSession } from '../../entities/user-session.entity';
import { Permission } from '../../entities/permission.entity';
import { Role } from '../../entities/role.entity';
import { UserPermissionOverride } from '../../entities/user-permission-override.entity';
import { SystemSettings } from '../../entities/system-settings.entity';
import { ActivityLogController } from './activity-log.controller';
import { PermissionController } from './permission.controller';
import { SystemSettingsController } from './system-settings.controller';
import { ActivityLogService } from '../../services/activity-log.service';
import { RolePermissionService } from '../../services/permission.service';
import { SystemSettingsService } from '../../services/system-settings.service';

// Subscription imports
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';
import { CreditAccount } from '../../entities/credit-account.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';
import { FeatureCreditCost } from '../../entities/feature-credit-cost.entity';
import { SubscriptionService } from '../../services/subscription.service';
import { CreditService } from '../../services/credit.service';

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
      // New entities
      ActivityLog,
      UserSession,
      Permission,
      Role,
      UserPermissionOverride,
      SystemSettings,
      // Subscription entities
      SubscriptionPlan,
      TenantSubscription,
      CreditAccount,
      CreditTransaction,
      FeatureCreditCost,
    ]),
    UsersModule, // Import UsersModule to use UsersService
    EnhancedAuthModule, // Import EnhancedAuthModule to use PermissionService
  ],
  controllers: [
    AdminController,
    AdminPermissionsController,
    AdminMonitoringController,
    // New controllers
    ActivityLogController,
    PermissionController,
    SystemSettingsController,
  ],
  providers: [
    AdminService,
    MonitoringService,
    // New services
    ActivityLogService,
    RolePermissionService,
    SystemSettingsService,
    // Subscription services
    SubscriptionService,
    CreditService,
  ],
  exports: [
    ActivityLogService,
    RolePermissionService,
    SystemSettingsService,
    SubscriptionService,
    CreditService,
  ],
})
export class AdminModule { }
