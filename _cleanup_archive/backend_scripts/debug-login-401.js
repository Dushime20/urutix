const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function debugLogin401() {
  console.log('🔍 DEBUGGING 401 LOGIN ERROR');
  console.log('=' .repeat(50));

  try {
    // 1. Check backend server status
    console.log('\n📋 1. BACKEND SERVER STATUS:');
    try {
      const healthResponse = await axios.get('http://localhost:3001/health', { timeout: 5000 });
      console.log('✅ Backend server is running');
      console.log(`   Status: ${healthResponse.status}`);
      console.log(`   Response: ${JSON.stringify(healthResponse.data)}`);
    } catch (error) {
      console.log('❌ Backend server not responding');
      console.log(`   Error: ${error.message}`);
      return;
    }

    // 2. Check auth endpoint availability
    console.log('\n📋 2. AUTH ENDPOINT CHECK:');
    try {
      const authResponse = await axios.post('http://localhost:3001/api/auth/login', {
        email: 'test@test.com',
        password: 'wrongpassword'
      }, { 
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });
      console.log('✅ Auth endpoint is accessible');
      console.log(`   Status: ${authResponse.status}`);
      console.log(`   Response: ${JSON.stringify(authResponse.data)}`);
    } catch (error) {
      console.log('❌ Auth endpoint not accessible');
      console.log(`   Error: ${error.message}`);
    }

    // 3. Check database connection
    console.log('\n📋 3. DATABASE CONNECTION:');
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) as user_count FROM users');
      console.log('✅ Database connection working');
      console.log(`   Total users: ${result.rows[0].user_count}`);
    } catch (error) {
      console.log('❌ Database connection failed');
      console.log(`   Error: ${error.message}`);
    } finally {
      client.release();
    }

    // 4. Test with known good credentials
    console.log('\n📋 4. TESTING WITH KNOWN CREDENTIALS:');
    const testCredentials = [
      { email: 'admin@urutix.com', password: 'admin123' },
      { email: 'urutidriver@gmail.com', password: 'password123' },
      { email: 'driver@test.com', password: 'password123' },
      { email: 'super@admin.com', password: 'superadmin123' }
    ];

    for (const cred of testCredentials) {
      try {
        console.log(`\n   Testing: ${cred.email}`);
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', cred, {
          timeout: 10000,
          validateStatus: () => true
        });
        
        console.log(`   Status: ${loginResponse.status}`);
        if (loginResponse.status === 200) {
          console.log('   ✅ Login successful!');
          console.log(`   Token received: ${loginResponse.data.token ? 'Yes' : 'No'}`);
        } else {
          console.log('   ❌ Login failed');
          console.log(`   Error: ${JSON.stringify(loginResponse.data)}`);
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    }

    // 5. Check CORS configuration
    console.log('\n📋 5. CORS CONFIGURATION CHECK:');
    try {
      const corsResponse = await axios.options('http://localhost:3001/api/auth/login', {
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 5000,
        validateStatus: () => true
      });
      console.log('✅ CORS preflight check');
      console.log(`   Status: ${corsResponse.status}`);
      console.log(`   CORS Headers: ${JSON.stringify(corsResponse.headers)}`);
    } catch (error) {
      console.log('❌ CORS check failed');
      console.log(`   Error: ${error.message}`);
    }

    // 6. Check environment variables
    console.log('\n📋 6. ENVIRONMENT VARIABLES:');
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Missing'}`);
    console.log(`   DB_HOST: ${process.env.DB_HOST}`);
    console.log(`   DB_PORT: ${process.env.DB_PORT}`);
    console.log(`   PORT: ${process.env.PORT}`);
    console.log(`   ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS}`);

  } catch (error) {
    console.error('❌ Debug script error:', error);
  } finally {
    await pool.end();
  }
}

debugLogin401().catch(console.error);