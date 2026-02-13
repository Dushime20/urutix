import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { GovernanceController } from './governance.controller';
import { AppealsController } from './appeals.controller';
import { RiskFlagsController } from './risk-flags.controller';
import { AuditController } from './audit.controller';
import { BlacklistController } from './blacklist.controller';
import { DashboardController } from './dashboard.controller';
import { GovernanceService } from './governance.service';
import { EnforcementService } from './enforcement.service';
import { AppealsService } from './appeals.service';
import { RiskDetectionService } from './risk-detection.service';
import { AuditService } from './audit.service';
import { BlacklistService } from './blacklist.service';
import { CacheInvalidationService } from './cache/cache-invalidation.service';
import { EnforcementAction } from './entities/enforcement-action.entity';
import { Appeal } from './entities/appeal.entity';
import { UserBlacklist } from './entities/user-blacklist.entity';
import { RiskFlag } from './entities/risk-flag.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import { NotificationModule } from '../notifications/notification.module';
import { redisConfig } from '../../config/redis.config';

/**
 * Governance Module
 * 
 * Provides enterprise-grade governance and abuse control capabilities for the platform.
 * This module enables Tenant Admins to manage enforcement actions, handle appeals,
 * detect risks, and maintain comprehensive audit trails.
 * 
 * Key Features:
 * - User suspension and termination
 * - Feature-level restrictions
 * - Appeal management
 * - Risk detection and flagging
 * - Blacklist management
 * - Immutable audit trail
 * 
 * Architecture Principles:
 * - Separation of financial status from enforcement status
 * - Immutable audit logs
 * - Defense in depth (DB, API, UI, Middleware)
 * - Performance-first with caching
 * 
 * Module Dependencies:
 * - CacheModule: Redis-based caching for enforcement status (60s TTL) to minimize DB queries
 * - NotificationModule: For sending enforcement and appeal notifications to users
 * - TypeORM: For database access to governance and related entities
 * 
 * Redis Configuration:
 * - Store: Redis (cache-manager-redis-store)
 * - TTL: 60 seconds (configurable per operation)
 * - Max entries: 10,000 (prevents memory overflow)
 * - Connection: Configured via environment variables (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD)
 */
@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([
      // Governance entities
      EnforcementAction,
      Appeal,
      UserBlacklist,
      RiskFlag,
      // Related entities
      UserSubscription,
      User,
      Tenant,
    ]),
    // Redis cache module for enforcement status caching
    // Uses Redis for distributed caching across multiple instances
    // TTL: 60 seconds (as per design document)
    // Invalidated on enforcement actions
    CacheModule.register(redisConfig),
    // Notification module for user/admin notifications
    NotificationModule,
  ],
  controllers: [
    GovernanceController,
    AppealsController,
    RiskFlagsController,
    AuditController,
    BlacklistController,
    DashboardController,
  ],
  providers: [
    GovernanceService,
    EnforcementService,
    AppealsService,
    RiskDetectionService,
    AuditService,
    BlacklistService,
    CacheInvalidationService,
  ],
  exports: [
    GovernanceService,
    EnforcementService,
    AppealsService,
    RiskDetectionService,
    AuditService,
    BlacklistService,
    CacheInvalidationService,
  ],
})
export class GovernanceModule {}
