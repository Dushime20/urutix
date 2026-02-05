/**
 * Migration Check Script
 * Verifies that all required database columns and tables exist
 * Run this before starting the application to catch schema issues early
 */

const { DataSource } = require('typeorm');
const path = require('path');

// Critical columns that must exist for the app to function
const CRITICAL_SCHEMA = {
  loads: [
    'id',
    'tenantId',
    'cargoOwnerId',
    'loadType', // This was missing in production
    'equipmentType',
    'cargoType',
    'status',
    'weight',
    'locations',
    'createdAt',
    'updatedAt',
  ],
  users: ['id', 'email', 'role', 'tenantId', 'status'],
  trucks: ['id', 'tenantId', 'status', 'licensePlate'],
  tenants: ['id', 'name', 'status'],
};

async function checkMigrations() {
  console.log('🔍 Checking database schema...\n');

  // Load database configuration
  const config = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'smartcargo',
  };

  const dataSource = new DataSource(config);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const queryRunner = dataSource.createQueryRunner();
    let hasErrors = false;

    // Check each critical table and its columns
    for (const [tableName, requiredColumns] of Object.entries(CRITICAL_SCHEMA)) {
      console.log(`📋 Checking table: ${tableName}`);

      // Check if table exists
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) {
        console.error(`  ❌ Table '${tableName}' does not exist!`);
        hasErrors = true;
        continue;
      }

      // Check each required column
      const table = await queryRunner.getTable(tableName);
      for (const columnName of requiredColumns) {
        const column = table.columns.find((col) => col.name === columnName);
        if (!column) {
          console.error(`  ❌ Column '${columnName}' missing in table '${tableName}'`);
          hasErrors = true;
        } else {
          console.log(`  ✅ Column '${columnName}' exists`);
        }
      }
      console.log('');
    }

    // Check migration history
    console.log('📜 Checking migration history...');
    try {
      const migrations = await queryRunner.query(
        `SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5`
      );
      console.log(`  ✅ Found ${migrations.length} recent migrations`);
      migrations.forEach((m) => {
        console.log(`     - ${m.name} (${new Date(m.timestamp).toISOString()})`);
      });
    } catch (error) {
      console.warn('  ⚠️  Could not read migration history (table may not exist yet)');
    }

    await queryRunner.release();
    await dataSource.destroy();

    if (hasErrors) {
      console.error('\n❌ Schema validation FAILED!');
      console.error('⚠️  Please run migrations before starting the application:');
      console.error('   npm run migration:run\n');
      process.exit(1);
    } else {
      console.log('✅ Schema validation PASSED!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error checking migrations:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the check
checkMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
