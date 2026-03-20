const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testBackendHealth() {
  console.log('🏥 Testing backend health...');
  console.log(`Base URL: ${BASE_URL}`);
  
  try {
    // Test basic connectivity
    const response = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ Backend is healthy');
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed');
    console.log(`Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running on port 3001');
      console.log('   Please start the backend with: npm run start:dev');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Cannot resolve hostname');
      console.log('   Check your network connection');
    } else if (error.response) {
      console.log(`   HTTP Status: ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return false;
  }
}

// Run health check
testBackendHealth().then(healthy => {
  if (healthy) {
    console.log('\n🎉 Backend is ready for KYC testing!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Backend is not ready. Please fix the issues above before running KYC tests.');
    process.exit(1);
  }
});