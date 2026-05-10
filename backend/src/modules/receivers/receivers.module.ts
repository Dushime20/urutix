import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiversController } from './receivers.controller';
import { ReceiversService } from './receivers.service';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Load } from '../../entities/load.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { CargoInspection } from '../../entities/cargo-inspection.entity';
import { EmailService } from '../auth/services/email.service';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, Load, PasswordResetToken, CargoInspection]),
    EnhancedAuthModule,
    forwardRef(() => TripsModule),
  ],
  controllers: [ReceiversController],
  providers: [ReceiversService],
  exports: [ReceiversService],
})
export class ReceiversModule {}

