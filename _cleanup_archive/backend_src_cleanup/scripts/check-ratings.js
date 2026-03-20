
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function checkRatings() {
  const pool = new Pool(dbConfig);
  try {
    const res = await pool.query(`
      SELECT 
        u.email, 
        p."companyName",
        AVG(r.rating) as "avgRating", 
        COUNT(r.id) as "reviewCount"
      FROM user_ratings r
      JOIN users u ON r."ratedUserId"::text = u.id::text
      LEFT JOIN user_profiles p ON u.id = p."userId"
      WHERE u.role = 'TRUCK_OWNER'
      GROUP BY u.email, p."companyName"
      ORDER BY "avgRating" DESC
    `);
    
    console.log('⭐ Truck Owner Performance (Ratings):');
    console.table(res.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkRatings();
