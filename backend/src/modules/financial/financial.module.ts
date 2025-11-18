import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { Invoice, InvoiceItem } from './entities/invoice.entity';
import { Expense } from './entities/expense.entity';
import { FinancialPayment } from './entities/payment.entity';
import { FinancialReport } from './entities/financial-report.entity';
import { Budget } from './entities/budget.entity';
import { TaxRecord } from './entities/tax-record.entity';

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
    ]),
  ],
  controllers: [FinancialController],
  providers: [FinancialService],
  exports: [FinancialService],
})
export class FinancialModule {}
