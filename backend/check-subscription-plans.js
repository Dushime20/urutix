const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function checkTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'subscription_plans'
    `);
    
    console.log('Table exists:', tableCheck.rows.length > 0);
    
    if (tableCheck.rows.length > 0) {
      // Get columns
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        ORDER BY ordinal_position
      `);
      
      console.log('\nColumns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Get row count
      const count = await pool.query('SELECT COUNT(*) FROM subscription_plans');
      console.log('\nRow count:', count.rows[0].count);
      
      // Get sample data
      const sample = await pool.query('SELECT * FROM subscription_plans LIMIT 3');
      console.log('\nSample data:');
      console.log(JSON.stringify(sample.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkTable();
