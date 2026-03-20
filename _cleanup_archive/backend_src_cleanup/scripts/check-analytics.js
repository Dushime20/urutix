
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function checkAnalyticsData() {
  const pool = new Pool(dbConfig);
  try {
    const res = await pool.query('SELECT COUNT(*) FROM cargo_owner_analytics');
    console.log(`Total rows in cargo_owner_analytics: ${res.rows[0].count}`);
    
    if (parseInt(res.rows[0].count) > 0) {
      const routes = await pool.query(`
        SELECT 
          origin_city as "originCity", 
          destination_city as "destinationCity", 
          COUNT(*) as "shipmentCount",
          AVG(total_cost) as "avgCost"
        FROM cargo_owner_analytics
        GROUP BY origin_city, destination_city
        ORDER BY "shipmentCount" DESC
        LIMIT 5
      `);
      console.log('Top routes from analytics table:');
      console.table(routes.rows);
    } else {
      console.log('Analytics table is empty. Checking loads table...');
      const loads = await pool.query(`
        SELECT 
          origin->>'city' as "originCity", 
          destination->>'city' as "destinationCity", 
          COUNT(*) as "shipmentCount"
        FROM loads
        WHERE origin->>'city' IS NOT NULL AND destination->>'city' IS NOT NULL
        GROUP BY origin->>'city', destination->>'city'
        ORDER BY "shipmentCount" DESC
        LIMIT 5
      `);
      console.log('Top routes from loads table:');
      console.table(loads.rows);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAnalyticsData();
