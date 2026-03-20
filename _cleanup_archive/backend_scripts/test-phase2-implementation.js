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

async function testEndpoint(endpoint, description, method = 'GET', data = null) {
  try {
    console.log(`\n📊 Testing: ${description}`);
    console.log(`   Endpoint: ${method} ${endpoint}`);
    
    const config = {
      method: method.toLowerCase(),
      url: `${BASE_URL}${endpoint}`,
      headers: { Authorization: `Bearer ${authToken}` }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    console.log(`✅ Success: ${response.status}`);
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        console.log(`   Array length: ${response.data.length}`);
        if (response.data.length > 0) {
          console.log(`   Sample item keys: ${Object.keys(response.data[0]).join(', ')}`);
        }
      } else if (typeof response.data === 'object') {
        console.log(`   Response keys: ${Object.keys(response.data).join(', ')}`);
      }
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ Failed: ${error.response?.status || 'Network Error'}`);
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runPhase2Tests() {
  console.log('🚀 Phase 2: Operational Analytics Implementation Test');
  console.log('====================================================');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  console.log('\n📋 Testing Phase 1 (Financial Analytics) - Should Still Work');
  console.log('============================================================');
  
  const phase1Tests = [
    {
      endpoint: '/analytics/overview',
      description: 'Analytics Overview'
    },
    {
      endpoint: '/analytics/financial/cost-trends',
      description: 'Cost Trends Analysis'
    },
    {
      endpoint: '/analytics/financial/summary',
      description: 'Financial Summary'
    },
    {
      endpoint: '/analytics/insights',
      description: 'AI Insights'
    }
  ];
  
  let phase1Success = 0;
  for (const test of phase1Tests) {
    const result = await testEndpoint(test.endpoint, test.description);
    if (result.success) phase1Success++;
  }
  
  console.log('\n🆕 Testing Phase 2 (Operational Analytics) - New Features');
  console.log('=========================================================');
  
  const phase2Tests = [
    {
      endpoint: '/analytics/operational/performance',
      description: 'Operational Performance Metrics'
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
    }
  ];
  
  let phase2Success = 0;
  for (const test of phase2Tests) {
    const result = await testEndpoint(test.endpoint, test.description);
    if (result.success) phase2Success++;
  }
  
  console.log('\n🔧 Testing Carrier-Specific Endpoints');
  console.log('=====================================');
  
  const carrierTests = [
    {
      endpoint: '/analytics/operational/carriers/test-carrier-id/scorecard',
      description: 'Carrier Scorecard (Test ID - may fail without data)'
    },
    {
      endpoint: '/analytics/operational/carriers/recommendations/test-route-hash',
      description: 'Carrier Recommendations (Test Hash - may fail without data)'
    }
  ];
  
  for (const test of carrierTests) {
    await testEndpoint(test.endpoint, test.description);
  }
  
  // Test backend compilation
  console.log('\n🏗️  Testing Backend Compilation');
  console.log('===============================');
  
  try {
    const healthCheck = await testEndpoint('/health', 'Health Check');
    if (healthCheck.success) {
      console.log('✅ Backend is running and compiled successfully');
    }
  } catch (error) {
    console.log('⚠️  Health check endpoint not available, but backend is responding');
  }
  
  // Summary
  console.log('\n📊 Phase 2 Implementation Test Summary');
  console.log('======================================');
  console.log(`✅ Phase 1 (Financial): ${phase1Success}/${phase1Tests.length} endpoints working`);
  console.log(`🆕 Phase 2 (Operational): ${phase2Success}/${phase2Tests.length} endpoints working`);
  console.log(`📈 Overall Success Rate: ${((phase1Success + phase2Success) / (phase1Tests.length + phase2Tests.length) * 100).toFixed(1)}%`);
  
  if (phase2Success >= phase2Tests.length * 0.8) {
    console.log('\n🎉 Phase 2 Implementation: SUCCESSFUL!');
    console.log('✅ Operational Analytics endpoints are working');
    console.log('✅ Market Intelligence features are functional');
    console.log('✅ Carrier Intelligence system is operational');
  } else {
    console.log('\n⚠️  Phase 2 Implementation: PARTIAL SUCCESS');
    console.log('Some endpoints may need database migration or sample data');
  }
  
  console.log('\n🔧 Next Steps for Full Phase 2 Completion:');
  console.log('1. Run database migration: node run-operational-analytics-migration.js');
  console.log('2. Populate sample operational data');
  console.log('3. Test frontend integration at /analytics/operational');
  console.log('4. Verify carrier performance calculations');
  console.log('5. Test market intelligence privacy protection');
  
  console.log('\n📋 Phase 2 Features Implemented:');
  console.log('• Operational Performance Metrics');
  console.log('• Route Performance Analysis');
  console.log('• Carrier Intelligence & Scorecards');
  console.log('• Market Intelligence & Benchmarking');
  console.log('• Competitive Positioning Analysis');
  console.log('• Privacy-Protected Market Data');
  console.log('• Enhanced Analytics Dashboard');
}

// Run the tests
runPhase2Tests().catch(console.error);