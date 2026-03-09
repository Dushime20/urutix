const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPassword() {
  console.log('🔍 Checking password for: deborahrutagengwa.admin@urutix.com\n');

  try {
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u."passwordHash",
        p."firstName",
        p."lastName",
        t.name as tenant_name
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p."userId"
      LEFT JOIN tenants t ON u."tenantId" = t.id
      WHERE u.email = 'deborahrutagengwa.admin@urutix.com';
    `;

    const result = await pool.query(userQuery);

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Tenant: ${user.tenant_name}`);
    console.log(`   Has Password: ${user.passwordHash ? 'Yes' : 'No'}\n`);

    if (!user.passwordHash) {
      console.log('⚠️  No password hash found! Need to set a password.\n');
      return;
    }

    // Test common passwords
    console.log('🔐 Testing common passwords...\n');

    const testPasswords = [
      'password',
      'password123',
      'Password123',
      'Password123!',
      'Admin123!@#',
      'admin123',
      'Admin123',
      '123456',
      'deborah123',
      'Deborah123',
      'Deborah@123',
      'urutix123',
      'Urutix123',
    ];

    let foundMatch = false;
    for (const testPwd of testPasswords) {
      try {
        const isMatch = await bcrypt.compare(testPwd, user.passwordHash);
        if (isMatch) {
          console.log(`✅ PASSWORD FOUND: "${testPwd}"\n`);
          console.log('📝 Login credentials:');
          console.log(`   Email: ${user.email}`);
          console.log(`   Password: ${testPwd}\n`);
          foundMatch = true;
          break;
        }
      } catch (error) {
        console.error(`Error testing password: ${error.message}`);
      }
    }

    if (!foundMatch) {
      console.log('❌ None of the test passwords matched');
      console.log('\n💡 Recommendation: Reset the password to a known value\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPassword();
