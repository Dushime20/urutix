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
import { UrutiLendingIntegrationService } from './services/uruti-lending-integration.service';
import { UrutiLendingWebhookController } from './controllers/uruti-lending-webhook.controller';
import { UrutiLendingAdminController } from './controllers/uruti-lending-admin.controller';
import { LendingExceptionFilter } from './filters/lending-exception.filter';
import { Lender } from '../../entities/lender.entity';
import { LenderPolicy } from '../../entities/lender-policy.entity';
import { LoanRequest } from '../../entities/loan-request.entity';
import { LoanDisbursement } from '../../entities/loan-disbursement.entity';
import { LoanRepayment } from '../../entities/loan-repayment.entity';
import { Borrower } from '../../entities/borrower.entity';
import { Load } from '../../entities/load.entity';
import { Trip } from '../../entities/trip.entity';
import {
  LenderUser,
  LenderRole,
  LenderPermission,
} from '../../entities/lender-team.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
// import { PaymentsModule } from '../payments/payments.module'; // Temporarily comment out to avoid circular dependency

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
    // PaymentsModule, // Temporarily comment out
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    LendingController,
    UrutiLendingWebhookController,
    UrutiLendingAdminController,
  ],
  providers: [
    LendingService,
    RiskAssessmentService,
    AutoLoanGeneratorService,
    LenderAnalyticsService,
    RepaymentProcessorService,
    UrutiLendingIntegrationService,
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
    UrutiLendingIntegrationService,
  ],
})
export class LendingModule {}
