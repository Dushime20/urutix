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

async function fixProfile() {
  try {
    const ownerId = '9a947709-71b8-476e-b94f-92bf4a0f29e5';
    
    // Check existing profile for this user
    const existing = await pool.query(`
      SELECT * FROM user_profiles 
      WHERE "userId" = $1 OR user_id = $1
    `, [ownerId]);
    
    console.log('Existing profiles:', JSON.stringify(existing.rows, null, 2));
    
    if (existing.rows.length > 0) {
      // Profile exists but user_id might be wrong - update it
      const profileId = existing.rows[0].id;
      await pool.query(`
        UPDATE user_profiles 
        SET user_id = $1 
        WHERE id = $2
      `, [ownerId, profileId]);
      console.log('Updated user_id in existing profile');
    } else {
      // Get tenantId
      const userRes = await pool.query('SELECT "tenantId" FROM users WHERE id = $1', [ownerId]);
      const { tenantId } = userRes.rows[0];
      
      // Create new profile with both columns
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
      console.log('Created new profile');
    }
    
    // Verify
    const verify = await pool.query(`
      SELECT user_id, "userId", "firstName", "lastName", "companyName" 
      FROM user_profiles WHERE "userId" = $1
    `, [ownerId]);
    console.log('Final profile:', JSON.stringify(verify.rows, null, 2));
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

fixProfile();
