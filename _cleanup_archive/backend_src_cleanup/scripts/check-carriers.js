
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function getCarrierPerformanceFromLoads() {
  const pool = new Pool(dbConfig);
  try {
    const res = await pool.query(`
      SELECT 
        u.email as "Email",
        p."companyName" as "Company",
        COUNT(l.id) as "Total Loads",
        ROUND(AVG(l.rating), 1) as "Avg Rating",
        SUM(l."offeredPrice") as "Total Revenue"
      FROM loads l
      JOIN users u ON l."assignedCarrierId" = u.id
      LEFT JOIN user_profiles p ON u.id = p."userId"
      WHERE l."assignedCarrierId" IS NOT NULL
      GROUP BY u.email, p."companyName"
      ORDER BY "Avg Rating" DESC, "Total Loads" DESC
    `);
    
    console.log('🚛 Truck Owner Performance (from Loads):');
    console.table(res.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getCarrierPerformanceFromLoads();
