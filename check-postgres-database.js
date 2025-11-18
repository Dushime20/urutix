const { Client } = require('pg');
require('dotenv').config();

console.log('🗄️ Checking PostgreSQL Database...\n');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_DATABASE || 'urutix',
};

async function checkDatabase() {
  const client = new Client(config);
  
  try {
    console.log('🔌 Connecting to PostgreSQL...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}\n`);
    
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Get list of tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Database Tables Found:');
    console.log('========================');
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in database');
      return;
    }

    tablesResult.rows.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    console.log('\n📋 Table Details:');
    console.log('==================');

    // Get details for each table
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      // Get columns
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);

      // Get row count
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);

      console.log(`\n📄 ${tableName.toUpperCase()}:`);
      console.log('   Columns:');
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`     - ${col.column_name} (${col.data_type}) ${nullable}`);
      });
      console.log(`   Rows: ${countResult.rows[0].count}`);

      // If it's loads table, show sample data
      if (tableName === 'loads' && parseInt(countResult.rows[0].count) > 0) {
        console.log('   Sample data:');
        const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 3`);
        sampleResult.rows.forEach((row, index) => {
          console.log(`     Row ${index + 1}:`, JSON.stringify(row, null, 2).substring(0, 200) + '...');
        });
      }
    }

    await client.end();
    console.log('\n✅ Database check completed');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Make sure PostgreSQL is running');
      console.log('   2. Check if the connection details are correct');
      console.log('   3. Verify PostgreSQL is listening on port 5432');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication failed:');
      console.log('   1. Check username and password');
      console.log('   2. Verify user has access to the database');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist:');
      console.log('   1. Run the setup-postgres-database.js script first');
      console.log('   2. Create the database manually');
    }
    
    process.exit(1);
  }
}

checkDatabase();
