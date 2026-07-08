import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Tenant } from '../../entities/tenant.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { Lender } from '../../entities/lender.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Tenant, PasswordResetToken, Lender]),
    // EnhancedAuthModule provides and exports EmailService with ConfigService injected.
    // Using it here ensures the SMTP transporter is properly initialized.
    EnhancedAuthModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
