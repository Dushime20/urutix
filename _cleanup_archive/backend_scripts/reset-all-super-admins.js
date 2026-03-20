const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '123',
  database: 'urutix'
});

async function resetAllSuperAdmins() {
  try {
    await client.connect();
    console.log('🔐 Resetting All Super Admin Passwords...\n');
    
    // Set a known password
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 14);
    
    console.log('Generated hash:', hashedPassword.substring(0, 20) + '...');
    
    // Get all super admin accounts
    const admins = await client.query(`
      SELECT id, email, role, "tenantId"
      FROM users 
      WHERE role IN ('SUPER_ADMIN', 'ADMIN')
      ORDER BY role DESC, email;
    `);
    
    console.log(`Found ${admins.rows.length} admin accounts:\n`);
    
    for (const admin of admins.rows) {
      // Update password
      const result = await client.query(`
        UPDATE users 
        SET "passwordHash" = $1
        WHERE id = $2
        RETURNING email, role;
      `, [hashedPassword, admin.id]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Updated: ${admin.email} (${admin.role})`);
      }
    }
    
    console.log('\n🔑 All Admin Credentials Updated:');
    console.log('   🔑 Password: Admin@123');
    console.log('');
    console.log('📧 Available Admin Accounts:');
    
    for (const admin of admins.rows) {
      console.log(`   • ${admin.email} (${admin.role})`);
    }
    
    console.log('');
    console.log('🌐 Login URL: http://localhost:3001/login');
    console.log('⚠️  Remember to change passwords after first login!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

resetAllSuperAdmins();