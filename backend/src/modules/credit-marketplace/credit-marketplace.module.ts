import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditMarketplaceController } from './credit-marketplace.controller';
import { CreditMarketplaceService } from '../../services/credit-marketplace.service';
import { CreditMarketplaceSettings } from '../../entities/credit-marketplace-settings.entity';
import { CreditService } from '../../services/credit.service';
import { CreditAccount } from '../../entities/credit-account.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';
import { FeatureCreditCost } from '../../entities/feature-credit-cost.entity';
import { User } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditMarketplaceSettings,
      CreditAccount,
      CreditTransaction,
      FeatureCreditCost,
      User,
      Tenant,
    ]),
  ],
  controllers: [CreditMarketplaceController],
  providers: [CreditMarketplaceService, CreditService],
  exports: [CreditMarketplaceService],
})
export class CreditMarketplaceModule {}
