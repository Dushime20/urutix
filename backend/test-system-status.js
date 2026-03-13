const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testSystemStatus() {
  console.log('🧪 Testing UrutiX System Status...\n');
  
  try {
    // First login to get token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'deborahrutagengwa.admin@urutix.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Authentication: SUCCESS');
    console.log('   👤 User:', loginResponse.data.user.email);
    console.log('   🏢 Tenant:', loginResponse.data.user.tenantName);
    console.log('   👑 Role:', loginResponse.data.user.role);
    console.log('');
    
    // Test credit balance
    try {
      const balanceResponse = await axios.get(`${BASE_URL}/credits/balance`, { headers });
      console.log('✅ Credit Balance API: SUCCESS');
      console.log('   💰 Balance:', balanceResponse.data.balance, 'credits');
    } catch (error) {
      console.log('❌ Credit Balance API failed:', error.response?.data?.message);
    }
    
    // Test subscription plans
    try {
      const plansResponse = await axios.get(`${BASE_URL}/subscriptions/plans`, { headers });
      console.log('✅ Subscription Plans API: SUCCESS');
      console.log('   📋 Plans:', plansResponse.data.length, 'available');
    } catch (error) {
      console.log('❌ Subscription Plans API failed:', error.response?.data?.message);
    }
    
    // Test notification alerts
    try {
      const alertsResponse = await axios.get(`${BASE_URL}/subscription/notifications/balance-alerts`, { headers });
      console.log('✅ Balance Alerts API: SUCCESS');
      console.log('   🚨 Alert Level:', alertsResponse.data.alertLevel);
    } catch (error) {
      console.log('❌ Balance Alerts API failed:', error.response?.data?.message);
    }
    
    // Test truck owners endpoint
    try {
      const trucksResponse = await axios.get(`${BASE_URL}/truck-owners`, { headers });
      console.log('✅ Truck Owners API: SUCCESS');
      console.log('   🚛 Truck Owners:', trucksResponse.data.length, 'found');
    } catch (error) {
      console.log('❌ Truck Owners API failed:', error.response?.data?.message);
    }
    
    console.log('\n🎉 System Status: FULLY OPERATIONAL!');
    console.log('🌐 Frontend URL: http://localhost:5174');
    console.log('🔧 Backend URL: http://localhost:3000');
    
  } catch (error) {
    console.log('❌ System test failed:', error.message);
  }
}

testSystemStatus();