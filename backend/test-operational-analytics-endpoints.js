const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_CREDENTIALS = {
  email: 'system@urutix.com',
  password: 'SecurePass123!'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    authToken = response.data.access_token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testEndpoint(endpoint, description) {
  try {
    console.log(`\n📊 Testing: ${description}`);
    console.log(`   Endpoint: GET ${endpoint}`);
    
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ Success: ${response.status}`);
    console.log(`   Data keys: ${Object.keys(response.data).join(', ')}`);
    
    if (Array.isArray(response.data)) {
      console.log(`   Array length: ${response.data.length}`);
    } else if (response.data && typeof response.data === 'object') {
      console.log(`   Sample data:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${error.response?.status || 'Network Error'}`);
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runOperationalAnalyticsTests() {
  console.log('🚀 Starting Operational Analytics Endpoints Test');
  console.log('================================================');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test operational analytics endpoints
  const tests = [
    {
      endpoint: '/analytics/operational/performance',
      description: 'Performance Metrics'
    },
    {
      endpoint: '/analytics/operational/performance?startDate=2024-01-01&endDate=2024-12-31',
      description: 'Performance Metrics with Date Range'
    },
    {
      endpoint: '/analytics/operational/routes',
      description: 'Route Performance Analysis'
    },
    {
      endpoint: '/analytics/operational/carriers',
      description: 'Carrier Performance Analysis'
    },
    {
      endpoint: '/analytics/operational/carriers?startDate=2024-01-01',
      description: 'Carrier Performance with Date Filter'
    },
    {
      endpoint: '/analytics/operational/market/benchmarks',
      description: 'Industry Benchmarks (Anonymized)'
    },
    {
      endpoint: '/analytics/operational/market/trends',
      description: 'Market Trends Analysis'
    },
    {
      endpoint: '/analytics/operational/market/trends?timeframe=monthly',
      description: 'Monthly Market Trends'
    },
    {
      endpoint: '/analytics/operational/market/trends?timeframe=quarterly',
      description: 'Quarterly Market Trends'
    },
    {
      endpoint: '/analytics/operational/market/positioning',
      description: 'Competitive Positioning'
    },
    {
      endpoint: '/analytics/operational/market/positioning?cargoType=general',
      description: 'Competitive Positioning by Cargo Type'
    }
  ];
  
  let successCount = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    const success = await testEndpoint(test.endpoint, test.description);
    if (success) successCount++;
  }
  
  // Test carrier-specific endpoints (these might fail if no carriers exist)
  console.log('\n🚛 Testing Carrier-Specific Endpoints (may fail if no data)');
  console.log('============================================================');
  
  const carrierTests = [
    {
      endpoint: '/analytics/operational/carriers/test-carrier-id/scorecard',
      description: 'Carrier Scorecard (Test ID)'
    },
    {
      endpoint: '/analytics/operational/carriers/recommendations/test-route-hash',
      description: 'Carrier Recommendations for Route (Test Hash)'
    }
  ];
  
  for (const test of carrierTests) {
    await testEndpoint(test.endpoint, test.description);
  }
  
  // Summary
  console.log('\n📋 Test Summary');
  console.log('===============');
  console.log(`✅ Successful: ${successCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
  console.log(`📊 Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 All operational analytics endpoints are working!');
  } else {
    console.log('\n⚠️  Some endpoints failed - check the errors above');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Ensure database migration has been run');
  console.log('2. Populate sample operational analytics data');
  console.log('3. Test with real carrier and route data');
  console.log('4. Verify market intelligence calculations');
}

// Run the tests
runOperationalAnalyticsTests().catch(console.error);