import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuelLog } from '../../entities/fuel-log.entity';
import { FuelWallet } from '../../entities/fuel-wallet.entity';
import { FuelWalletTransaction } from '../../entities/fuel-wallet-transaction.entity';
import { FuelBudget } from '../../entities/fuel-budget.entity';
import { DriverFuelAdvance } from '../../entities/driver-fuel-advance.entity';
import { FuelService } from './fuel.service';
import { FuelWalletService } from './fuel-wallet.service';
import { FuelBudgetService } from './fuel-budget.service';
import { DriverFuelAdvanceService } from './driver-fuel-advance.service';
import { FuelController } from './fuel.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            FuelLog,
            FuelWallet,
            FuelWalletTransaction,
            FuelBudget,
            DriverFuelAdvance,
        ]),
    ],
    controllers: [FuelController],
    providers: [
        FuelService,
        FuelWalletService,
        FuelBudgetService,
        DriverFuelAdvanceService,
    ],
    exports: [
        FuelService,
        FuelWalletService,
        FuelBudgetService,
        DriverFuelAdvanceService,
    ],
})
export class FuelModule { }
