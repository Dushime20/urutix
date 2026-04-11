const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
});

async function resetExceptUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    console.log('⚠️  WARNING: This will delete ALL data EXCEPT users and user_profiles!');
    console.log('');

    // Tables to clear (excluding users, user_profiles, and tenants)
    const tablesToClear = [
      'credit_transactions',
      'credit_accounts',
      'credit_marketplace_settings',
      'tenant_subscriptions',
      'subscription_payments',
      'subscription_plans',
      'bids',
      'auctions',
      'loads',
      'trips',
      'trucks',
      'drivers',
      'notifications',
      'messages',
      'activity_logs',
      'audit_logs',
      'documents',
      'payments',
      'invoices',
      'invoice_items',
      'expenses',
      'receipts',
      'financial_reports',
      'financial_payments',
      'broker_commissions',
      'load_contracts',
      'load_documents',
      'load_matches',
      'tracking_events',
      'trip_events',
      'trip_locations',
      'route_trucks',
      'routes',
      'locations',
      'geofences',
      'maintenance_logs',
      'fuel_logs',
      'fuel_wallets',
      'fuel_wallet_transactions',
      'driver_fuel_advances',
      'driver_alerts',
      'safety_incidents',
      'safety_inspections',
      'safety_trainings',
      'insurance_policies',
      'insurance_claims',
      'insurance_renewals',
      'insurance_verifications',
      'policy_renewals',
      'cargo_inspections',
      'auction_views',
      'auction_watches',
      'alerts',
      'disputes',
      'appeals',
      'enforcement_actions',
      'risk_flags',
      'user_ratings',
      'user_rewards',
      'user_scores',
      'user_blacklist',
      'refresh_tokens',
      'password_reset_tokens',
      'email_verification_tokens',
      'notification_preferences',
      'notification_templates',
      'system_settings',
      'system_health_logs',
      'rate_limits',
      'permissions',
      'role_permissions',
      'user_permissions',
      'tenant_plans',
      'credit_packages',
      'feature_credit_costs',
      'pricing_models',
      'pricing_features',
      'pricing_predictions',
      'price_suggestions',
      'load_templates',
      'budgets',
      'tax_records',
      'escrow_accounts',
      'lenders',
      'lender_users',
      'lender_roles',
      'lender_permissions',
      'lender_policies',
      'lender_role_permissions',
      'lender_user_permissions',
      'borrowers',
      'loan_requests',
      'loan_disbursements',
      'loan_repayments',
      'broker_disputes',
      'broker_market_intelligence',
      'broker_match_recommendations',
      'broker_multi_stop_loads',
      'broker_transporter_credit',
      'broker_transporter_performance',
    ];

    console.log(`🗑️  Clearing ${tablesToClear.length} tables...\n`);

    // Disable foreign key checks temporarily
    await AppDataSource.query('SET session_replication_role = replica;');

    let successCount = 0;
    let skipCount = 0;

    for (const table of tablesToClear) {
      try {
        await AppDataSource.query(`DELETE FROM ${table}`);
        console.log(`   ✓ Cleared ${table}`);
        successCount++;
      } catch (error) {
        console.log(`   ⚠️  Skipped ${table} (table may not exist)`);
        skipCount++;
      }
    }

    // Re-enable foreign key checks
    await AppDataSource.query('SET session_replication_role = DEFAULT;');

    console.log('');
    console.log('═'.repeat(70));
    console.log(`✅ Database reset complete!`);
    console.log(`   Tables cleared: ${successCount}`);
    console.log(`   Tables skipped: ${skipCount}`);
    console.log('═'.repeat(70));
    console.log('');
    console.log('✅ Users and profiles preserved:');
    
    // Show preserved users
    const users = await AppDataSource.query(`
      SELECT u.email, u.role, up."firstName", up."lastName"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      ORDER BY u.role, u.email
    `);

    users.forEach(user => {
      const name = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'No profile';
      console.log(`   - ${user.email} (${user.role}) - ${name}`);
    });

    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Login as Super Admin and create subscription plans');
    console.log('   3. Login as Tenant Admin and purchase subscriptions');
    console.log('   4. Configure the credit marketplace');
    console.log('   5. Login as Truck Owner and buy credits');
    console.log('   6. Test the complete bidding flow with earning system');
    console.log('');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetExceptUsers();
