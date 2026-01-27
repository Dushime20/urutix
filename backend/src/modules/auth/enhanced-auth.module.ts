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
import { EnhancedAuthService } from './enhanced-auth.service';
import { EnhancedAuthController } from './enhanced-auth.controller';
import { EnhancedJwtStrategy } from './enhanced-jwt.strategy';
import { EnhancedRateLimitGuard } from './enhanced-rate-limit.guard';
import { EmailService } from './email.service';
import { TenantGuard } from './tenant.guard';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';
import { PermissionService } from '../../services/permissionService';
import { PermissionsGuard } from './permissions.guard';

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
    ]),
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '15m' },
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
    TenantService,
    RolesGuard,
    PermissionService,
    PermissionsGuard,
  ],
  controllers: [EnhancedAuthController, TenantController],
  exports: [
    EnhancedAuthService,
    EnhancedJwtStrategy,
    JwtModule,
    EnhancedRateLimitGuard,
    TenantGuard,
    TenantService,
    RolesGuard,
    RolesGuard,
    EmailService,
    PermissionService,
    PermissionsGuard,
  ],
})
export class EnhancedAuthModule { }
