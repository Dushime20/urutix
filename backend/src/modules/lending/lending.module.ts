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
import { LendingPoliciesService } from './services/lending-policies.service';
import { LendingPoliciesController } from './controllers/lending-policies.controller';
import { UrutiLendingWebhookController } from './controllers/uruti-lending-webhook.controller';
import { UrutiLendingAdminController } from './controllers/uruti-lending-admin.controller';
import { LendingExceptionFilter } from './filters/lending-exception.filter';
import { Lender } from '../../entities/lender.entity';
import { LenderPolicy } from '../../entities/lender-policy.entity';
import { LendingPolicyInterestRate } from '../../entities/lending-policy-interest-rate.entity';
import { LendingPolicyLoanLimit } from '../../entities/lending-policy-loan-limit.entity';
import { LendingPolicyEligibility } from '../../entities/lending-policy-eligibility.entity';
import { LendingPolicyRiskAssessment } from '../../entities/lending-policy-risk-assessment.entity';
import { LendingPolicyRepayment } from '../../entities/lending-policy-repayment.entity';
import { LendingPolicyCargoType } from '../../entities/lending-policy-cargo-type.entity';
import { LendingPolicySystemConfig } from '../../entities/lending-policy-system-config.entity';
import { LoanRequest } from '../../entities/loan-request.entity';
import { LoanTerms } from '../../entities/loan-terms.entity';
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
import { LoanNotificationService } from './services/loan-notification.service';
import { LoanEventListener } from './listeners/loan-event.listener';
import { Notification } from '../../entities/notification.entity';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lender,
      LenderPolicy,
      LendingPolicyInterestRate,
      LendingPolicyLoanLimit,
      LendingPolicyEligibility,
      LendingPolicyRiskAssessment,
      LendingPolicyRepayment,
      LendingPolicyCargoType,
      LendingPolicySystemConfig,
      LoanRequest,
      LoanTerms,
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
      Notification,
    ]),
    EnhancedAuthModule,
    CurrencyModule,
    // PaymentsModule, // Temporarily comment out
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    LendingController,
    LendingPoliciesController,
    UrutiLendingWebhookController,
    UrutiLendingAdminController,
  ],
  providers: [
    LendingService,
    LendingPoliciesService,
    RiskAssessmentService,
    AutoLoanGeneratorService,
    LenderAnalyticsService,
    RepaymentProcessorService,
    UrutiLendingIntegrationService,
    LoanNotificationService,
    LoanEventListener,
    {
      provide: APP_FILTER,
      useClass: LendingExceptionFilter,
    },
  ],
  exports: [
    LendingService,
    LendingPoliciesService,
    RiskAssessmentService,
    AutoLoanGeneratorService,
    LenderAnalyticsService,
    RepaymentProcessorService,
    UrutiLendingIntegrationService,
    LoanNotificationService,
  ],
})
export class LendingModule {}
