const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSystemHealth() {
  console.log('🧪 Testing System Health Endpoints...\n');

  try {
    // Test 1: Get current system health
    console.log('1️⃣ Testing GET /api/admin/system-health');
    const healthResponse = await axios.get(`${BASE_URL}/api/admin/system-health`);
    console.log('✅ Current System Health:');
    console.log(JSON.stringify(healthResponse.data, null, 2));
    console.log('');

    // Test 2: Get health history
    console.log('2️⃣ Testing GET /api/admin/system-health/history');
    const historyResponse = await axios.get(`${BASE_URL}/api/admin/system-health/history`, {
      params: {
        service: 'database',
        hours: 24
      }
    });
    console.log('✅ Health History:');
    console.log(`Found ${historyResponse.data.length} health check records`);
    if (historyResponse.data.length > 0) {
      console.log('Latest record:', JSON.stringify(historyResponse.data[0], null, 2));
    }
    console.log('');

    // Test 3: Get uptime statistics
    console.log('3️⃣ Testing GET /api/admin/system-health/uptime');
    const uptimeResponse = await axios.get(`${BASE_URL}/api/admin/system-health/uptime`, {
      params: {
        days: 7
      }
    });
    console.log('✅ Uptime Statistics:');
    console.log(JSON.stringify(uptimeResponse.data, null, 2));
    console.log('');

    console.log('✅ All system health tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Make sure the backend is running on port 3000');
    }
  }
}

async function testTenantManagement() {
  console.log('\n🧪 Testing Tenant Management Endpoints...\n');

  try {
    // First, get a tenant ID to test with
    console.log('0️⃣ Getting tenant list...');
    const tenantsResponse = await axios.get(`${BASE_URL}/api/admin/tenants`);
    
    if (!tenantsResponse.data || tenantsResponse.data.length === 0) {
      console.log('⚠️ No tenants found. Skipping tenant management tests.');
      return;
    }

    const testTenantId = tenantsResponse.data[0].id;
    console.log(`✅ Using tenant ID: ${testTenantId}\n`);

    // Test 1: Get tenant health score
    console.log('1️⃣ Testing GET /api/admin/tenants/:id/health-score');
    const healthScoreResponse = await axios.get(
      `${BASE_URL}/api/admin/tenants/${testTenantId}/health-score`
    );
    console.log('✅ Tenant Health Score:');
    console.log(JSON.stringify(healthScoreResponse.data, null, 2));
    console.log('');

    // Test 2: Get tenant resource usage
    console.log('2️⃣ Testing GET /api/admin/tenants/:id/resource-usage');
    const resourceResponse = await axios.get(
      `${BASE_URL}/api/admin/tenants/${testTenantId}/resource-usage`
    );
    console.log('✅ Tenant Resource Usage:');
    console.log(JSON.stringify(resourceResponse.data, null, 2));
    console.log('');

    // Test 3: Get all tenant health scores
    console.log('3️⃣ Testing GET /api/admin/tenants/health-scores');
    const allScoresResponse = await axios.get(
      `${BASE_URL}/api/admin/tenants/health-scores`
    );
    console.log('✅ All Tenant Health Scores:');
    console.log(`Found ${allScoresResponse.data.length} tenants`);
    allScoresResponse.data.forEach(score => {
      console.log(`  - ${score.tenantName}: ${score.score}/100 (${score.status})`);
    });
    console.log('');

    console.log('✅ All tenant management tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Make sure the backend is running and endpoints are registered');
    }
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SUPER ADMIN FEATURES - API ENDPOINT TESTS');
  console.log('═══════════════════════════════════════════════════════\n');

  await testSystemHealth();
  await testTenantManagement();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  TEST SUITE COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
}

// Run tests
runAllTests().catch(console.error);
