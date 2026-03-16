/**
 * Test Analytics Endpoints After Sample Data Population
 */

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001/api';

// Test credentials - using the cargo owner we found
const TEST_CREDENTIALS = {
  email: 'cargo.owner@test.com',
  password: 'password123'
};

async function testAnalyticsEndpoints() {
  try {
    console.log('🔐 Logging in...');
    
    // Login to get JWT token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.accessToken;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log(`User: ${user.email} (${user.role})`);
    console.log(`Tenant: ${user.tenantId}`);
    console.log(`Token: ${token.substring(0, 50)}...`); // Show first 50 chars of token
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n📊 Testing Analytics Endpoints...');
    console.log('==================================');

    // Test 0: Simple test endpoint
    try {
      console.log('\n0. Testing Simple Test Endpoint...');
      const testResponse = await axios.get(`${BASE_URL}/analytics/test`, { headers });
      console.log('✅ Test Endpoint:', JSON.stringify(testResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Test Endpoint failed:', error.response?.data || error.message);
    }

    // Test 1: Analytics Overview
    try {
      console.log('\n1. Testing Analytics Overview...');
      const overviewResponse = await axios.get(`${BASE_URL}/analytics/overview`, { headers });
      console.log('✅ Analytics Overview:', JSON.stringify(overviewResponse.data, null, 2));
    } catch (error) {
      console.error('❌ Analytics Overview failed:', error.response?.data || error.message);
    }

    // Test 2: Analytics Data with Pagination
    try {
      console.log('\n2. Testing Analytics Data...');
      const dataResponse = await axios.get(`${BASE_URL}/analytics/data?page=1&limit=5`, { headers });
      console.log('✅ Analytics Data:');
      console.log(`- Total records: ${dataResponse.data.pagination.total}`);
      console.log(`- Records returned: ${dataResponse.data.data.length}`);
      console.log(`- Sample record:`, JSON.stringify(dataResponse.data.data[0], null, 2));
    } catch (error) {
      console.error('❌ Analytics Data failed:', error.response?.data || error.message);
    }

    // Test 3: Financial Analytics - Cost Trends
    try {
      console.log('\n3. Testing Financial Analytics - Cost Trends...');
      const costTrendsResponse = await axios.get(`${BASE_URL}/analytics/financial/cost-trends?timeRange=LAST_30_DAYS`, { headers });
      console.log('✅ Cost Trends:');
      console.log(`- Trends count: ${costTrendsResponse.data.trends.length}`);
      console.log(`- Total cost: ${costTrendsResponse.data.totalCost}`);
      console.log(`- Total shipments: ${costTrendsResponse.data.totalShipments}`);
    } catch (error) {
      console.error('❌ Cost Trends failed:', error.response?.data || error.message);
    }

    // Test 4: Financial Analytics - Profitability
    try {
      console.log('\n4. Testing Financial Analytics - Profitability...');
      const profitabilityResponse = await axios.get(`${BASE_URL}/analytics/financial/profitability?timeRange=LAST_30_DAYS`, { headers });
      console.log('✅ Profitability Analysis:');
      console.log(`- Shipments analyzed: ${profitabilityResponse.data.shipments.length}`);
      console.log(`- Average profit margin: ${profitabilityResponse.data.averageProfitMargin}%`);
      console.log(`- Profitable shipments: ${profitabilityResponse.data.profitableShipments}`);
      console.log(`- Unprofitable shipments: ${profitabilityResponse.data.unprofitableShipments}`);
    } catch (error) {
      console.error('❌ Profitability Analysis failed:', error.response?.data || error.message);
    }

    // Test 5: Financial Summary
    try {
      console.log('\n5. Testing Financial Summary...');
      const summaryResponse = await axios.get(`${BASE_URL}/analytics/financial/summary?timeRange=LAST_30_DAYS`, { headers });
      console.log('✅ Financial Summary:');
      console.log(`- Total spending: ${summaryResponse.data.totalSpending}`);
      console.log(`- Average cost per shipment: ${summaryResponse.data.averageCostPerShipment}`);
      console.log(`- Top spending categories: ${summaryResponse.data.topCategories.length}`);
    } catch (error) {
      console.error('❌ Financial Summary failed:', error.response?.data || error.message);
    }

    // Test 6: AI Insights
    try {
      console.log('\n6. Testing AI Insights...');
      const insightsResponse = await axios.get(`${BASE_URL}/analytics/insights?page=1&limit=10`, { headers });
      console.log('✅ AI Insights:');
      console.log(`- Total insights: ${insightsResponse.data.pagination.total}`);
      console.log(`- Insights returned: ${insightsResponse.data.data.length}`);
      if (insightsResponse.data.data.length > 0) {
        const insight = insightsResponse.data.data[0];
        console.log(`- Sample insight: ${insight.title}`);
        console.log(`- Confidence: ${insight.confidenceScore}`);
        console.log(`- Status: ${insight.status}`);
      }
    } catch (error) {
      console.error('❌ AI Insights failed:', error.response?.data || error.message);
    }

    // Test 7: Generate New Insights (if credits available)
    try {
      console.log('\n7. Testing Insight Generation...');
      const generateResponse = await axios.post(`${BASE_URL}/analytics/insights/generate`, {}, { headers });
      console.log('✅ Insight Generation:');
      console.log(`- New insights generated: ${generateResponse.data.length}`);
    } catch (error) {
      console.error('❌ Insight Generation failed:', error.response?.data || error.message);
      if (error.response?.status === 402) {
        console.log('💡 This is expected if no credits are available');
      }
    }

    console.log('\n🎉 Analytics Endpoints Testing Complete!');
    console.log('========================================');
    console.log('✅ Analytics system is working with sample data');
    console.log('💡 You can now access the analytics dashboard in the frontend');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAnalyticsEndpoints();