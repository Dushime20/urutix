/**
 * Test Analytics Endpoints
 * 
 * Tests the newly implemented analytics endpoints to ensure they work correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test credentials - using existing super admin
const TEST_CREDENTIALS = {
  email: 'superadmin@urutix.com',
  password: 'admin123'
};

let authToken = null;

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    
    if (response.data && response.data.accessToken) {
      authToken = response.data.accessToken;
      console.log('✅ Login successful');
      console.log('User:', response.data.user?.email, 'Role:', response.data.user?.role);
      return true;
    } else {
      console.error('❌ Login failed - no token received');
      return false;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testAnalyticsOverview() {
  try {
    console.log('\n📊 Testing Analytics Overview...');
    const response = await axios.get(`${BASE_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Analytics Overview Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Analytics Overview failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testAnalyticsData() {
  try {
    console.log('\n📈 Testing Analytics Data...');
    const response = await axios.get(`${BASE_URL}/analytics/data`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 1,
        limit: 10
      }
    });
    
    console.log('✅ Analytics Data Response:');
    console.log('Total records:', response.data.pagination?.total || 0);
    console.log('Data count:', response.data.data?.length || 0);
    console.log('Sample data:', response.data.data?.[0] || 'No data');
    return true;
  } catch (error) {
    console.error('❌ Analytics Data failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testFinancialCostTrends() {
  try {
    console.log('\n💰 Testing Financial Cost Trends...');
    const response = await axios.get(`${BASE_URL}/analytics/financial/cost-trends`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        timeRange: 'LAST_30_DAYS',
        groupBy: 'WEEK'
      }
    });
    
    console.log('✅ Cost Trends Response:');
    console.log('Trends count:', response.data.trends?.length || 0);
    console.log('Total cost:', response.data.totalCost || 0);
    console.log('Sample trend:', response.data.trends?.[0] || 'No trends');
    return true;
  } catch (error) {
    console.error('❌ Financial Cost Trends failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testFinancialSummary() {
  try {
    console.log('\n📋 Testing Financial Summary...');
    const response = await axios.get(`${BASE_URL}/analytics/financial/summary`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        timeRange: 'LAST_30_DAYS'
      }
    });
    
    console.log('✅ Financial Summary Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Financial Summary failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testInsights() {
  try {
    console.log('\n🧠 Testing Analytics Insights...');
    const response = await axios.get(`${BASE_URL}/analytics/insights`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        page: 1,
        limit: 5
      }
    });
    
    console.log('✅ Insights Response:');
    console.log('Total insights:', response.data.pagination?.total || 0);
    console.log('Insights count:', response.data.data?.length || 0);
    console.log('Sample insight:', response.data.data?.[0] || 'No insights');
    return true;
  } catch (error) {
    console.error('❌ Analytics Insights failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testGenerateInsights() {
  try {
    console.log('\n🔮 Testing Generate Insights...');
    const response = await axios.post(`${BASE_URL}/analytics/insights/generate`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Generate Insights Response:');
    console.log('Generated insights:', response.data?.length || 0);
    console.log('Sample generated insight:', response.data?.[0] || 'No insights generated');
    return true;
  } catch (error) {
    console.error('❌ Generate Insights failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Analytics Endpoints Test Suite\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Test suite aborted - login failed');
    return;
  }
  
  // Run all tests
  const tests = [
    { name: 'Analytics Overview', fn: testAnalyticsOverview },
    { name: 'Analytics Data', fn: testAnalyticsData },
    { name: 'Financial Cost Trends', fn: testFinancialCostTrends },
    { name: 'Financial Summary', fn: testFinancialSummary },
    { name: 'Analytics Insights', fn: testInsights },
    { name: 'Generate Insights', fn: testGenerateInsights },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const success = await test.fn();
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All analytics endpoints are working correctly!');
  } else {
    console.log('\n⚠️  Some endpoints need attention. Check the errors above.');
  }
}

// Run the tests
runAllTests().catch(console.error);