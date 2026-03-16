#!/usr/bin/env node

/**
 * Phase 3 AI Insights Implementation Test Script
 * Tests all AI insights and predictive analytics endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// Test credentials (update as needed)
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';

async function authenticate() {
  try {
    console.log('🔐 Authenticating test user...');
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_CREDENTIALS);
    authToken = response.data.access_token;
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

async function testEndpoint(method, endpoint, data = null, description = '') {
  try {
    console.log(`\n🧪 Testing: ${description || endpoint}`);
    
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    } else if (data && method === 'GET') {
      config.params = data;
    }

    const response = await axios(config);
    console.log(`✅ ${description || endpoint}: ${response.status} - ${JSON.stringify(response.data).substring(0, 200)}...`);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const statusCode = error.response?.status || 'Unknown';
    console.log(`❌ ${description || endpoint}: ${statusCode} - ${errorMsg}`);
    return { success: false, error: errorMsg, status: statusCode };
  }
}

async function runAIInsightsTests() {
  console.log('\n🤖 =================================');
  console.log('🤖 AI INSIGHTS & PREDICTIVE ANALYTICS TESTS');
  console.log('🤖 =================================\n');

  const tests = [
    // AI Insights Endpoints
    {
      method: 'GET',
      endpoint: '/analytics/ai/dashboard/summary',
      description: 'AI Dashboard Summary'
    },
    {
      method: 'GET',
      endpoint: '/analytics/ai/insights/comprehensive',
      description: 'Comprehensive AI Insights'
    },
    {
      method: 'GET',
      endpoint: '/analytics/ai/predictions/costs',
      params: { daysAhead: 30 },
      description: 'Cost Predictions (30 days)'
    },
    {
      method: 'GET',
      endpoint: '/analytics/ai/predictions/demand',
      description: 'Demand Forecasting'
    },
    {
      method: 'GET',
      endpoint: '/analytics/ai/recommendations/routes',
      description: 'Route Optimization Recommendations'
    },
    {
      method: 'GET',
      endpoint: '/analytics/ai/alerts/risks',
      description: 'Risk Alerts & Anomalies'
    },

    // Predictive Analytics Endpoints
    {
      method: 'GET',
      endpoint: '/analytics/ai/forecasting/costs',
      params: { daysAhead: 30 },
      description: 'Advanced Cost Forecasting'
    },
    {
      method: 'GET',
      endpoint: '/analytics/ai/forecasting/seasonal',
      description: 'Seasonal Demand Patterns'
    },

    // AI Insights Generation
    {
      method: 'POST',
      endpoint: '/analytics/ai/insights/generate',
      description: 'Generate New AI Insights'
    }
  ];

  let successCount = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    const result = await testEndpoint(
      test.method,
      test.endpoint,
      test.params || test.data,
      test.description
    );
    
    if (result.success) {
      successCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 =================================');
  console.log('📊 AI INSIGHTS TEST RESULTS');
  console.log('📊 =================================');
  console.log(`✅ Successful tests: ${successCount}/${totalTests}`);
  console.log(`❌ Failed tests: ${totalTests - successCount}/${totalTests}`);
  console.log(`📈 Success rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);

  if (successCount === totalTests) {
    console.log('\n🎉 ALL AI INSIGHTS TESTS PASSED! Phase 3 implementation is working correctly.');
  } else if (successCount > totalTests * 0.8) {
    console.log('\n⚠️  Most AI insights tests passed. Some endpoints may need attention.');
  } else {
    console.log('\n🚨 Many AI insights tests failed. Please check the implementation.');
  }

  return successCount === totalTests;
}

async function testCarrierSpecificEndpoints() {
  console.log('\n🚛 Testing Carrier-Specific AI Endpoints...');
  
  // Test with a sample carrier ID (this would need to exist in your database)
  const sampleCarrierId = 'carrier-123';
  
  const carrierTests = [
    {
      method: 'GET',
      endpoint: `/analytics/ai/predictions/carrier/${sampleCarrierId}`,
      description: 'Carrier Performance Predictions'
    },
    {
      method: 'GET',
      endpoint: `/analytics/ai/forecasting/carrier/${sampleCarrierId}`,
      params: { daysAhead: 30 },
      description: 'Carrier Performance Forecasting'
    }
  ];

  for (const test of carrierTests) {
    await testEndpoint(
      test.method,
      test.endpoint,
      test.params,
      test.description
    );
  }
}

async function testRouteSpecificEndpoints() {
  console.log('\n🛣️  Testing Route-Specific AI Endpoints...');
  
  // Test with a sample route hash (this would need to exist in your database)
  const sampleRouteHash = 'route-hash-123';
  
  const routeTests = [
    {
      method: 'GET',
      endpoint: `/analytics/ai/forecasting/route/${sampleRouteHash}/efficiency`,
      description: 'Route Efficiency Forecasting'
    },
    {
      method: 'GET',
      endpoint: '/analytics/ai/predictions/costs',
      params: { routeHash: sampleRouteHash, daysAhead: 30 },
      description: 'Route-Specific Cost Predictions'
    }
  ];

  for (const test of routeTests) {
    await testEndpoint(
      test.method,
      test.endpoint,
      test.params,
      test.description
    );
  }
}

async function main() {
  console.log('🚀 Starting Phase 3 AI Insights Implementation Tests...\n');

  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    process.exit(1);
  }

  // Run main AI insights tests
  const mainTestsSuccess = await runAIInsightsTests();

  // Run carrier-specific tests
  await testCarrierSpecificEndpoints();

  // Run route-specific tests
  await testRouteSpecificEndpoints();

  console.log('\n🏁 Phase 3 AI Insights Testing Complete!');
  
  if (mainTestsSuccess) {
    console.log('✅ Phase 3 implementation is ready for production!');
    process.exit(0);
  } else {
    console.log('⚠️  Some issues detected. Please review the failed tests.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});