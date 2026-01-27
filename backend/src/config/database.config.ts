import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';


import { UserProfile } from '../entities/user-profile.entity';
import { Load } from '../entities/load.entity';
import { Location } from '../entities/location.entity';
import { Truck } from '../entities/truck.entity';
import { Driver } from '../entities/driver.entity';
import { Route } from '../entities/route.entity';
import { Trip } from '../entities/trip.entity';
import { Payment } from '../entities/payment.entity';
import { Tenant } from '../entities/tenant.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { Dispute } from '../entities/dispute.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { TripLocation } from '../modules/tracking/entities/trip-location.entity';
import { Geofence } from '../modules/tracking/entities/geofence.entity';
import { DriverAlert } from '../modules/tracking/entities/driver-alert.entity';
import { TripEvent } from '../modules/tracking/entities/trip-event.entity';
import { UserRating } from '../entities/user-rating.entity';
import { UserReward } from '../entities/user-reward.entity';
import { UserScore } from '../entities/user-score.entity';
import { Bid } from '../entities/bid.entity';
import { Auction } from '../entities/auction.entity';
import { Lender } from '../entities/Lender';
import { LenderPolicy } from '../entities/LenderPolicy';
import { LoanRequest } from '../entities/LoanRequest';
import { LoanDisbursement } from '../entities/LoanDisbursement';
import { LoanRepayment } from '../entities/LoanRepayment';
import { Borrower } from '../entities/Borrower';
import { RouteTruck } from '../entities/route-truck.entity';
import { AuctionView } from '../entities/auction-view.entity';
import { AuctionWatch } from '../entities/auction-watch.entity';
import { SafetyIncident } from '../entities/safety-incident.entity';
import { SafetyInspection } from '../entities/safety-inspection.entity';
import { SafetyTraining } from '../entities/safety-training.entity';
import { CargoInspection } from '../entities/cargo-inspection.entity';
import { BrokerCommission } from '../entities/broker-commission.entity';
import { LoadContract } from '../entities/load-contract.entity';
import { InsuranceVerification } from '../entities/insurance-verification.entity';
import { BrokerDispute } from '../entities/broker-dispute.entity';
import { EscrowAccount } from '../entities/escrow-account.entity';
import { LoadDocument } from '../entities/load-document.entity';
import { LoadMatch } from '../entities/load-match.entity';
import {
  BrokerMatchRecommendation,
  BrokerMarketIntelligence,
  BrokerTransporterCredit,
  BrokerMultiStopLoad,
  BrokerTransporterPerformance,
} from '../entities/broker-intelligence.entity';
import { FuelLog } from '../entities/fuel-log.entity';


// Financial entities
import {
  Invoice,
  InvoiceItem,
} from '../modules/financial/entities/invoice.entity';
import { Expense } from '../modules/financial/entities/expense.entity';
import { FinancialReport } from '../modules/financial/entities/financial-report.entity';
import { Budget } from '../modules/financial/entities/budget.entity';
import { TaxRecord } from '../modules/financial/entities/tax-record.entity';

// Unified Document and Notification entities
import { Document } from '../entities/document.entity';
import { Notification } from '../entities/notification.entity';

import { config } from 'dotenv';
config();

/**
 * Main database configuration for the application.
 * 
 * Required environment variables:
 * - DB_HOST: Database host (default: 'localhost')
 * - DB_PORT: Database port (default: 5432)
 * - DB_USERNAME: Database username (default: 'postgres')
 * - DB_PASSWORD: Database password (required, no default)
 * - DB_NAME: Database name (default: 'urutix')
 * 
 * Note: DB_PASSWORD should always be set via environment variable for security.
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  migrationsRun: false,
  entities: [
    User,
    UserProfile,
    Load,
    Location,
    Truck,
    Driver,
    Route,
    Trip,
    Payment,
    Tenant,
    RefreshToken,
    PasswordResetToken,
    EmailVerificationToken,
    Dispute,
    AuditLog,
    TripLocation,
    Geofence,
    DriverAlert,
    TripEvent,
    UserRating,
    UserReward,
    UserScore,
    Bid,
    Auction,
    AuctionView,
    AuctionWatch,
    Lender,
    LenderPolicy,
    LoanRequest,
    LoanDisbursement,
    LoanRepayment,
    Borrower,
    RouteTruck,
    // Financial entities
    Invoice,
    InvoiceItem,
    Expense,
    FinancialReport,
    Budget,
    TaxRecord,
    // Unified Document and Notification entities
    Document,
    Notification,
    // Safety entities
    SafetyIncident,
    SafetyInspection,
    SafetyTraining,
    // Receiver entities
    CargoInspection,
    // Broker entities
    BrokerCommission,
    LoadContract,
    InsuranceVerification,
    BrokerDispute,
    EscrowAccount,
    LoadDocument,
    // Broker Intelligence entities
    BrokerMatchRecommendation,
    BrokerMarketIntelligence,
    BrokerTransporterCredit,
    BrokerMultiStopLoad,
    BrokerTransporterPerformance,
    // Matching entities
    LoadMatch,
    // Fuel entities
    FuelLog,

  ],
  synchronize: true,
  autoLoadEntities: false,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

/**
 * Test database configuration.
 * 
 * Uses separate environment variables with TEST_ prefix:
 * - TEST_DB_HOST, TEST_DB_PORT, TEST_DB_USERNAME, TEST_DB_PASSWORD, TEST_DB_NAME
 * 
 * Note: synchronize is set to true for testing purposes only.
 */
export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
  username: process.env.TEST_DB_USERNAME || 'postgres',
  password: String(process.env.TEST_DB_PASSWORD || ''),
  database: process.env.TEST_DB_NAME || 'urutix_test',
  migrationsRun: false,
  entities: [
    User,
    UserProfile,
    Load,
    Location,
    Truck,
    Driver,
    Route,
    Trip,
    Payment,
    Tenant,
    RefreshToken,
    PasswordResetToken,
    EmailVerificationToken,
    Dispute,
    AuditLog,
    TripLocation,
    Geofence,
    DriverAlert,
    TripEvent,
    UserRating,
    UserReward,
    UserScore,
    Bid,
    Auction,
    AuctionView,
    AuctionWatch,
    Lender,
    LenderPolicy,
    LoanRequest,
    LoanDisbursement,
    LoanRepayment,
    Borrower,
    RouteTruck,
    // Financial entities
    Invoice,
    InvoiceItem,
    Expense,
    FinancialReport,
    Budget,
    TaxRecord,
    // Unified Document and Notification entities
    Document,
    Notification,
    // Safety entities
    SafetyIncident,
    SafetyInspection,
    SafetyTraining,
    // Broker entities
    BrokerCommission,
    LoadContract,
    InsuranceVerification,
    BrokerDispute,
    EscrowAccount,
    LoadDocument,
    // Broker Intelligence entities
    BrokerMatchRecommendation,
    BrokerMarketIntelligence,
    BrokerTransporterCredit,
    BrokerMultiStopLoad,
    BrokerTransporterPerformance,
    // Fuel entities
    FuelLog,
  ],
  synchronize: true,
  autoLoadEntities: false,
  logging: false,
};
