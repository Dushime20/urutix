import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuelLog } from '../../entities/fuel-log.entity';
import { FuelWallet } from '../../entities/fuel-wallet.entity';
import { FuelWalletTransaction } from '../../entities/fuel-wallet-transaction.entity';
import { FuelService } from './fuel.service';
import { FuelWalletService } from './fuel-wallet.service';
import { FuelController } from './fuel.controller';

@Module({
    imports: [TypeOrmModule.forFeature([FuelLog, FuelWallet, FuelWalletTransaction])],
    controllers: [FuelController],
    providers: [FuelService, FuelWalletService],
    exports: [FuelService, FuelWalletService],
})
export class FuelModule { }
