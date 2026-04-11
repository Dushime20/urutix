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

async function resetDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('');

    // Delete data in correct order (respecting foreign keys)
    const tables = [
      'credit_transactions',
      'credit_accounts',
      'credit_marketplace_settings',
      'tenant_subscriptions',
      'subscription_payments',
      'partner_plans',
      'bids',
      'load_auctions',
      'cargo',
      'trucks',
      'user_profiles',
      'users',
      'tenants',
    ];

    console.log('🗑️  Deleting data from tables...\n');

    // Disable foreign key checks temporarily
    await AppDataSource.query('SET session_replication_role = replica;');

    for (const table of tables) {
      try {
        const result = await AppDataSource.query(`DELETE FROM ${table}`);
        console.log(`   ✓ Cleared ${table}`);
      } catch (error) {
        console.log(`   ⚠️  Skipped ${table} (${error.message})`);
      }
    }

    // Re-enable foreign key checks
    await AppDataSource.query('SET session_replication_role = DEFAULT;');

    console.log('');
    console.log('✅ Database reset complete!');
    console.log('');
    console.log('Next step: Run the seed script');
    console.log('   node seed-database.js');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetDatabase();
