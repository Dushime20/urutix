import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Load } from '../../entities/load.entity';
import { Location } from '../../entities/location.entity';
import { User } from '../../entities/user.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { LoanRequest } from '../../entities/loan-request.entity';
import { Lender } from '../../entities/lender.entity';

import { LoadsV2Service } from './loads-v2.service';
import { LoadsV2Controller } from './loads-v2.controller';
import { LoadValidationV2Service } from './services/load-validation-v2.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Load, Location, User, Truck, Driver, LoanRequest, Lender]),
    EnhancedAuthModule,
  ],
  controllers: [LoadsV2Controller],
  providers: [LoadsV2Service, LoadValidationV2Service],
  exports: [LoadsV2Service, LoadValidationV2Service],
})
export class LoadsV2Module {}
