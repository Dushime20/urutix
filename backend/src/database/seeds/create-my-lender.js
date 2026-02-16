
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function createLenderUser() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('Connecting to database...');
    
    // Check if lender user exists
    const email = 'lender@test.com';
    const res = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (res.rows.length > 0) {
      console.log(`User ${email} already exists.`);
      // Update password just in case
      const passwordHash = await bcrypt.hash('test123', 10);
      await pool.query('UPDATE users SET "passwordHash" = $1 WHERE email = $2', [passwordHash, email]);
      console.log('Password updated to test123');
    } else {
      console.log(`Creating user ${email}...`);
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash('test123', 10);
      
      // Get a tenant ID (use default)
      const tenantRes = await pool.query('SELECT id FROM tenants WHERE "isActive" = true LIMIT 1');
      const tenantId = tenantRes.rows[0].id;
      
      await pool.query(`
        INSERT INTO users (
          id, email, phone, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [userId, email, '+254700000000', passwordHash, 'LENDER', 'ACTIVE', tenantId]);
      
      // Create profile
      const profileId = uuidv4();
      await pool.query(`
        INSERT INTO user_profiles (
          id, "userId", "tenantId", "firstName", "lastName", "companyName", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [profileId, userId, tenantId, 'Test', 'Lender', 'Test Lender Co']);
      
      console.log(`User ${email} created successfully.`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

createLenderUser();
