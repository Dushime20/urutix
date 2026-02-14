/**
 * Test Login
 * Tests login functionality and diagnoses issues
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const TEST_EMAIL = 'superadmin@urutix.com';
const TEST_PASSWORD = 'SuperAdmin@123';

async function testLogin() {
    console.log('🔐 Testing Login Functionality...\n');
    console.log(`Testing with: ${TEST_EMAIL}\n`);

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Step 1: Check if user exists
        console.log('Step 1: Checking if user exists...');
        const userResult = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [TEST_EMAIL]
        );

        if (userResult.rows.length === 0) {
            console.log('❌ User not found in database!');
            console.log('   The user may not have been created properly.\n');
            console.log('💡 Try running: npm run seed:super-admin\n');
            return;
        }

        const user = userResult.rows[0];
        console.log('✅ User found!');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Tenant ID: ${user.tenantId}`);
        console.log('');

        // Step 2: Check password hash
        console.log('Step 2: Checking password hash...');
        if (!user.passwordHash) {
            console.log('❌ No password hash found!');
            console.log('   The user was created without a password.\n');
            return;
        }
        console.log('✅ Password hash exists');
        console.log(`   Hash: ${user.passwordHash.substring(0, 20)}...`);
        console.log('');

        // Step 3: Verify password
        console.log('Step 3: Verifying password...');
        const isPasswordValid = await bcrypt.compare(TEST_PASSWORD, user.passwordHash);
        
        if (!isPasswordValid) {
            console.log('❌ Password does not match!');
            console.log('   The stored hash does not match the provided password.\n');
            console.log('💡 Possible issues:');
            console.log('   1. Wrong password being used');
            console.log('   2. Password was changed');
            console.log('   3. Hash was corrupted\n');
            console.log('🔧 To fix, run: npm run seed:super-admin (delete user first)\n');
            return;
        }

        console.log('✅ Password is correct!');
        console.log('');

        // Step 4: Check user status
        console.log('Step 4: Checking user status...');
        if (user.status !== 'ACTIVE') {
            console.log(`⚠️  User status is: ${user.status}`);
            console.log('   User must be ACTIVE to login.\n');
            return;
        }
        console.log('✅ User status is ACTIVE');
        console.log('');

        // Step 5: Check tenant
        console.log('Step 5: Checking tenant...');
        const tenantResult = await client.query(
            'SELECT * FROM tenants WHERE id = $1',
            [user.tenantId]
        );

        if (tenantResult.rows.length === 0) {
            console.log('❌ Tenant not found!');
            console.log(`   Tenant ID ${user.tenantId} does not exist.\n`);
            return;
        }

        const tenant = tenantResult.rows[0];
        console.log('✅ Tenant found!');
        console.log(`   Name: ${tenant.name}`);
        console.log(`   Status: ${tenant.status}`);
        console.log('');

        // Step 6: Check email normalization
        console.log('Step 6: Checking email normalization...');
        const normalizedEmail = TEST_EMAIL.trim().toLowerCase();
        if (user.email !== normalizedEmail) {
            console.log('⚠️  Email case mismatch!');
            console.log(`   Database: ${user.email}`);
            console.log(`   Normalized: ${normalizedEmail}`);
            console.log('   This might cause login issues.\n');
        } else {
            console.log('✅ Email is properly normalized');
            console.log('');
        }

        // Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ ALL CHECKS PASSED!');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('The user should be able to login with:');
        console.log(`   Email: ${TEST_EMAIL}`);
        console.log(`   Password: ${TEST_PASSWORD}\n`);
        console.log('If login still fails, check:');
        console.log('   1. Backend server is running (npm run start:dev)');
        console.log('   2. Frontend is connecting to correct API URL');
        console.log('   3. CORS is configured properly');
        console.log('   4. Check browser console for errors');
        console.log('   5. Check backend logs for authentication errors\n');

        // Test API endpoint
        console.log('💡 To test the API directly:');
        console.log(`
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"${TEST_EMAIL}","password":"${TEST_PASSWORD}"}'
        `);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
        console.log('👋 Test complete\n');
    }
}

testLogin();
