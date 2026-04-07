import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuelLog } from '../../entities/fuel-log.entity';
import { FuelWallet } from '../../entities/fuel-wallet.entity';
import { FuelWalletTransaction } from '../../entities/fuel-wallet-transaction.entity';
import { DriverFuelAdvance } from '../../entities/driver-fuel-advance.entity';
import { Driver } from '../../entities/driver.entity';
import { Trip } from '../../entities/trip.entity';
import { FuelService } from './fuel.service';
import { FuelWalletService } from './fuel-wallet.service';
import { DriverFuelAdvanceService } from './driver-fuel-advance.service';
import { FuelController } from './fuel.controller';

@Module({
    imports: [TypeOrmModule.forFeature([FuelLog, FuelWallet, FuelWalletTransaction, DriverFuelAdvance, Driver, Trip])],
    controllers: [FuelController],
    providers: [FuelService, FuelWalletService, DriverFuelAdvanceService],
    exports: [FuelService, FuelWalletService, DriverFuelAdvanceService],
})
export class FuelModule { }
