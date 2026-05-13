import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomsInspection } from '../../entities/customs-inspection.entity';
import { CustomsCheckpoint } from '../../entities/customs-checkpoint.entity';
import { Trip } from '../../entities/trip.entity';
import { Truck } from '../../entities/truck.entity';
import { CustomsService } from './customs.service';
import { CustomsController } from './customs.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomsInspection,
      CustomsCheckpoint,
      Trip,
      Truck,
    ]),
  ],
  providers: [CustomsService],
  controllers: [CustomsController],
  exports: [CustomsService],
})
export class CustomsModule {}
