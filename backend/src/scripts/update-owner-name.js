const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD
});

async function showAndUpdateProfile() {
  try {
    const ownerId = '9a947709-71b8-476e-b94f-92bf4a0f29e5';
    
    // Check the current profile
    const profile = await pool.query(`
      SELECT up.*, u.email 
      FROM user_profiles up
      JOIN users u ON u.id = up."userId"
      WHERE up."userId" = $1
    `, [ownerId]);
    
    if (profile.rows.length > 0) {
      const p = profile.rows[0];
      console.log('Current Profile:');
      console.log('  Email:', p.email);
      console.log('  First Name:', p.firstName);
      console.log('  Last Name:', p.lastName);
      console.log('  Company Name:', p.companyName);
      
      // Update to proper truck owner name
      await pool.query(`
        UPDATE user_profiles 
        SET "firstName" = 'Mike', 
            "lastName" = 'Uwimana',
            "companyName" = 'UrutiTruck Transport LLC'
        WHERE "userId" = $1
      `, [ownerId]);
      
      console.log('\n✅ Updated profile:');
      console.log('  First Name: Mike');
      console.log('  Last Name: Uwimana');
      console.log('  Company: UrutiTruck Transport LLC');
    } else {
      console.log('No profile found for owner:', ownerId);
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

showAndUpdateProfile();
