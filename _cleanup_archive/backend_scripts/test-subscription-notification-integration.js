const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_CREDENTIALS = {
  email: 'deborahrutagengwa.admin@urutix.com',
  password: 'password123'
};

let authToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper functions
function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
  
  testResults.tests.push({
    name: testName,
    passed,
    message
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test Suite
async function runSubscriptionNotificationIntegrationTests() {
  console.log('🚀 Starting Subscription & Notification Integration Tests...\n');
  
  try {
    // 1. Authentication Test
    await testAuthentication();
    
    // 2. Subscription System Tests
    await testSubscriptionEndpoints();
    
    // 3. Credit System Tests
    await testCreditEndpoints();
    
    // 4. Notification System Tests
    await testNotificationEndpoints();
    
    // 5. Notification Preferences Tests
    await testNotificationPreferences();
    
    // 6. Integration Flow Tests
    await testIntegrationFlows();
    
    // 7. Performance Tests
    await testPerformance();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
  
  // Print summary
  printTestSummary();
}

async function testAuthentication() {
  console.log('📋 Testing Authentication...');
  
  const loginResult = await makeRequest('POST', '/auth/login', TEST_CREDENTIALS);
  
  if (loginResult.success && loginResult.data.accessToken) {
    authToken = loginResult.data.accessToken;
    logTest('User Login', true, 'Successfully authenticated');
  } else {
    logTest('User Login', false, 'Failed to authenticate');
    throw new Error('Authentication failed - cannot continue tests');
  }
}

async function testSubscriptionEndpoints() {
  console.log('\n📋 Testing Subscription Endpoints...');
  
  // Test subscription plans
  const plansResult = await makeRequest('GET', '/subscriptions/plans');
  logTest('Get Subscription Plans', plansResult.success, 
    plansResult.success ? `Found ${plansResult.data.data?.length || 0} plans` : plansResult.error);
  
  // Test current subscription
  const currentSubResult = await makeRequest('GET', '/subscriptions/current');
  logTest('Get Current Subscription', currentSubResult.success,
    currentSubResult.success ? 'Retrieved subscription info' : currentSubResult.error);
  
  // Test subscription history
  const historyResult = await makeRequest('GET', '/subscriptions/history');
  logTest('Get Subscription History', historyResult.success,
    historyResult.success ? 'Retrieved subscription history' : historyResult.error);
}

async function testCreditEndpoints() {
  console.log('\n📋 Testing Credit System Endpoints...');
  
  // Test credit balance
  const balanceResult = await makeRequest('GET', '/credits/balance');
  logTest('Get Credit Balance', balanceResult.success,
    balanceResult.success ? `Balance: ${balanceResult.data.data?.currentBalance || 0} credits` : balanceResult.error);
  
  // Test credit packages
  const packagesResult = await makeRequest('GET', '/credits/packages');
  logTest('Get Credit Packages', packagesResult.success,
    packagesResult.success ? `Found ${packagesResult.data.data?.length || 0} packages` : packagesResult.error);
  
  // Test credit transactions
  const transactionsResult = await makeRequest('GET', '/credits/transactions?limit=10');
  logTest('Get Credit Transactions', transactionsResult.success,
    transactionsResult.success ? 'Retrieved transaction history' : transactionsResult.error);
  
  // Test usage statistics
  const usageStats = await makeRequest('GET', '/credits/usage/statistics?days=30');
  logTest('Get Usage Statistics', usageStats.success,
    usageStats.success ? 'Retrieved usage statistics' : usageStats.error);
}

async function testNotificationEndpoints() {
  console.log('\n📋 Testing Notification Endpoints...');
  
  // Test balance alerts
  const alertsResult = await makeRequest('GET', '/subscription/notifications/balance-alerts');
  logTest('Get Balance Alerts', alertsResult.success,
    alertsResult.success ? `Alert level: ${alertsResult.data.data?.alertLevel || 'NORMAL'}` : alertsResult.error);
  
  // Test usage forecast
  const forecastResult = await makeRequest('GET', '/subscription/notifications/usage-forecast');
  logTest('Get Usage Forecast', forecastResult.success,
    forecastResult.success ? 'Retrieved usage forecast' : forecastResult.error);
  
  // Test subscription status
  const subStatusResult = await makeRequest('GET', '/subscription/notifications/subscription-status');
  logTest('Get Subscription Status', subStatusResult.success,
    subStatusResult.success ? 'Retrieved subscription status' : subStatusResult.error);
  
  // Test low balance partners (tenant admin only)
  const partnersResult = await makeRequest('GET', '/subscription/notifications/low-balance-partners?threshold=1000');
  logTest('Get Low Balance Partners', partnersResult.success || partnersResult.status === 403,
    partnersResult.success ? 'Retrieved partner data' : 'Access restricted (expected for non-admin)');
}

async function testNotificationPreferences() {
  console.log('\n📋 Testing Notification Preferences...');
  
  // Test get preferences
  const getPrefsResult = await makeRequest('GET', '/notification-preferences');
  logTest('Get Notification Preferences', getPrefsResult.success,
    getPrefsResult.success ? 'Retrieved preferences' : getPrefsResult.error);
  
  // Test update preferences
  const updateData = {
    preferences: [
      {
        notificationType: 'LOW_BALANCE',
        enabledChannels: ['EMAIL', 'IN_APP'],
        isEnabled: true,
        settings: { frequency: 'IMMEDIATE' }
      }
    ]
  };
  
  const updatePrefsResult = await makeRequest('POST', '/notification-preferences', updateData);
  logTest('Update Notification Preferences', updatePrefsResult.success,
    updatePrefsResult.success ? 'Updated preferences' : updatePrefsResult.error);
  
  // Test notification history
  const historyResult = await makeRequest('GET', '/notification-preferences/history?limit=10');
  logTest('Get Notification History', historyResult.success,
    historyResult.success ? 'Retrieved notification history' : historyResult.error);
  
  // Test notification stats
  const statsResult = await makeRequest('GET', '/notification-preferences/stats?days=30');
  logTest('Get Notification Stats', statsResult.success,
    statsResult.success ? 'Retrieved notification statistics' : statsResult.error);
}

async function testIntegrationFlows() {
  console.log('\n📋 Testing Integration Flows...');
  
  // Test credit purchase flow simulation
  const purchaseData = {
    packageId: 'test-package-id',
    paymentMethodId: 'test-payment-method'
  };
  
  const purchaseResult = await makeRequest('POST', '/credits/purchase', purchaseData);
  logTest('Credit Purchase Flow', purchaseResult.success || purchaseResult.status === 400,
    purchaseResult.success ? 'Purchase completed' : 'Purchase validation (expected)');
  
  // Test notification sending
  const testNotificationResult = await makeRequest('POST', '/notification-preferences/test', {
    type: 'LOW_BALANCE',
    channels: ['EMAIL', 'IN_APP']
  });
  logTest('Send Test Notification', testNotificationResult.success,
    testNotificationResult.success ? 'Test notification sent' : testNotificationResult.error);
  
  // Test admin test notification
  const adminTestResult = await makeRequest('POST', '/subscription/notifications/test/low_balance');
  logTest('Admin Test Notification', adminTestResult.success || adminTestResult.status === 403,
    adminTestResult.success ? 'Admin notification sent' : 'Access restricted (expected for non-admin)');
}

async function testPerformance() {
  console.log('\n📋 Testing Performance...');
  
  const endpoints = [
    '/credits/balance',
    '/subscription/notifications/balance-alerts',
    '/notification-preferences'
  ];
  
  for (const endpoint of endpoints) {
    const startTime = Date.now();
    const result = await makeRequest('GET', endpoint);
    const responseTime = Date.now() - startTime;
    
    const isPerformant = responseTime < 2000; // 2 seconds threshold
    logTest(`Performance: ${endpoint}`, isPerformant,
      `${responseTime}ms ${isPerformant ? '(Good)' : '(Slow)'}`);
  }
}

function printTestSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.tests.length}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   - ${test.name}: ${test.message}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
if (require.main === module) {
  runSubscriptionNotificationIntegrationTests();
}

module.exports = {
  runSubscriptionNotificationIntegrationTests,
  testResults
};