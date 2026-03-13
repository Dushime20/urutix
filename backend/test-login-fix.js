/**
 * Test Login with correct password
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const TEST_EMAIL = 'superadmin@urutix.com';
const TEST_PASSWORD = 'Admin@123'; // Correct password from reset

async function testLogin() {
    console.log('🔐 Testing Login with correct password...\n');
    console.log(`Testing with: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}\n`);

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check if user exists and verify password
        const userResult = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [TEST_EMAIL]
        );

        if (userResult.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }

        const user = userResult.rows[0];
        console.log('✅ User found!');
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}\n`);

        // Test password
        const isPasswordValid = await bcrypt.compare(TEST_PASSWORD, user.passwordHash);
        
        if (isPasswordValid) {
            console.log('✅ Password verification successful!');
            console.log('🎉 Login should work now!\n');
            
            console.log('🔑 Credentials to use:');
            console.log(`   📧 Email: ${TEST_EMAIL}`);
            console.log(`   🔑 Password: ${TEST_PASSWORD}`);
        } else {
            console.log('❌ Password verification failed!');
            console.log('   The password still does not match.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

testLogin();