const { Client } = require('pg');
require('dotenv').config();

async function checkAnalyticsTables() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if analytics tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%analytics%'
      ORDER BY table_name
    `);

    console.log('\n📋 Analytics Tables:');
    console.log('====================');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`✅ ${row.table_name}`);
      });
    } else {
      console.log('❌ No analytics tables found');
    }

    // Check specific tables
    const expectedTables = ['cargo_owner_analytics', 'analytics_insights'];
    
    console.log('\n📋 Expected Tables Check:');
    console.log('=========================');
    
    for (const tableName of expectedTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      
      const exists = result.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'EXISTS' : 'MISSING'}`);
      
      if (exists) {
        // Check table structure
        const columnsResult = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
          LIMIT 5
        `, [tableName]);
        
        console.log(`   Columns (first 5): ${columnsResult.rows.map(c => c.column_name).join(', ')}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAnalyticsTables();