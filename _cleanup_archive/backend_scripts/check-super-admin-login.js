/**
 * Check super admin login
 */

const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();

async function checkSuperAdminLogin() {
    console.log('🔍 Checking super admin login...\n');

    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5433,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'urutix',
    });

    try {
        await client.connect();
        console.log('✅ Database connected');

        // Check super admin user
        const userResult = await client.query(`
            SELECT id, email, "passwordHash", role, status, "createdAt"
            FROM users 
            WHERE email = 'superadmin@urutix.com'
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ Super admin user not found!');
            return;
        }

        const user = userResult.rows[0];
        console.log('📊 Super Admin Details:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Password Hash: ${user.passwordHash ? 'EXISTS' : 'NULL'}`);

        // Test API login
        console.log('\n🔐 Testing API login...');
        try {
            const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
                email: 'superadmin@urutix.com',
                password: 'Admin@123'
            });

            if (loginResponse.data.access_token) {
                console.log('✅ Login successful!');
                console.log('✅ Access token received');
                
                // Test a protected endpoint
                try {
                    const profileResponse = await axios.get('http://localhost:3001/api/auth/profile', {
                        headers: {
                            'Authorization': `Bearer ${loginResponse.data.access_token}`
                        }
                    });
                    console.log('✅ Profile endpoint works');
                    console.log('📊 Profile data:', profileResponse.data);
                } catch (profileError) {
                    console.log('❌ Profile endpoint failed:', profileError.response?.status, profileError.response?.data);
                }
            } else {
                console.log('❌ Login response missing access token');
                console.log('Response:', loginResponse.data);
            }

        } catch (loginError) {
            console.log('❌ Login failed:', loginError.response?.status, loginError.response?.data || loginError.message);
        }

        await client.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

checkSuperAdminLogin();