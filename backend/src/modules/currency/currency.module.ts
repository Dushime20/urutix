import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from '../../entities/exchange-rate.entity';
import { Currency } from '../../entities/currency.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { CurrencyService } from './currency.service';
import { CurrencyController } from './currency.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExchangeRate, Currency, UserProfile])],
  controllers: [CurrencyController],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
