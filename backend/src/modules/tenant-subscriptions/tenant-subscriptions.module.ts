import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantSubscriptionsController } from './tenant-subscriptions.controller';
import { TenantSubscriptionsService } from './tenant-subscriptions.service';
import { TenantPlan } from '../../entities/tenant-plan.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { Tenant } from '../../entities/tenant.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantPlan, UserSubscription, Tenant, User]),
  ],
  controllers: [TenantSubscriptionsController],
  providers: [TenantSubscriptionsService],
  exports: [TenantSubscriptionsService],
})
export class TenantSubscriptionsModule {}
