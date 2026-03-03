const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testSubdomainRouting() {
  console.log('='.repeat(60));
  console.log('SUBDOMAIN ROUTING TEST');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Request without subdomain
  console.log('1. Testing request WITHOUT subdomain header...');
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      headers: {
        'Host': 'localhost:3000'
      }
    });
    console.log('✅ Request successful (no subdomain required for health check)');
  } catch (error) {
    console.log('Response:', error.response?.status, error.response?.statusText);
  }
  console.log();

  // Test 2: Request with subdomain header
  console.log('2. Testing request WITH subdomain header...');
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      headers: {
        'Host': 'gasa.localhost:3000',
        'X-Tenant-Subdomain': 'gasa'
      }
    });
    console.log('✅ Request successful with subdomain header');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Tenant "gasa" not found in database');
      console.log('   Run: node check-tenant-subdomains.js');
    } else {
      console.log('Response:', error.response?.status, error.response?.statusText);
    }
  }
  console.log();

  // Test 3: CORS preflight
  console.log('3. Testing CORS preflight...');
  try {
    const response = await axios.options(`${BASE_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,x-tenant-subdomain'
      }
    });
    console.log('✅ CORS preflight successful');
    console.log('   Allowed methods:', response.headers['access-control-allow-methods']);
    console.log('   Allowed headers:', response.headers['access-control-allow-headers']);
  } catch (error) {
    console.log('❌ CORS preflight failed:', error.message);
  }
  console.log();

  // Test 4: Subdomain with localhost variant
  console.log('4. Testing subdomain.localhost pattern...');
  try {
    const response = await axios.get(`${BASE_URL}/health`, {
      headers: {
        'Host': 'tenant1.localhost:3000',
        'Origin': 'http://tenant1.localhost:5173'
      }
    });
    console.log('✅ Subdomain.localhost pattern works');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  Tenant not found (expected if tenant1 subdomain not configured)');
    } else {
      console.log('Response:', error.response?.status, error.response?.statusText);
    }
  }
  console.log();

  console.log('='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
  console.log();
  console.log('Next steps:');
  console.log('1. Check tenant subdomains: node check-tenant-subdomains.js');
  console.log('2. Add subdomains if needed: node add-tenant-subdomains.js');
  console.log('3. Update hosts file for local testing');
  console.log('4. Restart backend: npm run start:dev');
}

testSubdomainRouting();
