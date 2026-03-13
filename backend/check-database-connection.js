const { Pool } = require('pg');

// Database configuration from .env
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'urutix',
  password: process.env.DB_PASSWORD || '123',
  port: process.env.DB_PORT || 5433,
};

console.log('🔍 Checking Database Connection...\n');
console.log('Database Configuration:');
console.log(`Host: ${dbConfig.host}`);
console.log(`Port: ${dbConfig.port}`);
console.log(`Database: ${dbConfig.database}`);
console.log(`User: ${dbConfig.user}`);
console.log(`Password: ${'*'.repeat(dbConfig.password.length)}\n`);

async function checkDatabaseConnection() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔌 Attempting to connect to PostgreSQL...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Check if database exists
    const dbCheck = await client.query('SELECT current_database()');
    console.log(`🗄️ Connected to database: ${dbCheck.rows[0].current_database}`);
    
    // Check existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📋 Existing tables (${tablesResult.rows.length}):`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  No tables found');
    }
    
    client.release();
    console.log('\n🎉 Database is ready for User KYC migration!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run: node run-user-kyc-migration.js');
    console.log('2. Restart backend: npm run start:dev');
    console.log('3. Test system: node test-user-kyc-system.js');
    
  } catch (error) {
    console.log('❌ Database connection failed!');
    console.log(`Error: ${error.message}\n`);
    
    console.log('🔧 Troubleshooting Steps:');
    console.log('1. Check if PostgreSQL is running:');
    console.log('   - Windows: Check Services or Task Manager');
    console.log('   - Mac/Linux: ps aux | grep postgres');
    console.log('');
    console.log('2. Verify PostgreSQL is listening on the correct port:');
    console.log(`   - Expected: ${dbConfig.host}:${dbConfig.port}`);
    console.log('   - Check postgresql.conf for port setting');
    console.log('');
    console.log('3. Check if database exists:');
    console.log(`   psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -l`);
    console.log('');
    console.log('4. Create database if it doesn\'t exist:');
    console.log(`   createdb -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} ${dbConfig.database}`);
    console.log('');
    console.log('5. Test manual connection:');
    console.log(`   psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database}`);
    console.log('');
    console.log('6. Common PostgreSQL startup commands:');
    console.log('   - Windows: net start postgresql-x64-13');
    console.log('   - Mac: brew services start postgresql');
    console.log('   - Linux: sudo systemctl start postgresql');
    
  } finally {
    await pool.end();
  }
}

// Run the check
checkDatabaseConnection();