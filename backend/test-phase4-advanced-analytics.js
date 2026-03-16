#!/usr/bin/env node

/**
 * Phase 4 Advanced Analytics Implementation Test Script
 * Tests ML pipeline, real-time processing, and API marketplace endpoints
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

async function runMLPipelineTests() {
  console.log('\n🤖 =================================');
  console.log('🤖 ML PIPELINE TESTS');
  console.log('🤖 =================================\n');

  const tests = [
    {
      method: 'POST',
      endpoint: '/analytics/advanced/ml/train-model',
      data: {
        modelType: 'cost_prediction',
        trainingSize: 1000,
        features: ['distance', 'weight', 'cargoType', 'season']
      },
      description: 'Train ML Model for Cost Prediction'
    },
    {
      method: 'GET',
      endpoint: '/analytics/advanced/ml/predictions',
      params: {
        distanceKm: 500,
        weightKg: 1000,
        cargoType: 'general',
        season: 'summer'
      },
      description: 'Generate ML Predictions'
    },
    {
      method: 'POST',
      endpoint: '/analytics/advanced/ml/optimize-routes',
      data: [
        { routeHash: 'route-123', originCity: 'Lagos', destinationCity: 'Abuja' },
        { routeHash: 'route-456', originCity: 'Port Harcourt', destinationCity: 'Kano' }
      ],
      description: 'ML Route Optimization'
    },
    {
      method: 'GET',
      endpoint: '/analytics/advanced/ml/demand-forecast',
      params: { horizon: 30 },
      description: 'Advanced Demand Forecasting'
    }
  ];

  let successCount = 0;
  for (const test of tests) {
    const result = await testEndpoint(
      test.method,
      test.endpoint,
      test.data || test.params,
      test.description
    );
    if (result.success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { total: tests.length, successful: successCount };
}

async function runRealTimeProcessingTests() {
  console.log('\n⚡ =================================');
  console.log('⚡ REAL-TIME PROCESSING TESTS');
  console.log('⚡ =================================\n');

  const tests = [
    {
      method: 'POST',
      endpoint: '/analytics/advanced/realtime/stream',
      data: {
        streamType: 'cost_alert',
        eventData: {
          currentCost: 15000,
          averageCost: 10000,
          threshold: 12000
        }
      },
      description: 'Process Cost Alert Stream Event'
    },
    {
      method: 'GET',
      endpoint: '/analytics/advanced/realtime/dashboard',
      description: 'Get Real-time Dashboard'
    },
    {
      method: 'POST',
      endpoint: '/analytics/advanced/realtime/monitoring/start',
      data: {
        costThreshold: 10000,
        performanceThreshold: 0.8,
        demandSpikeThreshold: 2.0,
        alertFrequency: 'immediate'
      },
      description: 'Start Real-time Monitoring'
    },
    {
      method: 'POST',
      endpoint: '/analytics/advanced/realtime/batch-process',
      data: [
        {
          streamType: 'performance_drop',
          data: { currentPerformance: 0.7, averagePerformance: 0.9, threshold: 0.8 }
        },
        {
          streamType: 'demand_spike',
          data: { currentDemand: 50, averageDemand: 25, threshold: 1.5 }
        }
      ],
      description: 'Process Batch Updates'
    }
  ];

  let successCount = 0;
  for (const test of tests) {
    const result = await testEndpoint(
      test.method,
      test.endpoint,
      test.data,
      test.description
    );
    if (result.success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { total: tests.length, successful: successCount };
}

async function runApiMarketplaceTests() {
  console.log('\n🔑 =================================');
  console.log('🔑 API MARKETPLACE TESTS');
  console.log('🔑 =================================\n');

  let generatedApiKey = '';

  const tests = [
    {
      method: 'POST',
      endpoint: '/analytics/advanced/api-marketplace/keys',
      data: {
        keyName: 'Test API Key',
        permissions: ['analytics:cost_trends', 'analytics:market_data'],
        rateLimit: 1000,
        expiresInDays: 30
      },
      description: 'Generate API Key'
    },
    {
      method: 'GET',
      endpoint: '/analytics/advanced/api-marketplace/usage',
      params: { timeRange: '24h' },
      description: 'Get API Usage Analytics'
    },
    {
      method: 'GET',
      endpoint: '/analytics/advanced/api-marketplace/documentation',
      description: 'Get API Documentation'
    }
  ];

  let successCount = 0;
  for (const test of tests) {
    const result = await testEndpoint(
      test.method,
      test.endpoint,
      test.data || test.params,
      test.description
    );
    
    if (result.success) {
      successCount++;
      if (test.description === 'Generate API Key' && result.data.apiKey) {
        generatedApiKey = result.data.apiKey;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Test API key management if we have a generated key
  if (generatedApiKey) {
    const managementTests = [
      {
        method: 'PUT',
        endpoint: `/analytics/advanced/api-marketplace/keys/${generatedApiKey}/permissions`,
        data: {
          permissions: ['analytics:cost_trends', 'analytics:market_data', 'analytics:route_performance']
        },
        description: 'Update API Key Permissions'
      },
      {
        method: 'DELETE',
        endpoint: `/analytics/advanced/api-marketplace/keys/${generatedApiKey}`,
        description: 'Deactivate API Key'
      }
    ];

    for (const test of managementTests) {
      const result = await testEndpoint(
        test.method,
        test.endpoint,
        test.data,
        test.description
      );
      if (result.success) successCount++;
      tests.push(test); // Add to total count
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return { total: tests.length, successful: successCount };
}

async function runPublicApiTests() {
  console.log('\n🌐 =================================');
  console.log('🌐 PUBLIC API TESTS');
  console.log('🌐 =================================\n');

  // Note: These tests would require a valid API key
  // For now, we'll test the documentation endpoint which doesn't require auth
  const tests = [
    {
      method: 'GET',
      endpoint: '/public/analytics/documentation',
      description: 'Get Public API Documentation'
    }
  ];

  let successCount = 0;
  for (const test of tests) {
    // Remove auth header for public endpoints
    const result = await testEndpointPublic(
      test.method,
      test.endpoint,
      test.data,
      test.description
    );
    if (result.success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { total: tests.length, successful: successCount };
}

async function testEndpointPublic(method, endpoint, data = null, description = '') {
  try {
    console.log(`\n🧪 Testing: ${description || endpoint}`);
    
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
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

async function main() {
  console.log('🚀 Starting Phase 4 Advanced Analytics Implementation Tests...\n');

  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    process.exit(1);
  }

  // Run all test suites
  const mlResults = await runMLPipelineTests();
  const realtimeResults = await runRealTimeProcessingTests();
  const apiMarketplaceResults = await runApiMarketplaceTests();
  const publicApiResults = await runPublicApiTests();

  // Calculate overall results
  const totalTests = mlResults.total + realtimeResults.total + apiMarketplaceResults.total + publicApiResults.total;
  const totalSuccessful = mlResults.successful + realtimeResults.successful + apiMarketplaceResults.successful + publicApiResults.successful;

  console.log('\n📊 =================================');
  console.log('📊 PHASE 4 TEST RESULTS SUMMARY');
  console.log('📊 =================================');
  console.log(`🤖 ML Pipeline: ${mlResults.successful}/${mlResults.total} tests passed`);
  console.log(`⚡ Real-time Processing: ${realtimeResults.successful}/${realtimeResults.total} tests passed`);
  console.log(`🔑 API Marketplace: ${apiMarketplaceResults.successful}/${apiMarketplaceResults.total} tests passed`);
  console.log(`🌐 Public API: ${publicApiResults.successful}/${publicApiResults.total} tests passed`);
  console.log(`\n✅ Overall Success Rate: ${totalSuccessful}/${totalTests} (${((totalSuccessful / totalTests) * 100).toFixed(1)}%)`);

  if (totalSuccessful === totalTests) {
    console.log('\n🎉 ALL PHASE 4 TESTS PASSED! Advanced Analytics system is fully operational.');
    process.exit(0);
  } else if (totalSuccessful > totalTests * 0.8) {
    console.log('\n⚠️  Most Phase 4 tests passed. Some advanced features may need attention.');
    process.exit(0);
  } else {
    console.log('\n🚨 Many Phase 4 tests failed. Please review the advanced analytics implementation.');
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