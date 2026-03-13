import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserKycController } from './user-kyc.controller';
import { UserKycService } from '../../services/user-kyc.service';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { UserKycDocument } from '../../entities/user-kyc-document.entity';
import { KycRoleRequirements } from '../../entities/kyc-role-requirements.entity';
import { UserKycAuditLog } from '../../entities/user-kyc-audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserKycDocument,
      KycRoleRequirements,
      UserKycAuditLog,
    ]),
  ],
  controllers: [UserKycController],
  providers: [UserKycService],
  exports: [UserKycService],
})
export class UserKycModule {}