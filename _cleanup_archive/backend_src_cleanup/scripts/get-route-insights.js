
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function getRouteInsights() {
  const pool = new Pool(dbConfig);
  try {
    const res = await pool.query(`
      SELECT 
        origin_city as "Origin", 
        destination_city as "Destination", 
        COUNT(*) as "Total Shipments",
        COUNT(DISTINCT cargo_owner_id) as "Unique Clients",
        ROUND(AVG(total_cost), 2) as "Avg Revenue",
        ROUND(AVG(CASE WHEN on_time_delivery THEN 1 ELSE 0 END) * 100, 2) as "On-Time Rate %"
      FROM cargo_owner_analytics
      GROUP BY origin_city, destination_city
      ORDER BY "Total Shipments" DESC, "Unique Clients" DESC
      LIMIT 10
    `);
    
    console.log('📈 Route Performance Summary:');
    console.table(res.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getRouteInsights();
