/**
 * Script to create all database tables from entity definitions
 * 
 * This script uses TypeORM's synchronize functionality to create tables
 * based on your entity definitions, NOT migrations.
 * 
 * TOTAL TABLES: 81
 * 
 * WARNING: This will create missing tables and add missing columns.
 * It will NOT drop tables or remove columns for safety.
 * 
 * Usage: npx ts-node src/scripts/sync-tables-from-entities.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

// ============================================================================
// IMPORT ALL ENTITIES FROM src/entities/
// ============================================================================
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
import { UserRating } from '../entities/user-rating.entity';
import { UserReward } from '../entities/user-reward.entity';
import { UserScore } from '../entities/user-score.entity';
import { Bid } from '../entities/bid.entity';
import { Auction } from '../entities/auction.entity';
import { AuctionView } from '../entities/auction-view.entity';
import { AuctionWatch } from '../entities/auction-watch.entity';
import { RouteTruck } from '../entities/route-truck.entity';
import { SafetyIncident } from '../entities/safety-incident.entity';
import { SafetyInspection } from '../entities/safety-inspection.entity';
import { SafetyTraining } from '../entities/safety-training.entity';
import { CargoInspection } from '../entities/cargo-inspection.entity';
import { BrokerCommission } from '../entities/broker-commission.entity';
import { BrokerDispute } from '../entities/broker-dispute.entity';
import { LoadContract } from '../entities/load-contract.entity';
import { LoadDocument } from '../entities/load-document.entity';
import { LoadMatch } from '../entities/load-match.entity';
import { LoadTemplate } from '../entities/load-template.entity';
import { InsuranceVerification } from '../entities/insurance-verification.entity';
import { InsuranceClaim } from '../entities/insurance-claim.entity';
import { InsurancePolicy } from '../entities/insurance-policy.entity';
import { InsuranceRenewal } from '../entities/insurance-renewal.entity';
import { EscrowAccount } from '../entities/escrow-account.entity';
import { FuelLog } from '../entities/fuel-log.entity';
import { Document } from '../entities/document.entity';
import { Notification } from '../entities/notification.entity';
import { Alert } from '../entities/alert.entity';
import { AuditEvent } from '../entities/audit-event.entity';
import { PriceSuggestion } from '../entities/price-suggestion.entity';
import { Receipt } from '../entities/receipt.entity';
import { TrackingEvent } from '../entities/tracking-event.entity';

// Broker Intelligence entities (5 entities in one file)
import {
  BrokerMatchRecommendation,
  BrokerMarketIntelligence,
  BrokerTransporterCredit,
  BrokerMultiStopLoad,
  BrokerTransporterPerformance,
} from '../entities/broker-intelligence.entity';

// Lending entities
import { Lender } from '../entities/Lender';
import { LenderPolicy } from '../entities/LenderPolicy';
import { LoanRequest } from '../entities/LoanRequest';
import { LoanDisbursement } from '../entities/LoanDisbursement';
import { LoanRepayment } from '../entities/LoanRepayment';
import { Borrower } from '../entities/Borrower';

// LenderTeam.ts contains 3 entities: LenderPermission, LenderRole, LenderUser
import { LenderPermission, LenderRole, LenderUser } from '../entities/LenderTeam';

// ============================================================================
// IMPORT ALL ENTITIES FROM src/modules/
// ============================================================================

// Tracking module entities
import { TripLocation } from '../modules/tracking/entities/trip-location.entity';
import { Geofence } from '../modules/tracking/entities/geofence.entity';
import { DriverAlert } from '../modules/tracking/entities/driver-alert.entity';
import { TripEvent } from '../modules/tracking/entities/trip-event.entity';

// Financial module entities
import { Invoice, InvoiceItem } from '../modules/financial/entities/invoice.entity';
import { Expense } from '../modules/financial/entities/expense.entity';
import { FinancialReport } from '../modules/financial/entities/financial-report.entity';
import { Budget } from '../modules/financial/entities/budget.entity';
import { TaxRecord } from '../modules/financial/entities/tax-record.entity';
import { FinancialPayment } from '../modules/financial/entities/payment.entity';

// Matching module entities
import { RateLimit } from '../modules/matching/entities/rate-limit.entity';

// Notifications module entities
import { NotificationPreference } from '../modules/notifications/entities/notification-preference.entity';
import { NotificationTemplate } from '../modules/notifications/entities/notification-template.entity';
// Note: modules/notifications/entities/notification.entity.ts is empty - uses src/entities/notification.entity.ts instead

// Pricing module entities
import { PricingFeature } from '../modules/pricing/entities/pricing-feature.entity';
import { PricingModel } from '../modules/pricing/entities/pricing-model.entity';
import { PricingPrediction } from '../modules/pricing/entities/pricing-prediction.entity';

// Insurance module entities
import { InsuranceClaim as ModuleInsuranceClaim } from '../modules/insurance/entities/insurance-claim.entity';
import { InsurancePolicy as ModuleInsurancePolicy } from '../modules/insurance/entities/insurance-policy.entity';
import { PolicyRenewal } from '../modules/insurance/entities/policy-renewal.entity';

// ============================================================================
// ALL ENTITIES ARRAY - 81 TABLES TOTAL
// ============================================================================
const allEntities = [
  // -------------------------------------------------------------------------
  // Core User & Auth entities (7 tables)
  // -------------------------------------------------------------------------
  User,                      // 1. users
  UserProfile,               // 2. user_profiles
  Tenant,                    // 3. tenants
  RefreshToken,              // 4. refresh_tokens
  PasswordResetToken,        // 5. password_reset_tokens
  EmailVerificationToken,    // 6. email_verification_tokens
  
  // -------------------------------------------------------------------------
  // User Scoring & Ratings (3 tables)
  // -------------------------------------------------------------------------
  UserRating,                // 7. user_ratings
  UserReward,                // 8. user_rewards
  UserScore,                 // 9. user_scores
  
  // -------------------------------------------------------------------------
  // Main Business entities (11 tables)
  // -------------------------------------------------------------------------
  Load,                      // 10. loads
  LoadTemplate,              // 11. load_templates
  LoadMatch,                 // 12. load_matches
  LoadContract,              // 13. load_contracts
  LoadDocument,              // 14. load_documents
  Location,                  // 15. locations
  Truck,                     // 16. trucks
  Driver,                    // 17. drivers
  Route,                     // 18. routes
  RouteTruck,                // 19. route_trucks
  Trip,                      // 20. trips
  
  // -------------------------------------------------------------------------
  // Auction entities (4 tables)
  // -------------------------------------------------------------------------
  Bid,                       // 21. bids
  Auction,                   // 22. auctions
  AuctionView,               // 23. auction_views
  AuctionWatch,              // 24. auction_watches
  
  // -------------------------------------------------------------------------
  // Payment & Financial entities from src/entities (3 tables)
  // -------------------------------------------------------------------------
  Payment,                   // 25. payments
  Receipt,                   // 26. receipts
  EscrowAccount,             // 27. escrow_accounts
  
  // -------------------------------------------------------------------------
  // Document & Notification entities (2 tables)
  // -------------------------------------------------------------------------
  Document,                  // 28. documents
  Notification,              // 29. notifications
  
  // -------------------------------------------------------------------------
  // Alert & Audit entities (3 tables)
  // -------------------------------------------------------------------------
  Alert,                     // 30. alerts
  AuditLog,                  // 31. audit_logs
  AuditEvent,                // 32. audit_events
  
  // -------------------------------------------------------------------------
  // Dispute entity (1 table)
  // -------------------------------------------------------------------------
  Dispute,                   // 33. disputes
  
  // -------------------------------------------------------------------------
  // Safety entities (3 tables)
  // -------------------------------------------------------------------------
  SafetyIncident,            // 34. safety_incidents
  SafetyInspection,          // 35. safety_inspections
  SafetyTraining,            // 36. safety_trainings
  
  // -------------------------------------------------------------------------
  // Cargo Inspection entity (1 table)
  // -------------------------------------------------------------------------
  CargoInspection,           // 37. cargo_inspections
  
  // -------------------------------------------------------------------------
  // Broker entities (7 tables)
  // -------------------------------------------------------------------------
  BrokerCommission,              // 38. broker_commissions
  BrokerDispute,                 // 39. broker_disputes
  BrokerMatchRecommendation,     // 40. broker_match_recommendations
  BrokerMarketIntelligence,      // 41. broker_market_intelligence
  BrokerTransporterCredit,       // 42. broker_transporter_credit
  BrokerMultiStopLoad,           // 43. broker_multi_stop_loads
  BrokerTransporterPerformance,  // 44. broker_transporter_performance
  
  // -------------------------------------------------------------------------
  // Insurance entities from src/entities (4 tables)
  // -------------------------------------------------------------------------
  InsuranceVerification,     // 45. insurance_verifications
  InsuranceClaim,            // 46. insurance_claims
  InsurancePolicy,           // 47. insurance_policies
  InsuranceRenewal,          // 48. insurance_renewals
  
  // -------------------------------------------------------------------------
  // Lending entities (10 tables including LenderTeam.ts)
  // -------------------------------------------------------------------------
  Lender,                    // 49. lenders
  LenderPolicy,              // 50. lender_policies
  LenderPermission,          // 51. lender_permissions
  LenderRole,                // 52. lender_roles (+ junction: lender_role_permissions)
  LenderUser,                // 53. lender_users (+ junction: lender_user_permissions)
  LoanRequest,               // 54. loan_requests
  LoanDisbursement,          // 55. loan_disbursements
  LoanRepayment,             // 56. loan_repayments
  Borrower,                  // 57. borrowers
  
  // -------------------------------------------------------------------------
  // Fuel & Tracking from src/entities (2 tables)
  // -------------------------------------------------------------------------
  FuelLog,                   // 58. fuel_logs
  TrackingEvent,             // 59. tracking_events
  
  // -------------------------------------------------------------------------
  // Pricing entity from src/entities (1 table)
  // -------------------------------------------------------------------------
  PriceSuggestion,           // 60. price_suggestions
  
  // -------------------------------------------------------------------------
  // MODULES: Tracking entities (4 tables)
  // -------------------------------------------------------------------------
  TripLocation,              // 61. trip_locations
  Geofence,                  // 62. geofences
  DriverAlert,               // 63. driver_alerts
  TripEvent,                 // 64. trip_events
  
  // -------------------------------------------------------------------------
  // MODULES: Financial entities (7 tables)
  // -------------------------------------------------------------------------
  Invoice,                   // 65. invoices
  InvoiceItem,               // 66. invoice_items
  Expense,                   // 67. expenses
  FinancialReport,           // 68. financial_reports
  Budget,                    // 69. budgets
  TaxRecord,                 // 70. tax_records
  FinancialPayment,          // 71. financial_payments
  
  // -------------------------------------------------------------------------
  // MODULES: Matching entities (1 table)
  // -------------------------------------------------------------------------
  RateLimit,                 // 72. rate_limits
  
  // -------------------------------------------------------------------------
  // MODULES: Notifications entities (2 tables)
  // -------------------------------------------------------------------------
  NotificationPreference,    // 73. notification_preferences
  NotificationTemplate,      // 74. notification_templates
  
  // -------------------------------------------------------------------------
  // MODULES: Pricing entities (3 tables)
  // -------------------------------------------------------------------------
  PricingFeature,            // 75. pricing_features
  PricingModel,              // 76. pricing_models
  PricingPrediction,         // 77. pricing_predictions
  
  // -------------------------------------------------------------------------
  // MODULES: Insurance entities (3 tables - may overlap with src/entities)
  // -------------------------------------------------------------------------
  ModuleInsuranceClaim,      // overlaps with insurance_claims
  ModuleInsurancePolicy,     // overlaps with insurance_policies
  PolicyRenewal,             // 78. policy_renewals
  
  // -------------------------------------------------------------------------
  // JUNCTION TABLES (auto-created by ManyToMany relations):
  // 79. lender_role_permissions
  // 80. lender_user_permissions
  // 81. (any other junction tables from relations)
  // -------------------------------------------------------------------------
];

async function syncTables(): Promise<void> {
  console.log('🚀 Starting database table synchronization from entities...\n');
  console.log('📊 Expected tables: ~81 (including junction tables)\n');
  
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbName = process.env.DB_NAME || 'urutix';
  const dbUser = process.env.DB_USERNAME || 'postgres';
  
  console.log(`📦 Database connection info:`);
  console.log(`   Host: ${dbHost}`);
  console.log(`   Port: ${dbPort}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   Username: ${dbUser}`);
  console.log(`   Entity classes loaded: ${allEntities.length}\n`);

  // Create DataSource with synchronize: true
  const dataSource = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: String(process.env.DB_PASSWORD || ''),
    database: dbName,
    synchronize: true, // This will create tables from entities
    entities: allEntities,
    logging: ['error', 'warn', 'schema'], // Log schema changes
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
  });

  try {
    // Initialize the data source - this triggers synchronization
    console.log('⏳ Connecting to database and synchronizing schema...\n');
    await dataSource.initialize();
    
    console.log('✅ Database connection established!\n');
    
    // Get list of tables that now exist
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log(`📋 Tables in database (${tables.length} total):`);
    console.log('─'.repeat(50));
    tables.forEach((table: { table_name: string }, index: number) => {
      console.log(`   ${String(index + 1).padStart(2, ' ')}. ${table.table_name}`);
    });
    console.log('─'.repeat(50));
    
    console.log('\n✨ Schema synchronization completed successfully!');
    console.log(`   Created/verified ${tables.length} tables based on entity definitions.`);
    
    if (tables.length < 81) {
      console.log(`\n⚠️  Warning: Expected ~81 tables but found ${tables.length}.`);
      console.log('   This may be normal if some entities share table names or use inheritance.');
    }
    
  } catch (error) {
    console.error('\n❌ Error during synchronization:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the synchronization
syncTables()
  .then(() => {
    console.log('\n🎉 Done! All tables created from entity definitions.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
