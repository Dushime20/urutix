const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const axios = require('axios');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function fixLoginCredentials() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 FIXING LOGIN CREDENTIALS');
    console.log('=' .repeat(50));

    // 1. Check existing users
    console.log('\n📋 1. CHECKING EXISTING USERS:');
    const usersQuery = `
      SELECT 
        id, 
        email, 
        role, 
        status,
        "passwordHash" IS NOT NULL as has_password,
        LENGTH("passwordHash") as password_length
      FROM users 
      ORDER BY "createdAt" DESC 
      LIMIT 10;
    `;
    
    const usersResult = await client.query(usersQuery);
    console.log(`Found ${usersResult.rows.length} users:`);
    
    usersResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - Password: ${user.has_password ? 'Yes' : 'No'}`);
    });

    // 2. Create/update a test user with known password
    console.log('\n📋 2. CREATING TEST USER:');
    const testEmail = 'test@urutix.com';
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Check if test user exists
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await client.query(existingUserQuery, [testEmail]);

    if (existingUser.rows.length > 0) {
      // Update existing user
      const updateQuery = `
        UPDATE users 
        SET "passwordHash" = $1, status = 'ACTIVE', "emailVerifiedAt" = NOW()
        WHERE email = $2
      `;
      await client.query(updateQuery, [hashedPassword, testEmail]);
      console.log(`✅ Updated existing user: ${testEmail}`);
    } else {
      // Create new user
      const insertQuery = `
        INSERT INTO users (id, email, "passwordHash", role, status, "emailVerifiedAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, 'ADMIN', 'ACTIVE', NOW(), NOW(), NOW())
      `;
      await client.query(insertQuery, [testEmail, hashedPassword]);
      console.log(`✅ Created new user: ${testEmail}`);
    }

    // 3. Update existing users with known password
    console.log('\n📋 3. UPDATING EXISTING USERS:');
    const usersToUpdate = [
      { email: 'admin@urutix.com', password: 'admin123', role: 'ADMIN' },
      { email: 'super@admin.com', password: 'superadmin123', role: 'SUPER_ADMIN' },
      { email: 'urutidriver@gmail.com', password: 'password123', role: 'DRIVER' }
    ];

    for (const userData of usersToUpdate) {
      const hashedPwd = await bcrypt.hash(userData.password, 10);
      
      // Check if user exists
      const checkQuery = 'SELECT id FROM users WHERE email = $1';
      const userExists = await client.query(checkQuery, [userData.email]);
      
      if (userExists.rows.length > 0) {
        // Update existing
        const updateQuery = `
          UPDATE users 
          SET "passwordHash" = $1, status = 'ACTIVE', "emailVerifiedAt" = NOW(), role = $2
          WHERE email = $3
        `;
        await client.query(updateQuery, [hashedPwd, userData.role, userData.email]);
        console.log(`✅ Updated: ${userData.email} with password: ${userData.password}`);
      } else {
        // Create new
        const insertQuery = `
          INSERT INTO users (id, email, "passwordHash", role, status, "emailVerifiedAt", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, 'ACTIVE', NOW(), NOW(), NOW())
        `;
        await client.query(insertQuery, [userData.email, hashedPwd, userData.role]);
        console.log(`✅ Created: ${userData.email} with password: ${userData.password}`);
      }
    }

    // 4. Test login with updated credentials
    console.log('\n📋 4. TESTING LOGIN WITH UPDATED CREDENTIALS:');
    
    const testCredentials = [
      { email: 'test@urutix.com', password: 'password123' },
      { email: 'admin@urutix.com', password: 'admin123' },
      { email: 'urutidriver@gmail.com', password: 'password123' }
    ];

    for (const cred of testCredentials) {
      try {
        console.log(`\n   Testing: ${cred.email}`);
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', cred, {
          timeout: 10000,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (loginResponse.status === 200) {
          console.log('   ✅ Login successful!');
          console.log(`   Token: ${loginResponse.data.token ? 'Received' : 'Missing'}`);
          console.log(`   User: ${loginResponse.data.user?.email || 'No user data'}`);
        } else {
          console.log(`   ❌ Login failed (${loginResponse.status})`);
          console.log(`   Error: ${JSON.stringify(loginResponse.data)}`);
        }
      } catch (error) {
        console.log(`   ❌ Request error: ${error.message}`);
      }
    }

    // 5. Verify password hashing
    console.log('\n📋 5. VERIFYING PASSWORD HASHING:');
    const verifyQuery = `
      SELECT email, "passwordHash", role 
      FROM users 
      WHERE email IN ('test@urutix.com', 'admin@urutix.com', 'urutidriver@gmail.com')
    `;
    const verifyResult = await client.query(verifyQuery);
    
    for (const user of verifyResult.rows) {
      const isValid = await bcrypt.compare('password123', user.passwordHash);
      console.log(`   ${user.email}: Hash valid = ${isValid}`);
    }

    console.log('\n🎉 CREDENTIALS FIXED! Try logging in with:');
    console.log('   Email: test@urutix.com');
    console.log('   Password: password123');
    console.log('   OR');
    console.log('   Email: admin@urutix.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error fixing credentials:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixLoginCredentials().catch(console.error);