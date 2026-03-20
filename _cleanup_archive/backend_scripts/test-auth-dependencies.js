/**
 * Test Auth Service Dependencies
 */

const { Client } = require('pg');
require('dotenv').config();

async function testDependencies() {
    console.log('🔍 Testing Auth Service Dependencies...\n');

    // Test 1: Database Connection
    console.log('1. Testing database connection...');
    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5433,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'urutix',
    });

    try {
        await client.connect();
        console.log('✅ Database connection successful');
        
        // Test user table exists
        const result = await client.query("SELECT COUNT(*) FROM users WHERE email = 'superadmin@urutix.com'");
        console.log(`✅ Super admin user exists: ${result.rows[0].count > 0 ? 'Yes' : 'No'}`);
        
        if (result.rows[0].count > 0) {
            const userResult = await client.query(`
                SELECT id, email, role, status, "passwordHash" IS NOT NULL as has_password, 
                       "loginAttempts", "lockedUntil", "emailVerifiedAt" IS NOT NULL as email_verified
                FROM users 
                WHERE email = 'superadmin@urutix.com'
            `);
            console.log('User details:', userResult.rows[0]);
        }
        
        await client.end();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return;
    }

    // Test 2: JWT Secret
    console.log('\n2. Testing JWT configuration...');
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
        console.log('✅ JWT_SECRET is configured');
        console.log(`Secret preview: ${jwtSecret.substring(0, 10)}...`);
    } else {
        console.log('⚠️  JWT_SECRET not found in environment variables');
        console.log('This will use default secret: "your-secret-key"');
    }

    // Test 3: Required Environment Variables
    console.log('\n3. Testing required environment variables...');
    const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
    let allPresent = true;
    
    for (const varName of requiredVars) {
        const value = process.env[varName];
        if (value) {
            console.log(`✅ ${varName}: ${varName.includes('PASSWORD') ? '***' : value}`);
        } else {
            console.log(`❌ ${varName}: Not set`);
            allPresent = false;
        }
    }
    
    if (allPresent) {
        console.log('✅ All required environment variables are present');
    } else {
        console.log('❌ Some required environment variables are missing');
    }

    console.log('\n4. Testing backend server health...');
    try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:3000/api/auth/rate-limit-info');
        console.log('✅ Backend server is responding');
        console.log('Server response status:', response.status);
    } catch (error) {
        console.error('❌ Backend server health check failed:', error.message);
    }
}

testDependencies();