/**
 * database.config.ts
 *
 * Production-grade TypeORM configuration.
 *
 * Design decisions:
 *  - synchronize is ALWAYS false in production — migrations are the only way
 *    schema changes reach the database.
 *  - autoLoadEntities is false — every entity is explicitly listed so that a
 *    missing registration causes a startup error rather than a silent runtime
 *    failure at query time.
 *  - Connection pool is tuned for a containerised API under moderate load.
 *    Override via DB_POOL_* env vars if you need different values.
 *  - SSL is opt-in via DB_SSL=true (e.g. managed Postgres on render/aws).
 *  - Query logging is structured: only slow queries (> DB_SLOW_QUERY_MS ms)
 *    are logged in production so the log stream stays actionable.
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// ── Core domain entities ────────────────────────────────────────────────────
import { User }                   from './../entities/user.entity';
import { UserProfile }            from './../entities/user-profile.entity';
import { UserSession }            from './../entities/user-session.entity';
import { UserRating }             from './../entities/user-rating.entity';
import { UserReward }             from './../entities/user-reward.entity';
import { UserScore }              from './../entities/user-score.entity';
import { UserPermissionOverride } from './../entities/user-permission-override.entity';

import { Tenant }           from './../entities/tenant.entity';
import { TenantSubscription } from './../entities/tenant-subscription.entity';

import { RefreshToken }          from './../entities/refresh-token.entity';
import { PasswordResetToken }    from './../entities/password-reset-token.entity';
import { EmailVerificationToken } from './../entities/email-verification-token.entity';

// ── RBAC ───────────────────────────────────────────────────────────────────
import { Role }               from './../entities/role.entity';
import { Permission }         from './../entities/permission.entity';

// ── Loads, Trips, Trucks ───────────────────────────────────────────────────
import { Load }         from './../entities/load.entity';
import { LoadDocument } from './../entities/load-document.entity';
import { LoadContract } from './../entities/load-contract.entity';
import { LoadMatch }    from './../entities/load-match.entity';
import { LoadTemplate } from './../entities/load-template.entity';

import { Location } from './../entities/location.entity';
import { Route }    from './../entities/route.entity';
import { RouteTruck } from './../entities/route-truck.entity';

import { Trip }    from './../entities/trip.entity';
import { Driver }  from './../entities/driver.entity';
import { Truck }   from './../entities/truck.entity';

import { Epod }            from './../entities/epod.entity';
import { ShipmentReservation } from './../entities/shipment-reservation.entity';
import { CargoInspection } from './../entities/cargo-inspection.entity';
import { DistributionCampaign } from './../entities/distribution-campaign.entity';
import { CapacityOffer } from './../entities/capacity-offer.entity';
import { CapacityBooking } from './../entities/capacity-booking.entity';

// ── Payments ───────────────────────────────────────────────────────────────
import { Payment }         from './../entities/payment.entity';
import { PaymentAuditLog } from './../entities/payment-audit-log.entity';
import { Receipt }         from './../entities/receipt.entity';
import { EscrowAccount }   from './../entities/escrow-account.entity';
import { SubscriptionPayment } from './../entities/subscription-payment.entity';

// ── Bidding & Auctions ─────────────────────────────────────────────────────
import { Bid }          from './../entities/bid.entity';
import { Auction }      from './../entities/auction.entity';
import { AuctionView }  from './../entities/auction-view.entity';
import { AuctionWatch } from './../entities/auction-watch.entity';

// ── Lending ────────────────────────────────────────────────────────────────
import { Lender }          from './../entities/lender.entity';
import { LenderPolicy }    from './../entities/lender-policy.entity';
import { LoanRequest }     from './../entities/loan-request.entity';
import { LoanDisbursement } from './../entities/loan-disbursement.entity';
import { LoanRepayment }   from './../entities/loan-repayment.entity';
import { LoanTerms }       from './../entities/loan-terms.entity';
import { Borrower }        from './../entities/borrower.entity';
import { LenderUser, LenderRole, LenderPermission } from './../entities/lender-team.entity';
import { LendingPolicyInterestRate }    from './../entities/lending-policy-interest-rate.entity';
import { LendingPolicyLoanLimit }       from './../entities/lending-policy-loan-limit.entity';
import { LendingPolicyEligibility }     from './../entities/lending-policy-eligibility.entity';
import { LendingPolicyRiskAssessment }  from './../entities/lending-policy-risk-assessment.entity';
import { LendingPolicyRepayment }       from './../entities/lending-policy-repayment.entity';
import { LendingPolicyCargoType }       from './../entities/lending-policy-cargo-type.entity';
import { LendingPolicySystemConfig }    from './../entities/lending-policy-system-config.entity';

// ── Financial ─────────────────────────────────────────────────────────────
import { Invoice, InvoiceItem } from './../modules/financial/entities/invoice.entity';
import { Expense }          from './../modules/financial/entities/expense.entity';
import { FinancialReport }  from './../modules/financial/entities/financial-report.entity';
import { Budget }           from './../modules/financial/entities/budget.entity';
import { TaxRecord }        from './../modules/financial/entities/tax-record.entity';

// ── Subscriptions & Credits ────────────────────────────────────────────────
import { SubscriptionPlan }         from './../entities/subscription-plan.entity';
import { CreditAccount }            from './../entities/credit-account.entity';
import { CreditPackage }            from './../entities/credit-package.entity';
import { CreditPricingRule }        from './../entities/credit-pricing-rule.entity';
import { CreditTransaction }        from './../entities/credit-transaction.entity';
import { CreditMarketplaceSettings } from './../entities/credit-marketplace-settings.entity';
import { FeatureCreditCost }        from './../entities/feature-credit-cost.entity';

// ── Tracking ───────────────────────────────────────────────────────────────
import { TripLocation } from './../modules/tracking/entities/trip-location.entity';
import { Geofence }     from './../modules/tracking/entities/geofence.entity';
import { DriverAlert }  from './../modules/tracking/entities/driver-alert.entity';
import { TripEvent }    from './../modules/tracking/entities/trip-event.entity';

// ── Safety ─────────────────────────────────────────────────────────────────
import { SafetyIncident }   from './../entities/safety-incident.entity';
import { SafetyInspection } from './../entities/safety-inspection.entity';
import { SafetyTraining }   from './../entities/safety-training.entity';

// ── Brokers ────────────────────────────────────────────────────────────────
import { BrokerCommission } from './../entities/broker-commission.entity';
import { BrokerDispute }    from './../entities/broker-dispute.entity';
import { InsuranceVerification } from './../entities/insurance-verification.entity';
import {
  BrokerMatchRecommendation,
  BrokerMarketIntelligence,
  BrokerTransporterCredit,
  BrokerMultiStopLoad,
  BrokerTransporterPerformance,
} from './../entities/broker-intelligence.entity';

// ── Fuel & Maintenance ─────────────────────────────────────────────────────
import { FuelLog }              from './../entities/fuel-log.entity';
import { FuelWallet }           from './../entities/fuel-wallet.entity';
import { FuelWalletTransaction } from './../entities/fuel-wallet-transaction.entity';
import { FuelBudget }           from './../entities/fuel-budget.entity';
import { DriverFuelAdvance }    from './../entities/driver-fuel-advance.entity';
import { MaintenanceLog }       from './../entities/maintenance-log.entity';

// ── Disputes & Support ─────────────────────────────────────────────────────
import { Dispute } from './../entities/dispute.entity';
import {
  DisputeV2,
  DisputeMessage,
  DisputeAttachment,
  DisputeResolutionRecord,
  DisputeAuditLog,
  DisputeAssignment,
  DisputeEscalation,
} from './../entities/dispute-v2.entity';

// ── Notifications, Messaging & Analytics ───────────────────────────────────
import { Notification }          from './../entities/notification.entity';
import { NotificationPreference } from './../entities/notification-preference.entity';
import { NotificationLog }       from './../entities/notification-log.entity';
import { Message }               from './../entities/message.entity';
import { CargoOwnerAnalytics }   from './../entities/cargo-owner-analytics.entity';
import { AnalyticsInsights }     from './../entities/analytics-insights.entity';

// ── Currency & Exchange ────────────────────────────────────────────────────
import { Currency }     from './../entities/currency.entity';
import { ExchangeRate } from './../entities/exchange-rate.entity';

// ── Documents & Shared ─────────────────────────────────────────────────────
import { Document }    from './../entities/document.entity';
import { EmailTemplate } from './../entities/email-template.entity';
import { BulkEmailLog }  from './../entities/bulk-email-log.entity';

// ── Customs ────────────────────────────────────────────────────────────────
import { CustomsInspection } from './../entities/customs-inspection.entity';
import { CustomsCheckpoint } from './../entities/customs-checkpoint.entity';

import {
  ParkingFacilityConfig,
  ParkingFeeSchedule,
  ParkingReservation,
  ParkingReservationActivity,
  ParkingReservationSequence,
} from './../entities/parking-reservation.entity';

// ── System / Infrastructure ────────────────────────────────────────────────
import { AuditLog }       from './../entities/audit-log.entity';
import { AuditEvent }     from './../entities/audit-event.entity';
import { ActivityLog }    from './../entities/activity-log.entity';
import { SystemSettings } from './../entities/system-settings.entity';
import { SecurityEvent }  from './../entities/security-event.entity';
import { SystemHealthLog } from './../entities/system-health.entity';
import { Alert }          from './../entities/alert.entity';

// ─────────────────────────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === 'production';

/**
 * All entities registered with TypeORM.
 * Every entity the application uses MUST appear here.  A missing entry causes
 * TypeORM to fail at startup with "Entity metadata for X was not found", which
 * is far preferable to a silent runtime error when the entity is first queried.
 */
