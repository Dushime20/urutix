const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '123',
  database: 'urutix'
});

async function resetSuperAdminPassword() {
  try {
    await client.connect();
    console.log('🔐 Resetting Super Admin Password...\n');
    
    // Set a known password
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 14);
    
    // Update the main super admin account
    const result = await client.query(`
      UPDATE users 
      SET "passwordHash" = $1
      WHERE email = 'superadmin@urutix.com' AND role = 'SUPER_ADMIN'
      RETURNING email, role;
    `, [hashedPassword]);
    
    if (result.rows.length > 0) {
      console.log('✅ Password reset successful!');
      console.log('');
      console.log('🔑 Super Admin Credentials:');
      console.log('   📧 Email: superadmin@urutix.com');
      console.log('   🔑 Password: Admin@123');
      console.log('   👤 Role: SUPER_ADMIN');
      console.log('   🏢 Tenant: System');
      console.log('');
      console.log('🌐 Login URL: http://localhost:3001/login');
      console.log('');
      console.log('⚠️  Remember to change this password after first login!');
    } else {
      console.log('❌ No super admin user found to update');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetSuperAdminPassword();