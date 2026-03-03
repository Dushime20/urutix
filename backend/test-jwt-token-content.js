#!/usr/bin/env node

const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3000/api';

// Test credentials
const TRUCK_OWNER_EMAIL = 'truck.owner@test.com';
const TRUCK_OWNER_PASSWORD = 'test123';

async function main() {
  try {
    console.log('🚀 Testing JWT Token Content\n');

    // Step 1: Login as truck owner
    console.log('📝 Step 1: Logging in as truck owner...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: TRUCK_OWNER_EMAIL,
      password: TRUCK_OWNER_PASSWORD,
    });

    const { accessToken, user } = loginResponse.data;
    console.log(`✅ Login successful!\n`);

    // Step 2: Decode JWT token (without verification to see the payload)
    console.log('📝 Step 2: Decoding JWT token...\n');
    const decoded = jwt.decode(accessToken, { complete: true });

    console.log('🔐 JWT Header:');
    console.log(JSON.stringify(decoded.header, null, 2));

    console.log('\n🔐 JWT Payload:');
    console.log(JSON.stringify(decoded.payload, null, 2));

    console.log('\n📋 Permissions in JWT:');
    if (decoded.payload.permissions && decoded.payload.permissions.length > 0) {
      decoded.payload.permissions.forEach((perm, index) => {
        console.log(`   ${index + 1}. ${perm}`);
      });
    } else {
      console.log(`   ❌ No permissions found in JWT!`);
    }

    // Step 3: Check if truck:view is in permissions
    console.log('\n🔍 Checking for truck:view permission...');
    if (decoded.payload.permissions && decoded.payload.permissions.includes('truck:view')) {
      console.log(`   ✅ truck:view permission is present in JWT`);
    } else {
      console.log(`   ❌ truck:view permission is NOT in JWT`);
      console.log(`   This is why the 403 error is happening!`);
    }

    process.exit(0);

  } catch (error) {
    console.error(`\n❌ Error:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

main();
