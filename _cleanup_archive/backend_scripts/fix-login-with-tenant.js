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

async function fixLoginWithTenant() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 FIXING LOGIN WITH TENANT SUPPORT');
    console.log('=' .repeat(50));

    // 1. Get a tenant ID to use
    console.log('\n📋 1. GETTING TENANT ID:');
    const tenantQuery = 'SELECT id, name FROM tenants LIMIT 1';
    const tenantResult = await client.query(tenantQuery);
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenants found, creating one...');
      const createTenantQuery = `
        INSERT INTO tenants (id, name, email, status, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Default Tenant', 'admin@urutix.com', 'ACTIVE', NOW(), NOW())
        RETURNING id, name
      `;
      const newTenant = await client.query(createTenantQuery);
      var tenantId = newTenant.rows[0].id;
      console.log(`✅ Created tenant: ${newTenant.rows[0].name} (${tenantId})`);
    } else {
      var tenantId = tenantResult.rows[0].id;
      console.log(`✅ Using existing tenant: ${tenantResult.rows[0].name} (${tenantId})`);
    }

    // 2. Check existing users and update their passwords
    console.log('\n📋 2. UPDATING EXISTING USER PASSWORDS:');
    
    // Find existing users that we can use for testing
    const existingUsersQuery = `
      SELECT id, email, role, "tenantId"
      FROM users 
      WHERE email IN ('superadmin@urutix.com', 'urutidriver@gmail.com', 'deborahrutagengwa@gmail.com')
      ORDER BY email
    `;
    const existingUsers = await client.query(existingUsersQuery);
    
    console.log(`Found ${existingUsers.rows.length} existing users to update:`);
    
    const passwordUpdates = [
      { email: 'superadmin@urutix.com', password: 'admin123' },
      { email: 'urutidriver@gmail.com', password: 'password123' },
      { email: 'deborahrutagengwa@gmail.com', password: 'password123' }
    ];

    for (const user of existingUsers.rows) {
      const passwordData = passwordUpdates.find(p => p.email === user.email);
      if (passwordData) {
        const hashedPassword = await bcrypt.hash(passwordData.password, 10);
        
        const updateQuery = `
          UPDATE users 
          SET "passwordHash" = $1, status = 'ACTIVE', "emailVerifiedAt" = NOW()
          WHERE id = $2
        `;
        await client.query(updateQuery, [hashedPassword, user.id]);
        console.log(`✅ Updated ${user.email} with password: ${passwordData.password}`);
      }
    }

    // 3. Create a simple test user if needed
    console.log('\n📋 3. CREATING SIMPLE TEST USER:');
    const testEmail = 'test@urutix.com';
    const testPassword = 'password123';
    
    const checkTestUserQuery = 'SELECT id FROM users WHERE email = $1';
    const testUserExists = await client.query(checkTestUserQuery, [testEmail]);
    
    if (testUserExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      const createTestUserQuery = `
        INSERT INTO users (
          id, "tenantId", email, "passwordHash", role, status, 
          "emailVerifiedAt", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, 'ADMIN', 'ACTIVE', 
          NOW(), NOW(), NOW()
        )
      `;
      await client.query(createTestUserQuery, [tenantId, testEmail, hashedPassword]);
      console.log(`✅ Created test user: ${testEmail} with password: ${testPassword}`);
    } else {
      console.log(`✅ Test user ${testEmail} already exists`);
    }

    // 4. Test login with updated credentials
    console.log('\n📋 4. TESTING LOGIN:');
    
    const testCredentials = [
      { email: 'superadmin@urutix.com', password: 'admin123' },
      { email: 'urutidriver@gmail.com', password: 'password123' },
      { email: 'test@urutix.com', password: 'password123' }
    ];

    let successfulLogin = null;

    for (const cred of testCredentials) {
      try {
        console.log(`\n   Testing: ${cred.email}`);
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', cred, {
          timeout: 10000,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173'
          }
        });
        
        console.log(`   Status: ${loginResponse.status}`);
        
        if (loginResponse.status === 200) {
          console.log('   ✅ LOGIN SUCCESSFUL!');
          console.log(`   Token: ${loginResponse.data.token ? 'Received' : 'Missing'}`);
          console.log(`   User: ${loginResponse.data.user?.email || 'No user data'}`);
          console.log(`   Role: ${loginResponse.data.user?.role || 'No role'}`);
          successfulLogin = cred;
          break; // Stop on first successful login
        } else {
          console.log(`   ❌ Login failed`);
          console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
        }
      } catch (error) {
        console.log(`   ❌ Request error: ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Data: ${JSON.stringify(error.response.data)}`);
        }
      }
    }

    // 5. Summary
    console.log('\n📋 5. SUMMARY:');
    if (successfulLogin) {
      console.log('🎉 LOGIN ISSUE FIXED!');
      console.log(`✅ Working credentials: ${successfulLogin.email} / ${successfulLogin.password}`);
      console.log('\n🔑 You can now login with:');
      console.log(`   Email: ${successfulLogin.email}`);
      console.log(`   Password: ${successfulLogin.password}`);
    } else {
      console.log('❌ Login still not working. Need further investigation.');
      
      // Check if there are any authentication issues
      console.log('\n🔍 Additional debugging needed:');
      console.log('   - Check JWT_SECRET in .env');
      console.log('   - Check auth service implementation');
      console.log('   - Check password hashing method');
    }

  } catch (error) {
    console.error('❌ Error fixing login:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixLoginWithTenant().catch(console.error);