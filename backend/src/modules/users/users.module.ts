import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Tenant } from '../../entities/tenant.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { EmailService } from '../auth/email.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, Tenant, PasswordResetToken])],
  providers: [UsersService, EmailService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
