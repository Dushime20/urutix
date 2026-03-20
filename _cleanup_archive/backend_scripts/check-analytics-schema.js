/**
 * Check Analytics Table Schema
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkAnalyticsSchema() {
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

    // Check cargo_owner_analytics table schema
    console.log('\n📊 Cargo Owner Analytics Table Schema:');
    console.log('======================================');
    
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cargo_owner_analytics' 
      ORDER BY ordinal_position
    `);

    if (schemaResult.rows.length === 0) {
      console.log('❌ cargo_owner_analytics table not found');
      return;
    }

    schemaResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check analytics_insights table schema
    console.log('\n🧠 Analytics Insights Table Schema:');
    console.log('===================================');
    
    const insightsSchemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'analytics_insights' 
      ORDER BY ordinal_position
    `);

    if (insightsSchemaResult.rows.length === 0) {
      console.log('❌ analytics_insights table not found');
    } else {
      insightsSchemaResult.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAnalyticsSchema();