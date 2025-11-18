import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Load } from '../../entities/load.entity';
import { Location } from '../../entities/location.entity';
import { User } from '../../entities/user.entity';
import { Truck } from '../../entities/truck.entity';

import { LoadsV2Service } from './loads-v2.service';
import { LoadsV2Controller } from './loads-v2.controller';
import { LoadValidationV2Service } from './services/load-validation-v2.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [TypeOrmModule.forFeature([Load, Location, User, Truck])],
  controllers: [LoadsV2Controller],
  providers: [LoadsV2Service, LoadValidationV2Service],
  exports: [LoadsV2Service, LoadValidationV2Service],
})
export class LoadsV2Module {}
