/**
 * Test Activity Logging System
 * This script tests if activity logging is working by making API requests
 */

const axios = require('axios');
const { Client } = require('pg');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testActivityLogging() {
    console.log('🧪 Testing Activity Logging System\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check initial count
        const beforeCount = await client.query('SELECT COUNT(*) FROM activity_logs');
        console.log(`📊 Activity logs before test: ${beforeCount.rows[0].count}\n`);

        // Test 1: Login (should create activity log)
        console.log('🔐 Test 1: Login...');
        try {
            const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                email: 'admin@urutix.com',
                password: 'Admin@123',
            });

            if (loginResponse.data.accessToken) {
                console.log('✅ Login successful');
                const token = loginResponse.data.accessToken;

                // Wait a moment for the interceptor to log
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Test 2: Make authenticated request
                console.log('\n📋 Test 2: Fetching tenants...');
                try {
                    await axios.get(`${API_URL}/admin/tenants`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    console.log('✅ Tenants fetched successfully');
                } catch (error) {
                    console.log('⚠️  Tenants request failed (but may still be logged)');
                }

                // Wait for logging
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Test 3: Another request
                console.log('\n📊 Test 3: Fetching activity logs...');
                try {
                    await axios.get(`${API_URL}/admin/activity-logs`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    console.log('✅ Activity logs fetched successfully');
                } catch (error) {
                    console.log('⚠️  Activity logs request failed');
                }

                // Wait for logging
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.log('❌ Login failed:', error.response?.data?.message || error.message);
            console.log('   Make sure the backend server is running and credentials are correct\n');
        }

        // Check final count
        const afterCount = await client.query('SELECT COUNT(*) FROM activity_logs');
        console.log(`\n📊 Activity logs after test: ${afterCount.rows[0].count}`);

        const newLogs = parseInt(afterCount.rows[0].count) - parseInt(beforeCount.rows[0].count);
        console.log(`📈 New logs created: ${newLogs}\n`);

        if (newLogs > 0) {
            console.log('✅ SUCCESS! Activity logging is working!\n');

            // Show recent logs
            const recentLogs = await client.query(`
                SELECT 
                    action,
                    resource,
                    ip_address,
                    created_at
                FROM activity_logs
                ORDER BY created_at DESC
                LIMIT 5
            `);

            console.log('📋 Recent Activity Logs:');
            recentLogs.rows.forEach((log, index) => {
                console.log(`   ${index + 1}. ${log.action} - ${log.resource || 'N/A'} (${log.ip_address || 'N/A'})`);
                console.log(`      ${new Date(log.created_at).toLocaleString()}`);
            });
            console.log('');
        } else {
            console.log('⚠️  WARNING: No new activity logs were created');
            console.log('   Possible reasons:');
            console.log('   1. Backend server is not running');
            console.log('   2. Interceptor is not registered correctly');
            console.log('   3. User is not authenticated');
            console.log('   4. ActivityLogService has an error\n');
        }

        // Test suspicious activity detection
        console.log('🔍 Checking for suspicious activities...');
        const suspicious = await client.query(`
            SELECT COUNT(*) FROM activity_logs WHERE is_suspicious = true
        `);
        console.log(`   Suspicious activities: ${suspicious.rows[0].count}\n`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await client.end();
        console.log('👋 Test complete\n');
    }
}

// Run the test
testActivityLogging();
