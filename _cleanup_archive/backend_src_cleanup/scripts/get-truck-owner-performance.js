
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function getTruckOwnerPerformance() {
  const pool = new Pool(dbConfig);
  try {
    const res = await pool.query(`
      SELECT 
        u.email as "Email",
        p."companyName" as "Company",
        COUNT(t.id) as "Total Trips",
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as "Completed",
        ROUND(AVG(l.rating), 1) as "Avg Rating",
        SUM(t."agreedPrice") as "Total Revenue"
      FROM trips t
      JOIN trucks tr ON t."truckId" = tr.id
      JOIN users u ON tr."ownerId" = u.id
      LEFT JOIN user_profiles p ON u.id = p."userId"
      LEFT JOIN loads l ON t."loadId" = l.id
      GROUP BY u.email, p."companyName"
      ORDER BY "Total Trips" DESC, "Avg Rating" DESC
    `);
    
    console.log('🚛 Truck Owner Performance Summary:');
    console.table(res.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getTruckOwnerPerformance();
