import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Route } from '../../entities/route.entity';
import { RouteTruck } from '../../entities/route-truck.entity';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Truck, Driver, Route, RouteTruck])],
  providers: [FleetService],
  controllers: [FleetController],
  exports: [FleetService],
})
export class FleetModule {}
