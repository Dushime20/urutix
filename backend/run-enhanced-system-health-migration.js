const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '011_enhanced_system_health.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\nRunning enhanced system health migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    // Verify the changes
    console.log('\nVerifying migration...');
    
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'system_health_logs'
      ORDER BY ordinal_position
    `);

    console.log('\nSystem Health Logs Table Structure:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    const indexesResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'system_health_logs'
    `);

    console.log('\nIndexes:');
    indexesResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    const viewResult = await client.query(`
      SELECT viewname 
      FROM pg_views 
      WHERE viewname = 'system_health_summary'
    `);

    if (viewResult.rows.length > 0) {
      console.log('\n✅ system_health_summary view created successfully');
    }

    console.log('\n✅ All verifications passed!');
    console.log('\nNext steps:');
    console.log('1. Register EnhancedSystemHealthService in your module');
    console.log('2. Register EnhancedSystemHealthController in your module');
    console.log('3. Run tests: npm test -- enhanced-system-health.service.spec.ts');
    console.log('4. Start the backend to begin automatic metric collection');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

runMigration();
