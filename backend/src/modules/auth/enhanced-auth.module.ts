import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { EmailVerificationToken } from '../../entities/email-verification-token.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { Tenant } from '../../entities/tenant.entity';
import { SecurityEvent } from '../../entities/security-event.entity';
import { ActivityLog } from '../../entities/activity-log.entity';
import { UserSession } from '../../entities/user-session.entity';
import { SystemSettings } from '../../entities/system-settings.entity';
import { EnhancedAuthService } from './services/enhanced-auth.service';
import { EnhancedAuthController } from './controllers/enhanced-auth.controller';
import { EnhancedJwtStrategy } from './strategies/enhanced-jwt.strategy';
import { EnhancedRateLimitGuard } from './guards/enhanced-rate-limit.guard';
import { EmailService } from './services/email.service';
import { TenantGuard } from './guards/tenant.guard';
import { TenantService } from './services/tenant.service';
import { TenantController } from './controllers/tenant.controller';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './guards/roles.guard';
import { PermissionService } from '../../services/raw-permission.service';
import { CapabilityService } from '../../services/capability.service';
import { RoutePermissionResolver } from '../../services/route-permission.resolver';
import { PermissionsGuard } from './guards/permissions.guard';
import { UserPermissionOverrideInterceptor } from './interceptors/user-permission-override.interceptor';
import { ActivityLogService } from '../../services/activity-log.service';
import { EventsModule } from '../events/events.module';
import { SystemSettingsService } from '../../services/system-settings.service';
import { TwoFactorService } from './services/two-factor.service';
import { TwoFactorController } from './controllers/two-factor.controller';
import { FeatureControl } from '../../entities/feature-control.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      RefreshToken,
      PasswordResetToken,
      EmailVerificationToken,
      AuditLog,
      Tenant,
      SecurityEvent,
      ActivityLog,
      UserSession,
      SystemSettings,
      FeatureControl,
    ]),
    ConfigModule,
    PassportModule,
    EventsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' }, // 24 hours session duration
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    EnhancedAuthService,
    EnhancedJwtStrategy,
    EnhancedRateLimitGuard,
    EmailService,
    TenantGuard,
    TenantService,
    RolesGuard,
    PermissionService,
    CapabilityService,
    RoutePermissionResolver,
    PermissionsGuard,
    UserPermissionOverrideInterceptor,
    ActivityLogService,
    SystemSettingsService,
    TwoFactorService,
  ],
  controllers: [EnhancedAuthController, TenantController, TwoFactorController],
  exports: [
    EnhancedAuthService,
    EnhancedJwtStrategy,
    JwtModule,
    EnhancedRateLimitGuard,
    TenantGuard,
    TenantService,
    RolesGuard,
    EmailService,
    PermissionService,
    CapabilityService,
    RoutePermissionResolver,
    PermissionsGuard,
    UserPermissionOverrideInterceptor,
    ActivityLogService,
    TwoFactorService,
  ],
})
export class EnhancedAuthModule { }
