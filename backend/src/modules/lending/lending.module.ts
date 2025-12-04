import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LendingService } from './lending.service';
import { LendingController } from './lending.controller';
import { RiskAssessmentService } from './services/risk-assessment.service';
import { AutoLoanGeneratorService } from './services/auto-loan-generator.service';
import { LenderAnalyticsService } from './services/lender-analytics.service';
import { RepaymentProcessorService } from './services/repayment-processor.service';
import { LendingExceptionFilter } from './filters/lending-exception.filter';
import { Lender } from '../../entities/Lender';
import { LenderPolicy } from '../../entities/LenderPolicy';
import { LoanRequest } from '../../entities/LoanRequest';
import { LoanDisbursement } from '../../entities/LoanDisbursement';
import { LoanRepayment } from '../../entities/LoanRepayment';
import { Borrower } from '../../entities/Borrower';
import { Load } from '../../entities/load.entity';
import { Trip } from '../../entities/trip.entity';
import {
  LenderUser,
  LenderRole,
  LenderPermission,
} from '../../entities/LenderTeam';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lender,
      LenderPolicy,
      LoanRequest,
      LoanDisbursement,
      LoanRepayment,
      Borrower,
      Load,
      Trip,
      LenderUser,
      LenderRole,
      LenderPermission,
      User,
      UserProfile,
      PasswordResetToken,
    ]),
    EnhancedAuthModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  controllers: [LendingController],
  providers: [
    LendingService,
    RiskAssessmentService,
    AutoLoanGeneratorService,
    LenderAnalyticsService,
    RepaymentProcessorService,
    {
      provide: APP_FILTER,
      useClass: LendingExceptionFilter,
    },
  ],
  exports: [
    LendingService,
    RiskAssessmentService,
    AutoLoanGeneratorService,
    LenderAnalyticsService,
    RepaymentProcessorService,
  ],
})
export class LendingModule {}
