import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrokersController } from './brokers.controller';
import { BrokersEnhancedController } from './brokers-enhanced.controller';
import { BrokerIntelligenceController } from './broker-intelligence.controller';
import { BrokersService } from './brokers.service';
import { ContractService } from './services/contract.service';
import { InsuranceVerificationService } from './services/insurance-verification.service';
import { DisputeService } from './services/dispute.service';
import { EscrowService } from './services/escrow.service';
import { DocumentService } from './services/document.service';
import { SmartMatchingService } from './services/smart-matching.service';
import { MarketIntelligenceService } from './services/market-intelligence.service';
import { CreditManagementService } from './services/credit-management.service';
import { MultiStopService } from './services/multi-stop.service';
import { PerformanceAnalyticsService } from './services/performance-analytics.service';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Load } from '../../entities/load.entity';
import { Truck } from '../../entities/truck.entity';
import { Trip } from '../../entities/trip.entity';
import { BrokerCommission } from '../../entities/broker-commission.entity';
import { LoadContract } from '../../entities/load-contract.entity';
import { InsuranceVerification } from '../../entities/insurance-verification.entity';
import { BrokerDispute } from '../../entities/broker-dispute.entity';
import { EscrowAccount } from '../../entities/escrow-account.entity';
import { LoadDocument } from '../../entities/load-document.entity';
import {
  BrokerMatchRecommendation,
  BrokerMarketIntelligence,
  BrokerTransporterCredit,
  BrokerMultiStopLoad,
  BrokerTransporterPerformance,
} from '../../entities/broker-intelligence.entity';
import { TrackingEvent } from '../../entities/tracking-event.entity';
import { Tenant } from '../../entities/tenant.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { EmailService } from '../auth/email.service';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      Load,
      Truck,
      Trip,
      BrokerCommission,
      LoadContract,
      InsuranceVerification,
      BrokerDispute,
      EscrowAccount,
      LoadDocument,
      BrokerMatchRecommendation,
      BrokerMarketIntelligence,
      BrokerTransporterCredit,
      BrokerMultiStopLoad,
      BrokerTransporterPerformance,
      TrackingEvent,
      Tenant,
      PasswordResetToken,
    ]),
    EnhancedAuthModule,
  ],
  controllers: [
    BrokersController,
    BrokersEnhancedController,
    BrokerIntelligenceController,
  ],
  providers: [
    BrokersService,
    ContractService,
    InsuranceVerificationService,
    DisputeService,
    EscrowService,
    DocumentService,
    SmartMatchingService,
    MarketIntelligenceService,
    CreditManagementService,
    MultiStopService,
    PerformanceAnalyticsService,
  ],
  exports: [
    BrokersService,
    ContractService,
    InsuranceVerificationService,
    DisputeService,
    EscrowService,
    DocumentService,
    SmartMatchingService,
    MarketIntelligenceService,
    CreditManagementService,
    MultiStopService,
    PerformanceAnalyticsService,
  ],
})
export class BrokersModule { }