export const ALL_ENTITIES = [
  // Auth & Users
  User, UserProfile, UserSession, UserRating, UserReward, UserScore,
  UserPermissionOverride,
  Tenant, TenantSubscription,
  RefreshToken, PasswordResetToken, EmailVerificationToken,
  // RBAC
  Role, Permission,
  // Loads / Trips / Trucks
  Load, LoadDocument, LoadContract, LoadMatch, LoadTemplate,
  Location, Route, RouteTruck,
  Trip, Driver, Truck,
  Epod, ShipmentReservation, CargoInspection, DistributionCampaign,
  CapacityOffer, CapacityBooking,
  // Payments
  Payment, PaymentAuditLog, Receipt, EscrowAccount, SubscriptionPayment,
  // Bidding & Auctions
  Bid, Auction, AuctionView, AuctionWatch,
  // Lending
  Lender, LenderPolicy, LoanRequest, LoanDisbursement, LoanRepayment,
  LoanTerms, Borrower,
  LenderUser, LenderRole, LenderPermission,
  LendingPolicyInterestRate, LendingPolicyLoanLimit, LendingPolicyEligibility,
  LendingPolicyRiskAssessment, LendingPolicyRepayment, LendingPolicyCargoType,
  LendingPolicySystemConfig,
  // Financial
  Invoice, InvoiceItem, Expense, FinancialReport, Budget, TaxRecord,
  // Subscriptions & Credits
  SubscriptionPlan,
  CreditAccount, CreditPackage, CreditPricingRule, CreditTransaction,
  CreditMarketplaceSettings, FeatureCreditCost,
  // Tracking
  TripLocation, Geofence, DriverAlert, TripEvent,
  // Safety
  SafetyIncident, SafetyInspection, SafetyTraining,
  // Brokers
  BrokerCommission, BrokerDispute, InsuranceVerification,
  BrokerMatchRecommendation, BrokerMarketIntelligence, BrokerTransporterCredit,
  BrokerMultiStopLoad, BrokerTransporterPerformance,
  // Fuel & Maintenance
  FuelLog, FuelWallet, FuelWalletTransaction, FuelBudget, DriverFuelAdvance,
  MaintenanceLog,
  // Disputes & Support
  Dispute,
  DisputeV2, DisputeMessage, DisputeAttachment, DisputeResolutionRecord,
  DisputeAuditLog, DisputeAssignment, DisputeEscalation,
  // Notifications & Messaging
  Notification, NotificationPreference, NotificationLog,
  Message,
  // Analytics
  CargoOwnerAnalytics, AnalyticsInsights,
  // Currency
  Currency, ExchangeRate,
  // Documents & Email
  Document, EmailTemplate, BulkEmailLog,
  // Customs
  CustomsInspection, CustomsCheckpoint,
  // Parking
  ParkingReservation, ParkingReservationActivity, ParkingFacilityConfig, ParkingReservationSequence, ParkingFeeSchedule,
  // System
  AuditLog, AuditEvent, ActivityLog,
  SystemSettings, SecurityEvent, SystemHealthLog, Alert,
];

