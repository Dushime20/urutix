/**
 * Test Frontend Analytics Integration
 * 
 * Tests the frontend-backend integration for analytics functionality
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5174';

async function testBackendConnection() {
  try {
    console.log('🔗 Testing Backend Connection...');
    
    // Test login
    const loginResponse = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Backend login successful');
    
    // Test analytics overview
    const analyticsResponse = await axios.get(`${BACKEND_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Analytics API accessible');
    console.log('Analytics data:', analyticsResponse.data);
    
    return { success: true, token };
  } catch (error) {
    console.error('❌ Backend connection failed:', error.response?.data || error.message);
    return { success: false };
  }
}

async function testFrontendConnection() {
  try {
    console.log('\n🌐 Testing Frontend Connection...');
    
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    console.log('✅ Frontend accessible');
    console.log('Status:', response.status);
    
    return true;
  } catch (error) {
    console.error('❌ Frontend connection failed:', error.message);
    return false;
  }
}

async function testCORSConfiguration() {
  try {
    console.log('\n🔒 Testing CORS Configuration...');
    
    // Test if frontend origin is allowed
    const response = await axios.options(`${BACKEND_URL}/analytics/overview`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      }
    });
    
    console.log('✅ CORS preflight successful');
    return true;
  } catch (error) {
    console.error('❌ CORS test failed:', error.response?.data || error.message);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting Frontend-Backend Integration Tests\n');
  
  const backendTest = await testBackendConnection();
  const frontendTest = await testFrontendConnection();
  const corsTest = await testCORSConfiguration();
  
  console.log('\n📊 Integration Test Results:');
  console.log('=================================');
  console.log(`Backend API: ${backendTest.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Frontend App: ${frontendTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`CORS Config: ${corsTest ? '✅ Working' : '❌ Failed'}`);
  
  if (backendTest.success && frontendTest && corsTest) {
    console.log('\n🎉 All integration tests passed!');
    console.log('📍 Frontend URL: ' + FRONTEND_URL);
    console.log('📍 Analytics Page: ' + FRONTEND_URL + '/analytics/financial');
    console.log('\n💡 Next Steps:');
    console.log('1. Open browser and navigate to the frontend URL');
    console.log('2. Login with: superadmin@urutix.com / admin123');
    console.log('3. Navigate to Analytics > Financial Analytics');
    console.log('4. Test the analytics dashboard functionality');
  } else {
    console.log('\n⚠️  Some integration tests failed. Please check the errors above.');
  }
}

runIntegrationTests().catch(console.error);