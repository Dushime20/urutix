const axios = require('axios');

async function testDirectly() {
  try {
    console.log('Testing /admin/bulk-email/logs endpoint directly...\n');
    
    // Try without auth first to see what error we get
    console.log('Attempting request without authentication...');
    try {
      const response = await axios.get('http://localhost:3000/api/admin/bulk-email/logs');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log('Error:', error.response.data);
        
        if (error.response.status === 401) {
          console.log('\n✓ Endpoint exists but requires authentication (expected)');
        } else if (error.response.status === 500) {
          console.log('\n❌ 500 Error - Backend issue detected!');
          console.log('Error details:', JSON.stringify(error.response.data, null, 2));
        }
      } else {
        console.log('❌ Cannot connect to backend:', error.message);
        console.log('\nIs the backend running on http://localhost:3000?');
        console.log('Start it with: npm run start:dev');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testDirectly();
