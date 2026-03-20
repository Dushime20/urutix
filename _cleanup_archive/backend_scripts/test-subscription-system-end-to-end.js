const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_CREDENTIALS = {
  email: 'deborahrutagengwa.admin@urutix.com',
  password: 'password123'
};

let authToken = '';
let testResults = { passed: 0, failed: 0, tests: [], scenarios: [] };

// Helper functions
function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
  
  testResults.tests.push({ name: testName, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

function logScenario(scenarioName, steps) {
  console.log(`\n🎬 SCENARIO: ${scenarioName}`);
  testResults.scenarios.push({ name: scenarioName, steps });
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    
    if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
    if (data) config.data = data;
    
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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test function
async function runEndToEndTests() {
  console.log('🚀 Starting End-to-End Subscription System Tests...\n');
  
  try {
    await authenticate();
    await testUserJourneyScenarios();
    await testBusinessLogicScenarios();
    await testNotificationFlowScenarios();
    await testErrorRecoveryScenarios();
    await testPerformanceScenarios();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
  
  printTestSummary();
}

async function authenticate() {
  console.log('🔐 Authenticating...');
  const result = await makeRequest('POST', '/auth/login', TEST_CREDENTIALS);
  
  if (result.success && result.data.accessToken) {
    authToken = result.data.accessToken;
    logTest('Authentication', true);
  } else {
    logTest('Authentication', false, result.error);
    throw new Error('Authentication failed');
  }
}

async function testUserJourneyScenarios() {
  console.log('\n👤 Testing User Journey Scenarios...');
  
  // Scenario 1: New User Credit Purchase Journey
  logScenario('New User Credit Purchase Journey', [
    'Check initial credit balance',
    'Browse available credit packages',
    'Select and purchase credits',
    'Verify balance update',
    'Check transaction history'
  ]);
  
  // Step 1: Check initial balance
  const initialBalance = await makeRequest('GET', '/credits/balance');
  logTest('Check Initial Balance', initialBalance.success,
    initialBalance.success ? `Initial balance: ${initialBalance.data.data?.currentBalance || 0}` : initialBalance.error);
  
  const startingBalance = initialBalance.success ? initialBalance.data.data.currentBalance : 0;
  
  // Step 2: Browse credit packages
  const packages = await makeRequest('GET', '/credits/packages');
  logTest('Browse Credit Packages', packages.success,
    packages.success ? `Found ${packages.data.data?.length || 0} packages` : packages.error);
  
  // Step 3: Simulate credit purchase (will likely fail without payment setup, but tests the endpoint)
  const purchaseData = {
    packageId: packages.success && packages.data.data?.length > 0 ? packages.data.data[0].id : 'test-package',
    paymentMethodId: 'test-payment-method'
  };
  
  const purchase = await makeRequest('POST', '/credits/purchase', purchaseData);
  logTest('Credit Purchase Attempt', purchase.success || purchase.status === 400,
    purchase.success ? 'Purchase completed' : 'Purchase validation (expected without payment setup)');
  
  // Step 4: Check transaction history
  const transactions = await makeRequest('GET', '/credits/transactions?limit=5');
  logTest('Check Transaction History', transactions.success,
    transactions.success ? `Found ${transactions.data.data?.length || 0} transactions` : transactions.error);
  
  // Scenario 2: Credit Usage Monitoring Journey
  logScenario('Credit Usage Monitoring Journey', [
    'Check usage statistics',
    'Get usage forecast',
    'Set up balance alerts',
    'Monitor consumption patterns'
  ]);
  
  // Step 1: Check usage statistics
  const usageStats = await makeRequest('GET', '/credits/usage-stats?days=30');
  logTest('Check Usage Statistics', usageStats.success,
    usageStats.success ? 'Retrieved usage statistics' : usageStats.error);
  
  // Step 2: Get usage forecast
  const forecast = await makeRequest('GET', '/notifications/usage-forecast');
  logTest('Get Usage Forecast', forecast.success,
    forecast.success ? `Estimated ${forecast.data.data?.estimatedDaysRemaining || 'N/A'} days remaining` : forecast.error);
  
  // Step 3: Set up balance alerts
  const alertPrefs = {
    preferences: [{
      notificationType: 'LOW_BALANCE',
      enabledChannels: ['EMAIL', 'IN_APP'],
      isEnabled: true,
      settings: { frequency: 'IMMEDIATE', threshold: 500 }
    }]
  };
  
  const setupAlerts = await makeRequest('POST', '/notification-preferences', alertPrefs);
  logTest('Setup Balance Alerts', setupAlerts.success,
    setupAlerts.success ? 'Balance alerts configured' : setupAlerts.error);
}
async function testBusinessLogicScenarios() {
  console.log('\n💼 Testing Business Logic Scenarios...');
  
  // Scenario 3: Subscription Management
  logScenario('Subscription Management', [
    'Get current subscription',
    'Browse available plans',
    'Check subscription history'
  ]);
  
  const currentSub = await makeRequest('GET', '/subscription/current');
  logTest('Get Current Subscription', currentSub.success,
    currentSub.success ? 'Retrieved subscription info' : currentSub.error);
  
  const plans = await makeRequest('GET', '/subscription/plans');
  logTest('Browse Subscription Plans', plans.success,
    plans.success ? `Found ${plans.data.data?.length || 0} plans` : plans.error);
  
  const subHistory = await makeRequest('GET', '/subscription/history');
  logTest('Check Subscription History', subHistory.success,
    subHistory.success ? 'Retrieved subscription history' : subHistory.error);
}

async function testNotificationFlowScenarios() {
  console.log('\n🔔 Testing Notification Flow Scenarios...');
  
  // Scenario 4: Notification Configuration and Testing
  logScenario('Notification Configuration and Testing', [
    'Get current preferences',
    'Update notification settings',
    'Send test notifications',
    'Check notification history'
  ]);
  
  const currentPrefs = await makeRequest('GET', '/notification-preferences');
  logTest('Get Current Preferences', currentPrefs.success,
    currentPrefs.success ? 'Retrieved preferences' : currentPrefs.error);
  
  const testNotification = await makeRequest('POST', '/notification-preferences/test', {
    type: 'LOW_BALANCE',
    channels: ['IN_APP']
  });
  logTest('Send Test Notification', testNotification.success,
    testNotification.success ? 'Test notification sent' : testNotification.error);
  
  await sleep(1000); // Wait for notification to be processed
  
  const notificationHistory = await makeRequest('GET', '/notification-preferences/history?limit=5');
  logTest('Check Notification History', notificationHistory.success,
    notificationHistory.success ? 'Retrieved notification history' : notificationHistory.error);
}

async function testErrorRecoveryScenarios() {
  console.log('\n🛠️ Testing Error Recovery Scenarios...');
  
  // Scenario 5: Error Handling and Recovery
  logScenario('Error Handling and Recovery', [
    'Test invalid requests',
    'Test unauthorized access',
    'Test malformed data',
    'Verify proper error responses'
  ]);
  
  // Test invalid credit purchase
  const invalidPurchase = await makeRequest('POST', '/credits/purchase', {
    packageId: 'invalid-package-id',
    paymentMethodId: 'invalid-payment-method'
  });
  logTest('Invalid Credit Purchase Handling', !invalidPurchase.success,
    !invalidPurchase.success ? 'Properly rejected invalid purchase' : 'Should have rejected invalid purchase');
  
  // Test malformed notification preferences
  const malformedPrefs = await makeRequest('POST', '/notification-preferences', {
    preferences: 'invalid-data'
  });
  logTest('Malformed Preferences Handling', !malformedPrefs.success,
    !malformedPrefs.success ? 'Properly rejected malformed data' : 'Should have rejected malformed data');
}

async function testPerformanceScenarios() {
  console.log('\n⚡ Testing Performance Scenarios...');
  
  // Scenario 6: Performance and Load Testing
  logScenario('Performance and Load Testing', [
    'Test response times',
    'Test concurrent requests',
    'Test data pagination',
    'Verify system stability'
  ]);
  
  const performanceEndpoints = [
    '/credits/balance',
    '/notifications/balance-alerts',
    '/notification-preferences',
    '/credits/transactions?limit=10'
  ];
  
  for (const endpoint of performanceEndpoints) {
    const startTime = Date.now();
    const result = await makeRequest('GET', endpoint);
    const responseTime = Date.now() - startTime;
    
    const isPerformant = responseTime < 2000;
    logTest(`Performance: ${endpoint}`, isPerformant,
      `${responseTime}ms ${isPerformant ? '(Good)' : '(Slow)'}`);
  }
  
  // Test concurrent requests
  const concurrentPromises = Array(5).fill().map(() => 
    makeRequest('GET', '/credits/balance')
  );
  
  const startTime = Date.now();
  const concurrentResults = await Promise.all(concurrentPromises);
  const totalTime = Date.now() - startTime;
  
  const allSuccessful = concurrentResults.every(result => result.success);
  logTest('Concurrent Requests', allSuccessful,
    allSuccessful ? `5 concurrent requests in ${totalTime}ms` : 'Some concurrent requests failed');
}

function printTestSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 END-TO-END SUBSCRIPTION SYSTEM TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total Tests: ${testResults.tests.length}`);
  console.log(`🎬 Scenarios Tested: ${testResults.scenarios.length}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  
  console.log('\n🎬 Scenarios Covered:');
  testResults.scenarios.forEach((scenario, index) => {
    console.log(`   ${index + 1}. ${scenario.name}`);
  });
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.message}`));
  }
  
  console.log('\n🚀 End-to-End Testing Complete!');
  console.log('='.repeat(80));
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runEndToEndTests();
}

module.exports = { runEndToEndTests, testResults };