/** Connection-pool sizing pulled from env with sensible production defaults. */
const poolSize = {
  max: parseInt(process.env.DB_POOL_MAX  ?? '20', 10),
  min: parseInt(process.env.DB_POOL_MIN  ?? '5',  10),
  // Milliseconds a connection can sit idle before being released
  idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? '30000', 10),
  // Milliseconds to wait for a connection before throwing
  acquireTimeout: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT_MS ?? '10000', 10),
};

/** Slow query threshold — log queries slower than this in production. */
const slowQueryMs = parseInt(process.env.DB_SLOW_QUERY_MS ?? '2000', 10);

/**
 * Main (production/development) database configuration.
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME     ?? 'urutix',

  // ── Schema management ────────────────────────────────────────────────────
  // NEVER auto-synchronize in production — schema changes go through migrations.
  synchronize:    false,
  migrationsRun:  false,
  autoLoadEntities: false,

  // ── Entities ────────────────────────────────────────────────────────────
  entities: ALL_ENTITIES,

  // ── Connection pool ──────────────────────────────────────────────────────
  // extra.max / min are passed through to the underlying `pg` pool.
  extra: {
    max:              poolSize.max,
    min:              poolSize.min,
    idleTimeoutMillis:    poolSize.idleTimeout,
    connectionTimeoutMillis: poolSize.acquireTimeout,
    // Keep connections alive across idle periods.
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  },

  // ── Retries on initial connection (TypeORM built-in) ────────────────────
  retryAttempts:  10,
  retryDelay:     3000,

  // ── SSL ──────────────────────────────────────────────────────────────────
  // Set DB_SSL=true for managed Postgres (Render, RDS, Supabase, etc.).
  // rejectUnauthorized=false allows self-signed certs; set DB_SSL_REJECT_UNAUTHORIZED=true
  // when you control the CA.
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
    : false,

  // ── Logging ──────────────────────────────────────────────────────────────
  // In production: log only slow queries and errors.
  // In development: log all queries.
  logging: isProduction ? ['error', 'warn', 'migration'] : ['query', 'error', 'warn', 'migration'],
  maxQueryExecutionTime: isProduction ? slowQueryMs : undefined,

  // ── Cache ─────────────────────────────────────────────────────────────────
  // Disabled by default; enable by pointing TYPEORM_CACHE_TYPE at Redis.
  cache: false,
};

/**
 * Test database configuration.
 * Uses synchronize:true so Jest creates a fresh schema without migrations.
 * Never used in production.
 */
export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host:     process.env.TEST_DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.TEST_DB_PORT ?? '5432', 10),
  username: process.env.TEST_DB_USERNAME ?? 'postgres',
  password: process.env.TEST_DB_PASSWORD ?? '',
  database: process.env.TEST_DB_NAME     ?? 'urutix_test',
  synchronize:      true,
  migrationsRun:    false,
  autoLoadEntities: false,
  entities: ALL_ENTITIES,
  logging:  false,
  dropSchema: process.env.TEST_DB_DROP_SCHEMA === 'true',
};
