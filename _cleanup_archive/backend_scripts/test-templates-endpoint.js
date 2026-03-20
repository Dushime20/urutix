const axios = require('axios');

async function testTemplatesEndpoint() {
  try {
    console.log('Testing email templates endpoint...\n');
    
    // Try without auth first
    console.log('1. Testing without authentication...');
    try {
      await axios.get('http://localhost:3000/api/admin/bulk-email/templates');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Endpoint requires authentication (expected)\n');
      } else {
        console.log(`❌ Unexpected status: ${error.response?.status}`);
        console.log('Error:', error.response?.data);
      }
    }
    
    // Try POST without auth
    console.log('2. Testing POST without authentication...');
    try {
      await axios.post('http://localhost:3000/api/admin/bulk-email/templates', {
        name: 'Test Template',
        subject: 'Test Subject',
        htmlBody: '<p>Test</p>',
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ POST endpoint requires authentication (expected)\n');
      } else if (error.response?.status === 500) {
        console.log('❌ 500 Error on POST endpoint!');
        console.log('Error details:', JSON.stringify(error.response?.data, null, 2));
      } else {
        console.log(`Status: ${error.response?.status}`);
        console.log('Error:', error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

testTemplatesEndpoint();
