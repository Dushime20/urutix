/**
 * Test Script: Verify Credit Marketplace Setup
 * 
 * This script checks if the credit marketplace is properly configured
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test credentials
const TENANT_ADMIN = {
  email: 'tenantadmin@demo.com',
  password: 'TenantAdmin@123'
};

let token = '';

async function login() {
  try {
    console.log('1. Testing login...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TENANT_ADMIN);
    token = response.data.data.accessToken;
    console.log('✓ Login successful\n');
    return true;
  } catch (error) {
    console.error('✗ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testMarketplaceEndpoints() {
  console.log('2. Testing marketplace endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/credits/marketplace/settings', name: 'Get Settings' },
    { method: 'GET', path: '/credits/marketplace/stats', name: 'Get Stats' },
    { method: 'GET', path: '/credits/marketplace/availability', name: 'Get Availability' },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE_URL}${endpoint.path}`,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✓ ${endpoint.name}: ${response.status} ${response.statusText}`);
      console.log(`  Response:`, JSON.stringify(response.data, null, 2).substring(0, 200));
    } catch (error) {
      console.error(`✗ ${endpoint.name}: ${error.response?.status} ${error.response?.statusText}`);
      console.error(`  Error:`, error.response?.data || error.message);
    }
    console.log();
  }
}

async function testConfigureEndpoint() {
  console.log('3. Testing configure endpoint...\n');
  
  try {
    console.log('Testing POST /credits/marketplace/configure...');
    const response = await axios.post(
      `${API_BASE_URL}/credits/marketplace/configure`,
      {
        minPurchaseAmount: 500,
        maxPurchaseAmount: 10000,
        pricePerCredit: 1.0,
        isEnabled: true
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    console.log(`✓ Configure: ${response.status} ${response.statusText}`);
    console.log(`  Response:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(`✗ Configure: ${error.response?.status} ${error.response?.statusText}`);
    console.error(`  Error:`, error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.error('\n⚠️  404 Error - Route not found!');
      console.error('   This usually means:');
      console.error('   1. Backend needs to be restarted');
      console.error('   2. CreditMarketplaceModule is not registered in app.module.ts');
      console.error('   3. Controller path is incorrect');
    }
  }
  console.log();
}

async function checkDatabaseTable() {
  console.log('4. Checking if migration was run...\n');
  console.log('⚠️  Please manually verify:');
  console.log('   1. Run: npm run migration:run (in backend folder)');
  console.log('   2. Check if table exists: SELECT * FROM credit_marketplace_settings;');
  console.log('   3. Restart backend server after migration');
  console.log();
}

async function main() {
  console.log('=== Credit Marketplace Setup Test ===\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  const loggedIn = await login();
  if (!loggedIn) {
    console.error('Cannot proceed without login. Exiting...');
    process.exit(1);
  }

  await testMarketplaceEndpoints();
  await testConfigureEndpoint();
  await checkDatabaseTable();

  console.log('=== Test Complete ===\n');
  console.log('If you see 404 errors, follow these steps:');
  console.log('1. cd backend');
  console.log('2. npm run migration:run');
  console.log('3. Restart backend server (Ctrl+C and npm run start:dev)');
  console.log('4. Run this test again');
}

main().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
