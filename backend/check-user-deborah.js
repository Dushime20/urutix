const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUser() {
  console.log('🔍 Checking user: isdeborah47@gmail.com\n');

  try {
    // Find the user
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u."tenantId",
        u.role,
        u.status,
        u."passwordHash",
        u."createdAt",
        u."lastLoginAt",
        u."emailVerifiedAt",
        u."loginAttempts",
        u."lockedUntil",
        p."firstName",
        p."lastName",
        t.name as tenant_name,
        t.status as tenant_status
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p."userId"
      LEFT JOIN tenants t ON u."tenantId" = t.id
      WHERE u.email = 'isdeborah47@gmail.com'
      ORDER BY u."createdAt" DESC;
    `;

    const result = await pool.query(userQuery);

    if (result.rows.length === 0) {
      console.log('❌ No user found with email: isdeborah47@gmail.com');
      return;
    }

    console.log(`✅ Found ${result.rows.length} user(s) with this email:\n`);

    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. User Details:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Tenant: ${user.tenant_name} (${user.tenant_status})`);
      console.log(`   Tenant ID: ${user.tenantId}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`   Last Login: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}`);
      console.log(`   Email Verified: ${user.emailVerifiedAt ? 'Yes' : 'No'}`);
      console.log(`   Login Attempts: ${user.loginAttempts}`);
      console.log(`   Locked Until: ${user.lockedUntil ? new Date(user.lockedUntil).toLocaleString() : 'Not locked'}`);
      console.log(`   Has Password: ${user.passwordHash ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Test password
    const testPassword = 'password123'; // Common test password
    console.log('\n🔐 Testing common passwords...\n');

    const testPasswords = [
      'password',
      'password123',
      'Password123',
      'Password123!',
      'Admin123!@#',
      '123456',
      'deborah123',
      'Deborah123',
    ];

    for (const user of result.rows) {
      console.log(`Testing passwords for user: ${user.firstName} ${user.lastName} (${user.role})`);
      
      if (!user.passwordHash) {
        console.log('   ⚠️  No password hash found!\n');
        continue;
      }

      let foundMatch = false;
      for (const testPwd of testPasswords) {
        try {
          const isMatch = await bcrypt.compare(testPwd, user.passwordHash);
          if (isMatch) {
            console.log(`   ✅ PASSWORD FOUND: "${testPwd}"\n`);
            foundMatch = true;
            break;
          }
        } catch (error) {
          // Skip invalid hashes
        }
      }

      if (!foundMatch) {
        console.log('   ❌ None of the test passwords matched\n');
      }
    }

    // Check if account is locked or has issues
    console.log('\n📋 Account Status Summary:\n');
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}:`);
      
      const issues = [];
      if (user.status !== 'ACTIVE') issues.push(`Status is ${user.status}`);
      if (user.tenant_status !== 'ACTIVE') issues.push(`Tenant is ${user.tenant_status}`);
      if (!user.emailVerifiedAt) issues.push('Email not verified');
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) issues.push('Account is locked');
      if (user.loginAttempts >= 5) issues.push(`Too many login attempts (${user.loginAttempts})`);
      if (!user.passwordHash) issues.push('No password set');

      if (issues.length === 0) {
        console.log('   ✅ No issues found - account should work');
      } else {
        console.log('   ⚠️  Issues found:');
        issues.forEach(issue => console.log(`      - ${issue}`));
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
