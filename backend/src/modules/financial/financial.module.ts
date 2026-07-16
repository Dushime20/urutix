import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { FinancialSchemaInitService } from './financial-schema-init.service';
import { Invoice, InvoiceItem } from './entities/invoice.entity';
import { Expense } from './entities/expense.entity';
import { FinancialPayment } from './entities/payment.entity';
import { FinancialReport } from './entities/financial-report.entity';
import { Budget } from './entities/budget.entity';
import { TaxRecord } from './entities/tax-record.entity';
import { Payment } from '../../entities/payment.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceItem,
      Expense,
      FinancialPayment,
      FinancialReport,
      Budget,
      TaxRecord,
      Payment,
      Trip,
      Load,
    ]),
  ],
  controllers: [FinancialController],
  providers: [FinancialService, FinancialSchemaInitService],
  exports: [FinancialService],
})
export class FinancialModule {}
