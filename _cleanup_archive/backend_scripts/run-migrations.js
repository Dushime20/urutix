const { Client } = require('pg');
require('dotenv').config();

async function runMigrations() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Check current migrations
    console.log('📋 Checking migration status...');
    const migrationsResult = await client.query(
      'SELECT * FROM migrations ORDER BY timestamp DESC'
    );
    console.log(`Found ${migrationsResult.rows.length} executed migrations:`);
    migrationsResult.rows.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name} (${new Date(parseInt(m.timestamp)).toISOString()})`);
    });

    // Check tables
    console.log('\n📊 Checking database tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name != 'migrations'
      ORDER BY table_name
    `);
    
    console.log(`\n✅ Found ${tablesResult.rows.length} tables in database:`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach((table, i) => {
        console.log(`  ${i + 1}. ${table.table_name}`);
      });
    } else {
      console.log('  ⚠️  No tables found - migrations may need to be run');
    }

    // Check for key tables
    const keyTables = ['trucks', 'users', 'loads', 'drivers', 'trips'];
    console.log('\n🔍 Checking key tables:');
    for (const tableName of keyTables) {
      const exists = tablesResult.rows.some(t => t.table_name === tableName);
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
    }

    await client.end();
    console.log('\n✅ Database check completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '42P01') {
      console.error('   Database tables do not exist. Run migrations first.');
    }
    await client.end().catch(() => {});
    process.exit(1);
  }
}

runMigrations();

