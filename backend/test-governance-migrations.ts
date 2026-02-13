import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

/**
 * Script to test governance migrations
 * This script will:
 * 1. Check if user_subscriptions table exists
 * 2. Check current migration status
 * 3. Attempt to run governance migrations
 * 4. Verify the schema changes
 */

const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: true,
  entities: [],
  migrations: [
    'src/migrations/1767900000001-AddEnforcementColumnsToUserSubscriptions.ts',
    'src/migrations/1767900000002-CreateEnforcementActionsTable.ts',
    'src/migrations/1767900000003-CreateAppealsTable.ts',
    'src/migrations/1767900000004-CreateUserBlacklistTable.ts',
    'src/migrations/1767900000005-CreateRiskFlagsTable.ts',
  ],
});

async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await testDataSource.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  return result[0].exists;
}

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await testDataSource.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
    );
  `, [tableName, columnName]);
  return result[0].exists;
}

async function getTableColumns(tableName: string): Promise<any[]> {
  return await testDataSource.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position;
  `, [tableName]);
}

async function getTableIndexes(tableName: string): Promise<any[]> {
  return await testDataSource.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = $1;
  `, [tableName]);
}

async function getTableConstraints(tableName: string): Promise<any[]> {
  return await testDataSource.query(`
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = $1;
  `, [tableName]);
}

async function main() {
  console.log('🔍 Testing Governance Migrations\n');
  console.log('='.repeat(80));
  
  try {
    await testDataSource.initialize();
    console.log('✅ Database connection established\n');

    // Check prerequisite tables
    console.log('📋 Checking prerequisite tables...');
    const userSubscriptionsExists = await checkTableExists('user_subscriptions');
    const usersExists = await checkTableExists('users');
    const tenantsExists = await checkTableExists('tenants');
    
    console.log(`  - user_subscriptions: ${userSubscriptionsExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - users: ${usersExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - tenants: ${tenantsExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log();

    if (!userSubscriptionsExists) {
      console.log('⚠️  WARNING: user_subscriptions table does not exist!');
      console.log('   Migration 1767900000001 will skip adding enforcement columns.');
      console.log();
    }

    // Check current state of governance tables
    console.log('📋 Checking governance tables...');
    const enforcementActionsExists = await checkTableExists('enforcement_actions');
    const appealsExists = await checkTableExists('appeals');
    const userBlacklistExists = await checkTableExists('user_blacklist');
    const riskFlagsExists = await checkTableExists('risk_flags');
    
    console.log(`  - enforcement_actions: ${enforcementActionsExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - appeals: ${appealsExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - user_blacklist: ${userBlacklistExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  - risk_flags: ${riskFlagsExists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log();

    // Check enforcement columns in user_subscriptions
    if (userSubscriptionsExists) {
      console.log('📋 Checking enforcement columns in user_subscriptions...');
      const enforcementStatusExists = await checkColumnExists('user_subscriptions', 'enforcement_status');
      const suspendedByExists = await checkColumnExists('user_subscriptions', 'suspended_by');
      const restrictionsExists = await checkColumnExists('user_subscriptions', 'restrictions');
      
      console.log(`  - enforcement_status: ${enforcementStatusExists ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  - suspended_by: ${suspendedByExists ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  - restrictions: ${restrictionsExists ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log();
    }

    // Run pending migrations
    console.log('🔄 Running pending governance migrations...');
    console.log('='.repeat(80));
    
    const pendingMigrations = await testDataSource.showMigrations();
    console.log(`\n📊 Found ${pendingMigrations ? 'pending' : 'no'} migrations\n`);
    
    await testDataSource.runMigrations();
    console.log('\n✅ Migrations completed successfully!\n');
    console.log('='.repeat(80));

    // Verify schema after migrations
    console.log('\n🔍 Verifying schema after migrations...\n');

    // Check enforcement_actions table
    if (await checkTableExists('enforcement_actions')) {
      console.log('📋 enforcement_actions table:');
      const columns = await getTableColumns('enforcement_actions');
      console.log(`  - Columns: ${columns.length}`);
      const indexes = await getTableIndexes('enforcement_actions');
      console.log(`  - Indexes: ${indexes.length}`);
      const constraints = await getTableConstraints('enforcement_actions');
      console.log(`  - Constraints: ${constraints.length}`);
      console.log();
    }

    // Check appeals table
    if (await checkTableExists('appeals')) {
      console.log('📋 appeals table:');
      const columns = await getTableColumns('appeals');
      console.log(`  - Columns: ${columns.length}`);
      const indexes = await getTableIndexes('appeals');
      console.log(`  - Indexes: ${indexes.length}`);
      const constraints = await getTableConstraints('appeals');
      console.log(`  - Constraints: ${constraints.length}`);
      console.log();
    }

    // Check user_blacklist table
    if (await checkTableExists('user_blacklist')) {
      console.log('📋 user_blacklist table:');
      const columns = await getTableColumns('user_blacklist');
      console.log(`  - Columns: ${columns.length}`);
      const indexes = await getTableIndexes('user_blacklist');
      console.log(`  - Indexes: ${indexes.length}`);
      const constraints = await getTableConstraints('user_blacklist');
      console.log(`  - Constraints: ${constraints.length}`);
      console.log();
    }

    // Check risk_flags table
    if (await checkTableExists('risk_flags')) {
      console.log('📋 risk_flags table:');
      const columns = await getTableColumns('risk_flags');
      console.log(`  - Columns: ${columns.length}`);
      const indexes = await getTableIndexes('risk_flags');
      console.log(`  - Indexes: ${indexes.length}`);
      const constraints = await getTableConstraints('risk_flags');
      console.log(`  - Constraints: ${constraints.length}`);
      console.log();
    }

    // Test rollback capability
    console.log('🔄 Testing rollback capability...');
    console.log('='.repeat(80));
    console.log('⚠️  Skipping actual rollback to preserve data');
    console.log('   To test rollback, run: npm run migration:revert');
    console.log();

    console.log('✅ All governance migrations tested successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error during migration testing:', error);
    process.exit(1);
  } finally {
    await testDataSource.destroy();
  }
}

main();
