const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testTruckOwnerLogin() {
  try {
    console.log('🔐 Testing Truck Owner Login and Trucks Access\n');
    console.log(`API URL: ${API_URL}\n`);

    // Step 1: Login as truck owner
    console.log('Step 1: Logging in as truck.owner@test.com...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'truck.owner@test.com',
      password: 'password123', // Try common test password
    });

    const token = loginResponse.data.access_token || loginResponse.data.token;
    const user = loginResponse.data.user;

    console.log('✅ Login successful!');
    console.log(`   User: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant ID: ${user.tenantId}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Decode JWT to see permissions
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('\n📋 JWT Token Payload:');
      console.log(`   User ID: ${payload.userId || payload.sub}`);
      console.log(`   Role: ${payload.role}`);
      console.log(`   Tenant ID: ${payload.tenantId}`);
      
      if (payload.permissions) {
        console.log(`   Permissions in token: ${payload.permissions.length} permissions`);
        const truckPermissions = payload.permissions.filter(p => p.includes('truck'));
        if (truckPermissions.length > 0) {
          console.log(`   Truck permissions:`);
          truckPermissions.forEach(p => console.log(`      - ${p}`));
        } else {
          console.log(`   ❌ NO truck permissions in JWT token!`);
        }
      } else {
        console.log(`   ⚠️ No permissions array in JWT token`);
      }
    }

    // Step 2: Try to access trucks endpoint
    console.log('\n\nStep 2: Accessing /fleet/trucks endpoint...');
    try {
      const trucksResponse = await axios.get(`${API_URL}/fleet/trucks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ Trucks endpoint accessible!');
      console.log(`   Found ${trucksResponse.data.trucks?.length || 0} trucks`);
      if (trucksResponse.data.trucks && trucksResponse.data.trucks.length > 0) {
        console.log(`   First truck: ${trucksResponse.data.trucks[0].plateNumber}`);
      }
    } catch (error) {
      console.log('❌ Trucks endpoint failed!');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.status === 403) {
        console.log('\n🔍 403 Forbidden - This means:');
        console.log('   1. The JWT token does not include truck:view permission');
        console.log('   2. The permission was added to the database AFTER this token was issued');
        console.log('   3. You need to log out and log back in to get a fresh token');
      }
    }

  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Login failed - Invalid credentials');
      console.log('   Try these common passwords:');
      console.log('   - password123');
      console.log('   - Password123');
      console.log('   - test123');
      console.log('   - Test123');
      console.log('\n   Or reset the password using:');
      console.log('   node reset-password-quick.js');
    } else {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
    }
  }
}

testTruckOwnerLogin();
