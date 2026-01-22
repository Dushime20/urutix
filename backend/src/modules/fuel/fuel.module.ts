import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuelLog } from '../../entities/fuel-log.entity';
import { FuelService } from './fuel.service';
import { FuelController } from './fuel.controller';

@Module({
    imports: [TypeOrmModule.forFeature([FuelLog])],
    controllers: [FuelController],
    providers: [FuelService],
    exports: [FuelService],
})
export class FuelModule { }
