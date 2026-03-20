
const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function diagnostic() {
  const pool = new Pool(dbConfig);
  try {
    const roles = await pool.query('SELECT role, COUNT(*) FROM users GROUP BY role');
    console.log('User Roles:');
    console.table(roles.rows);
    
    const sampleLoad = await pool.query('SELECT "assignedCarrierId", "assignedTruckId", status, "cargoOwnerId" FROM loads LIMIT 10');
    console.log('Sample Loads Assignments:');
    console.table(sampleLoad.rows);
    
    // Check if there are any TRUCK_OWNER with ratings
    const carriers = await pool.query(`
        SELECT u.email, u.role, p."companyName"
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p."userId"
        WHERE u.role = 'TRUCK_OWNER'
    `);
    console.log('Truck Owners:');
    console.table(carriers.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

diagnostic();
