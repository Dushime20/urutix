import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycController } from './kyc.controller';
import { KycService } from '../../services/kyc.service';
import { Tenant } from '../../entities/tenant.entity';
import { TenantKycDocument } from '../../entities/tenant-kyc-document.entity';
import { TenantKycAuditLog } from '../../entities/tenant-kyc-audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      TenantKycDocument,
      TenantKycAuditLog,
    ]),
  ],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}