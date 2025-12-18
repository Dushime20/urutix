import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiversController } from './receivers.controller';
import { ReceiversService } from './receivers.service';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Load } from '../../entities/load.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { CargoInspection } from '../../entities/cargo-inspection.entity';
import { EmailService } from '../auth/email.service';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Load, PasswordResetToken, CargoInspection]),
    EnhancedAuthModule,
  ],
  controllers: [ReceiversController],
  providers: [ReceiversService],
  exports: [ReceiversService],
})
export class ReceiversModule {}

