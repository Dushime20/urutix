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

// Financial entities
import { Invoice, InvoiceItem } from '../modules/financial/entities/invoice.entity';
import { Expense } from '../modules/financial/entities/expense.entity';
import { FinancialReport } from '../modules/financial/entities/financial-report.entity';
import { Budget } from '../modules/financial/entities/budget.entity';
import { TaxRecord } from '../modules/financial/entities/tax-record.entity';

// Unified Document and Notification entities
import { Document } from '../entities/document.entity';
import { Notification } from '../entities/notification.entity';

import { config } from 'dotenv';
config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'urutix',
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
  ],
  synchronize: false,
  autoLoadEntities: false,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT) || 5432,
  username: process.env.TEST_DB_USERNAME || 'postgres',
  password: process.env.TEST_DB_PASSWORD || '123',
  database: process.env.TEST_DB_NAME || 'urutix_test',
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
  ],
  synchronize: true,
  autoLoadEntities: false,
  logging: false,
};
