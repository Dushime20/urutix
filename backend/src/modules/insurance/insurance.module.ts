import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';
import { InsurancePolicy } from '../../entities/insurance-policy.entity';
import { InsuranceClaim } from '../../entities/insurance-claim.entity';
import { InsuranceRenewal } from '../../entities/insurance-renewal.entity';
import { Truck } from '../../entities/truck.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InsurancePolicy,
      InsuranceClaim,
      InsuranceRenewal,
      Truck,
    ]),
  ],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
