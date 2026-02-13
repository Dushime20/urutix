import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

/**
 * Script to test governance migration rollback
 * This script will:
 * 1. Verify current state
 * 2. Rollback all governance migrations
 * 3. Verify rollback was successful
 * 4. Re-run migrations to restore state
 */

const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
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

async function main() {
  console.log('🔄 Testing Governance Migration Rollback\n');
  console.log('='.repeat(80));
  
  try {
    await testDataSource.initialize();
    console.log('✅ Database connection established\n');

    // Step 1: Verify current state (migrations should be applied)
    console.log('📋 Step 1: Verifying current state (migrations applied)...');
    const enforcementActionsExists = await checkTableExists('enforcement_actions');
    const appealsExists = await checkTableExists('appeals');
    const userBlacklistExists = await checkTableExists('user_blacklist');
    const riskFlagsExists = await checkTableExists('risk_flags');
    const enforcementStatusExists = await checkColumnExists('user_subscriptions', 'enforcement_status');
    
    console.log(`  - enforcement_actions table: ${enforcementActionsExists ? '✅' : '❌'}`);
    console.log(`  - appeals table: ${appealsExists ? '✅' : '❌'}`);
    console.log(`  - user_blacklist table: ${userBlacklistExists ? '✅' : '❌'}`);
    console.log(`  - risk_flags table: ${riskFlagsExists ? '✅' : '❌'}`);
    console.log(`  - enforcement_status column: ${enforcementStatusExists ? '✅' : '❌'}`);
    console.log();

    if (!enforcementActionsExists || !appealsExists || !userBlacklistExists || !riskFlagsExists) {
      console.log('⚠️  Some migrations are not applied. Please run migrations first.');
      return;
    }

    // Step 2: Rollback migrations (5 times for 5 migrations)
    console.log('🔄 Step 2: Rolling back governance migrations...');
    console.log('='.repeat(80));
    
    for (let i = 0; i < 5; i++) {
      console.log(`\n🔄 Rollback ${i + 1}/5...`);
      await testDataSource.undoLastMigration();
    }
    
    console.log('\n✅ All rollbacks completed\n');
    console.log('='.repeat(80));

    // Step 3: Verify rollback was successful
    console.log('\n📋 Step 3: Verifying rollback (tables should be removed)...');
    const enforcementActionsAfter = await checkTableExists('enforcement_actions');
    const appealsAfter = await checkTableExists('appeals');
    const userBlacklistAfter = await checkTableExists('user_blacklist');
    const riskFlagsAfter = await checkTableExists('risk_flags');
    const enforcementStatusAfter = await checkColumnExists('user_subscriptions', 'enforcement_status');
    
    console.log(`  - enforcement_actions table: ${enforcementActionsAfter ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
    console.log(`  - appeals table: ${appealsAfter ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
    console.log(`  - user_blacklist table: ${userBlacklistAfter ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
    console.log(`  - risk_flags table: ${riskFlagsAfter ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
    console.log(`  - enforcement_status column: ${enforcementStatusAfter ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
    console.log();

    const rollbackSuccessful = !enforcementActionsAfter && !appealsAfter && 
                               !userBlacklistAfter && !riskFlagsAfter && 
                               !enforcementStatusAfter;

    if (rollbackSuccessful) {
      console.log('✅ Rollback verification PASSED - All tables and columns removed\n');
    } else {
      console.log('❌ Rollback verification FAILED - Some tables or columns still exist\n');
    }

    // Step 4: Re-run migrations to restore state
    console.log('🔄 Step 4: Re-running migrations to restore state...');
    console.log('='.repeat(80));
    await testDataSource.runMigrations();
    console.log('\n✅ Migrations re-applied successfully\n');
    console.log('='.repeat(80));

    // Step 5: Final verification
    console.log('\n📋 Step 5: Final verification (migrations restored)...');
    const enforcementActionsFinal = await checkTableExists('enforcement_actions');
    const appealsFinal = await checkTableExists('appeals');
    const userBlacklistFinal = await checkTableExists('user_blacklist');
    const riskFlagsFinal = await checkTableExists('risk_flags');
    const enforcementStatusFinal = await checkColumnExists('user_subscriptions', 'enforcement_status');
    
    console.log(`  - enforcement_actions table: ${enforcementActionsFinal ? '✅' : '❌'}`);
    console.log(`  - appeals table: ${appealsFinal ? '✅' : '❌'}`);
    console.log(`  - user_blacklist table: ${userBlacklistFinal ? '✅' : '❌'}`);
    console.log(`  - risk_flags table: ${riskFlagsFinal ? '✅' : '❌'}`);
    console.log(`  - enforcement_status column: ${enforcementStatusFinal ? '✅' : '❌'}`);
    console.log();

    const restoreSuccessful = enforcementActionsFinal && appealsFinal && 
                             userBlacklistFinal && riskFlagsFinal && 
                             enforcementStatusFinal;

    if (restoreSuccessful) {
      console.log('✅ Restore verification PASSED - All tables and columns restored\n');
    } else {
      console.log('❌ Restore verification FAILED - Some tables or columns missing\n');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('📊 ROLLBACK TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Rollback Test: ${rollbackSuccessful ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Restore Test: ${restoreSuccessful ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Overall: ${rollbackSuccessful && restoreSuccessful ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error during rollback testing:', error);
    process.exit(1);
  } finally {
    await testDataSource.destroy();
  }
}

main();
