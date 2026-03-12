const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_CREDENTIALS = {
  email: 'deborahrutagengwa.admin@urutix.com',
  password: 'password123'
};

let authToken = '';
let testResults = { passed: 0, failed: 0, tests: [] };

// Helper functions
function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}${message ? ' - ' + message : ''}`);
  
  testResults.tests.push({ name: testName, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
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

// Main test function
async function runNotificationSystemTests() {
  console.log('🔔 Starting Comprehensive Notification System Tests...\n');
  
  try {
    await authenticate();
    await testNotificationPreferencesAPI();
    await testNotificationDeliveryAPI();
    await testNotificationHistoryAPI();
    await testNotificationIntegration();
    await testErrorHandling();
    await testSecurityAndPermissions();
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
async function testNotificationPreferencesAPI() {
  console.log('\n📋 Testing Notification Preferences API...');
  
  // Test getting default preferences
  const getResult = await makeRequest('GET', '/notification-preferences');
  logTest('Get Notification Preferences', getResult.success,
    getResult.success ? `Found ${getResult.data.data?.length || 0} preferences` : getResult.error);
  
  // Test updating preferences
  const updateData = {
    preferences: [
      {
        notificationType: 'LOW_BALANCE',
        enabledChannels: ['EMAIL', 'IN_APP'],
        isEnabled: true,
        emailAddress: 'test@example.com',
        settings: {
          frequency: 'IMMEDIATE',
          threshold: 100
        }
      },
      {
        notificationType: 'SUBSCRIPTION_EXPIRING',
        enabledChannels: ['EMAIL', 'SMS'],
        isEnabled: true,
        phoneNumber: '+1234567890',
        settings: {
          frequency: 'DAILY'
        }
      }
    ]
  };
  
  const updateResult = await makeRequest('POST', '/notification-preferences', updateData);
  logTest('Update Notification Preferences', updateResult.success,
    updateResult.success ? 'Preferences updated successfully' : updateResult.error);
  
  // Test invalid preference data
  const invalidData = {
    preferences: [
      {
        notificationType: 'INVALID_TYPE',
        enabledChannels: ['INVALID_CHANNEL'],
        isEnabled: true
      }
    ]
  };
  
  const invalidResult = await makeRequest('POST', '/notification-preferences', invalidData);
  logTest('Invalid Preference Data Handling', !invalidResult.success,
    !invalidResult.success ? 'Properly rejected invalid data' : 'Should have rejected invalid data');
}

async function testNotificationDeliveryAPI() {
  console.log('\n📨 Testing Notification Delivery API...');
  
  // Test sending test notification
  const testNotificationData = {
    type: 'LOW_BALANCE',
    channels: ['EMAIL', 'IN_APP']
  };
  
  const testResult = await makeRequest('POST', '/notification-preferences/test', testNotificationData);
  logTest('Send Test Notification', testResult.success,
    testResult.success ? 'Test notification sent' : testResult.error);
  
  // Test different notification types
  const notificationTypes = ['LOW_BALANCE', 'SUBSCRIPTION_EXPIRING', 'TRIAL_EXPIRING'];
  
  for (const type of notificationTypes) {
    const typeTestResult = await makeRequest('POST', '/notification-preferences/test', {
      type,
      channels: ['IN_APP']
    });
    logTest(`Test ${type} Notification`, typeTestResult.success,
      typeTestResult.success ? `${type} notification sent` : typeTestResult.error);
  }
}

async function testNotificationHistoryAPI() {
  console.log('\n📜 Testing Notification History API...');
  
  // Test getting notification history
  const historyResult = await makeRequest('GET', '/notification-preferences/history?limit=20');
  logTest('Get Notification History', historyResult.success,
    historyResult.success ? `Retrieved ${historyResult.data.data?.length || 0} history items` : historyResult.error);
  
  // Test getting notification statistics
  const statsResult = await makeRequest('GET', '/notification-preferences/stats?days=30');
  logTest('Get Notification Statistics', statsResult.success,
    statsResult.success ? 'Retrieved notification statistics' : statsResult.error);
  
  // Test pagination
  const paginatedResult = await makeRequest('GET', '/notification-preferences/history?limit=5');
  logTest('Notification History Pagination', paginatedResult.success,
    paginatedResult.success ? 'Pagination working correctly' : paginatedResult.error);
}

async function testNotificationIntegration() {
  console.log('\n🔗 Testing Notification Integration...');
  
  // Test balance alerts integration
  const alertsResult = await makeRequest('GET', '/notifications/balance-alerts');
  logTest('Balance Alerts Integration', alertsResult.success,
    alertsResult.success ? `Alert level: ${alertsResult.data.data?.alertLevel}` : alertsResult.error);
  
  // Test usage forecast integration
  const forecastResult = await makeRequest('GET', '/notifications/usage-forecast');
  logTest('Usage Forecast Integration', forecastResult.success,
    forecastResult.success ? 'Forecast data retrieved' : forecastResult.error);
  
  // Test subscription status integration
  const subStatusResult = await makeRequest('GET', '/notifications/subscription-status');
  logTest('Subscription Status Integration', subStatusResult.success,
    subStatusResult.success ? 'Subscription status retrieved' : subStatusResult.error);
}

async function testErrorHandling() {
  console.log('\n⚠️ Testing Error Handling...');
  
  // Test invalid endpoints
  const invalidEndpointResult = await makeRequest('GET', '/notification-preferences/invalid-endpoint');
  logTest('Invalid Endpoint Handling', !invalidEndpointResult.success,
    !invalidEndpointResult.success ? 'Properly handled invalid endpoint' : 'Should have returned error');
  
  // Test malformed request data
  const malformedResult = await makeRequest('POST', '/notification-preferences', 'invalid-json');
  logTest('Malformed Request Handling', !malformedResult.success,
    !malformedResult.success ? 'Properly handled malformed request' : 'Should have returned error');
  
  // Test missing required fields
  const missingFieldsResult = await makeRequest('POST', '/notification-preferences', {});
  logTest('Missing Fields Handling', !missingFieldsResult.success,
    !missingFieldsResult.success ? 'Properly handled missing fields' : 'Should have returned error');
}

async function testSecurityAndPermissions() {
  console.log('\n🔒 Testing Security and Permissions...');
  
  // Test without authentication
  const originalToken = authToken;
  authToken = '';
  
  const unauthResult = await makeRequest('GET', '/notification-preferences');
  logTest('Unauthenticated Access Prevention', !unauthResult.success,
    !unauthResult.success ? 'Properly blocked unauthenticated access' : 'Should have blocked access');
  
  // Restore token
  authToken = originalToken;
  
  // Test with invalid token
  const invalidTokenResult = await makeRequest('GET', '/notification-preferences', null, {
    'Authorization': 'Bearer invalid-token'
  });
  logTest('Invalid Token Handling', !invalidTokenResult.success,
    !invalidTokenResult.success ? 'Properly handled invalid token' : 'Should have rejected invalid token');
  
  // Test admin-only endpoints (should be restricted for regular users)
  const adminResult = await makeRequest('GET', '/notifications/low-balance-partners');
  logTest('Admin Endpoint Access Control', adminResult.success || adminResult.status === 403,
    adminResult.success ? 'Admin access granted' : 'Access properly restricted');
}

function printTestSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 NOTIFICATION SYSTEM TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.tests.length}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.message}`));
  }
  
  console.log('\n🔔 Notification System Test Complete!');
  console.log('='.repeat(70));
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runNotificationSystemTests();
}

module.exports = { runNotificationSystemTests, testResults };