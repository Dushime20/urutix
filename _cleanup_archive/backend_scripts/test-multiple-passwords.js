const axios = require('axios');

const passwords = ['admin123', 'password', '123456', 'admin', 'urutix123', 'superadmin'];
const emails = ['admin@urutix.com', 'superadmin@urutix.com'];

async function testLogin(email, password) {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email,
      password
    });
    
    console.log(`✅ SUCCESS: ${email} / ${password}`);
    console.log('User:', response.data.user?.email);
    console.log('Role:', response.data.user?.role);
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${email} / ${password} - ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAllCombinations() {
  console.log('🔐 Testing login combinations...\n');
  
  for (const email of emails) {
    for (const password of passwords) {
      const success = await testLogin(email, password);
      if (success) {
        console.log('\n🎉 Found working credentials!');
        return;
      }
    }
  }
  
  console.log('\n❌ No working credentials found. May need to reset password.');
}

testAllCombinations();