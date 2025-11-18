const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function fixTruckOwnerUser() {
  console.log('🚛 Fixing Truck Owner User...\n');
  
  const pool = new Pool(dbConfig);
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Get the default tenant
    console.log('🏢 Getting default tenant...');
    const tenantResult = await pool.query('SELECT id FROM tenants WHERE "isActive" = true LIMIT 1');
    if (tenantResult.rows.length === 0) {
      throw new Error('No active tenant found. Please ensure the default tenant exists.');
    }
    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Using tenant: ${tenantId}\n`);
    
    const email = 'truck.owner@test.com';
    const password = 'test123';
    
    // Check if user exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await pool.query('SELECT id, email, role, status FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length === 0) {
      console.log('👤 User does not exist. Creating truck owner user...');
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user
      const userResult = await pool.query(`
        INSERT INTO users (id, "tenantId", email, phone, "passwordHash", role, status, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, role, status
      `, [tenantId, email, '+1-555-0102', passwordHash, 'TRUCK_OWNER', 'ACTIVE']);
      
      const userId = userResult.rows[0].id;
      console.log(`✅ User created: ${email} (ID: ${userId})\n`);
      
      // Create profile
      console.log('👤 Creating user profile...');
      await pool.query(`
        INSERT INTO user_profiles (id, "userId", "tenantId", "firstName", "lastName", "companyName", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT ("userId") DO UPDATE SET
          "firstName" = EXCLUDED."firstName",
          "lastName" = EXCLUDED."lastName",
          "companyName" = EXCLUDED."companyName",
          "updatedAt" = NOW()
      `, [userId, tenantId, 'Truck', 'Owner', 'Test Trucking Company']);
      
      console.log('✅ Profile created/updated\n');
    } else {
      const user = existingUser.rows[0];
      console.log(`✅ User exists: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}\n`);
      
      // Verify and update password
      console.log('🔐 Verifying password...');
      const userWithPassword = await pool.query('SELECT "passwordHash" FROM users WHERE email = $1', [email]);
      
      if (userWithPassword.rows[0] && userWithPassword.rows[0].passwordHash) {
        const isValid = await bcrypt.compare(password, userWithPassword.rows[0].passwordHash);
        console.log(`   Password valid: ${isValid}`);
        
        if (!isValid) {
          console.log('⚠️  Password does not match. Updating password...');
          const newPasswordHash = await bcrypt.hash(password, 10);
          await pool.query('UPDATE users SET "passwordHash" = $1, "updatedAt" = NOW() WHERE email = $2', [newPasswordHash, email]);
          console.log('✅ Password updated\n');
        } else {
          console.log('✅ Password is correct\n');
        }
      } else {
        console.log('⚠️  No password hash found. Setting password...');
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET "passwordHash" = $1, "updatedAt" = NOW() WHERE email = $2', [passwordHash, email]);
        console.log('✅ Password set\n');
      }
      
      // Ensure user is active
      if (user.status !== 'ACTIVE') {
        console.log('⚠️  User is not active. Activating...');
        await pool.query('UPDATE users SET status = $1, "updatedAt" = NOW() WHERE email = $2', ['ACTIVE', email]);
        console.log('✅ User activated\n');
      }
      
      // Ensure user has correct role
      if (user.role !== 'TRUCK_OWNER') {
        console.log('⚠️  User role is incorrect. Updating...');
        await pool.query('UPDATE users SET role = $1, "updatedAt" = NOW() WHERE email = $2', ['TRUCK_OWNER', email]);
        console.log('✅ Role updated to TRUCK_OWNER\n');
      }
    }
    
    console.log('📝 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role: TRUCK_OWNER');
    console.log('   Status: ACTIVE');
    console.log('\n✅ Truck owner user is ready!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  fixTruckOwnerUser()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixTruckOwnerUser };

