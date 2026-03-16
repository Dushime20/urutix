const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'superadmin@urutix.com',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('Status:', response.status);
    console.log('Full response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testLogin();