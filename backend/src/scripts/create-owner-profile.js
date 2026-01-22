const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD
});

async function createProfile() {
  try {
    // The truck owner from the logs
    const ownerId = '9a947709-71b8-476e-b94f-92bf4a0f29e5';
    
    // Get the user's tenantId
    const userRes = await pool.query('SELECT "tenantId", email FROM users WHERE id = $1', [ownerId]);
    if (userRes.rows.length === 0) {
      console.log('User not found!');
      return;
    }
    const { tenantId, email } = userRes.rows[0];
    console.log(`Creating profile for user: ${email}`);
    
    // Check if profile already exists
    const existing = await pool.query('SELECT id FROM user_profiles WHERE user_id = $1', [ownerId]);
    if (existing.rows.length > 0) {
      console.log('Profile already exists!');
      return;
    }
    
    // Create profile
    const profileId = uuidv4();
    await pool.query(`
      INSERT INTO user_profiles (
        id, user_id, "userId", "tenantId", "firstName", "lastName", "companyName",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $2, $3, 'Mike', 'TruckOwner', 'UrutiTruck Transport LLC',
        NOW(), NOW()
      )
    `, [profileId, ownerId, tenantId]);
    
    console.log('Profile created successfully!');
    
    // Verify
    const verify = await pool.query(`
      SELECT "firstName", "lastName", "companyName" 
      FROM user_profiles WHERE user_id = $1
    `, [ownerId]);
    console.log('Created profile:', verify.rows[0]);
    
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

createProfile();
