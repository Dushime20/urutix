
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function getCarrierInsights() {
  const pool = new Pool(dbConfig);
  try {
    const res = await pool.query(`
      SELECT 
        u.email as "Carrier Email",
        p."firstName" || ' ' || p."lastName" as "Name",
        p."companyName" as "Company",
        COUNT(a.id) as "Total Trips",
        ROUND(AVG(a.carrier_rating), 1) as "Avg Rating",
        ROUND(AVG(CASE WHEN a.on_time_delivery THEN 1 ELSE 0 END) * 100, 2) as "On-Time %",
        SUM(a.total_cost) as "Total Revenue Generated"
      FROM cargo_owner_analytics a
      JOIN users u ON a.carrier_id = u.id
      LEFT JOIN user_profiles p ON u.id = p."userId"
      GROUP BY u.email, p."firstName", p."lastName", p."companyName"
      ORDER BY "Avg Rating" DESC, "Total Trips" DESC
    `);
    
    console.log('🚛 Truck Owner (Carrier) Performance:');
    console.table(res.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getCarrierInsights();
