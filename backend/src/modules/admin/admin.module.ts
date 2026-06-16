import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { OperationalAdminController } from './operational-admin.controller';import { AdminService } from './admin.service';
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
import { MonitoringService } from '../../services/monitoring.service';

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
import { CreditPricingRule } from '../../entities/credit-pricing-rule.entity';
import { SubscriptionService } from '../../services/subscription.service';
import { CreditService } from '../../services/credit.service';
import { PricingService } from '../../services/pricing.service';

// Bulk Email imports
import { EmailTemplate } from '../../entities/email-template.entity';
import { BulkEmailLog } from '../../entities/bulk-email-log.entity';
import { BulkEmailController } from './bulk-email.controller';
import { BulkEmailService } from '../../services/bulk-email.service';
import { AIEmailAssistantService } from '../../services/ai-email-assistant.service';
// EmailService is imported from EnhancedAuthModule
import { NotificationsModule } from '../notifications/notifications.module';
import { BiddingModule } from '../bidding/bidding.module';

// System Health imports
import { SystemHealthLog } from '../../entities/system-health.entity';
import { SystemHealthController } from './system-health.controller';
import { EnhancedSystemHealthController } from './enhanced-system-health.controller';
import { SystemHealthService } from '../../services/system-health.service';
import { EnhancedSystemHealthService } from '../../services/enhanced-system-health.service';
import { TenantManagementService } from '../../services/tenant-management.service';
import { PermissionHelper } from '../../utils/permission-helper';

// Security Center imports
import { SecurityEvent } from '../../entities/security-event.entity';
import { SecurityCenterController } from './security-center.controller';
import { SecurityCenterService } from '../../services/security-center.service';
import { PermissionTableInitService } from '../../services/permission-table-init.service';

// Tenant Management imports
import { TenantManagementController } from './tenant-management.controller';

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
      CreditPricingRule,
      // Bulk Email entities
      EmailTemplate,
      BulkEmailLog,
      // System Health entities
      SystemHealthLog,
      // Security Center entities
      SecurityEvent,
    ]),
    UsersModule, // Import UsersModule to use UsersService
    EnhancedAuthModule, // Import EnhancedAuthModule to use PermissionService
    NotificationsModule, // Import NotificationsModule for SmsService + NotificationsService
    BiddingModule, // Import BiddingModule for BiddingService
  ],
  controllers: [
    AdminController,
    OperationalAdminController,
    AdminPermissionsController,
    AdminMonitoringController,
    // New controllers
    ActivityLogController,
    PermissionController,
    SystemSettingsController,
    // Bulk Email controller
    BulkEmailController,
    // System Health controllers
    SystemHealthController,
    EnhancedSystemHealthController,
    // Security Center controller
    SecurityCenterController,
    // Tenant Management controller
    TenantManagementController,
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
    PricingService,
    // Bulk Email services
    BulkEmailService,
    AIEmailAssistantService,
    // System Health services
    SystemHealthService,
    EnhancedSystemHealthService,
    TenantManagementService,
    // Security Center services
    SecurityCenterService,
    // Permission utilities
    PermissionHelper,
    // Permission table initializer (creates tables + seeds data at startup)
    PermissionTableInitService,
    // EmailService is imported from EnhancedAuthModule, don't redeclare it here
  ],
  exports: [
    ActivityLogService,
    RolePermissionService,
    SystemSettingsService,
    SubscriptionService,
    CreditService,
    PricingService,
    BulkEmailService,
    AIEmailAssistantService,
    SystemHealthService,
    EnhancedSystemHealthService,
    TenantManagementService,
    SecurityCenterService,
  ],
})
export class AdminModule { }
