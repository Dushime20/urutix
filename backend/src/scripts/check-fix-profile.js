const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD
});

async function checkAndFix() {
  try {
    const ownerId = '9a947709-71b8-476e-b94f-92bf4a0f29e5';
    
    // Check the current state
    const profile = await pool.query(`
      SELECT id, user_id, "userId", "firstName", "lastName" 
      FROM user_profiles 
      WHERE "userId" = $1
    `, [ownerId]);
    
    if (profile.rows.length > 0) {
      const p = profile.rows[0];
      console.log('Profile found:');
      console.log('  ID:', p.id);
      console.log('  userId (column):', p.userId);
      console.log('  user_id (column):', p.user_id);
      console.log('  Name:', p.firstName, p.lastName);
      
      if (p.user_id !== p.userId) {
        console.log('\n⚠️ user_id does not match userId - fixing...');
        await pool.query(`
          UPDATE user_profiles SET user_id = $1 WHERE id = $2
        `, [p.userId, p.id]);
        console.log('✅ Fixed!');
      }
    } else {
      console.log('No profile found for this owner');
    }
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

checkAndFix();
