const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

const pool = new Pool(dbConfig);

async function debugOwnerInfo() {
  try {
    // Get a sample truck with owner info
    const res = await pool.query(`
      SELECT 
        t.id as truck_id,
        t."plateNumber",
        t."ownerId",
        u.id as user_id,
        u.email as owner_email,
        up."firstName",
        up."lastName",
        up."companyName"
      FROM trucks t
      LEFT JOIN users u ON t."ownerId" = u.id
      LEFT JOIN user_profiles up ON u.id = up."userId"
      LIMIT 5
    `);
    
    console.log('Trucks with Owner Info:');
    res.rows.forEach((row, i) => {
      console.log(`\nTruck ${i+1}:`, JSON.stringify(row, null, 2));
    });

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

debugOwnerInfo();
