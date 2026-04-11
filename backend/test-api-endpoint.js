const axios = require('axios');

async function testApiEndpoint() {
  try {
    console.log('🔍 Testing /api/credits/balance endpoint...\n');

    // You'll need to get the actual auth token from your browser
    // For now, let's try without auth to see what happens
    const response = await axios.get('http://localhost:3005/api/credits/balance', {
      headers: {
        'Content-Type': 'application/json',
      },
      validateStatus: () => true, // Don't throw on any status
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data?.data) {
      const data = response.data.data;
      console.log('💰 Credit Balance Details:');
      console.log(`   Current Balance: ${data.currentBalance}`);
      console.log(`   Lifetime Earned: ${data.lifetimeEarned}`);
      console.log(`   Lifetime Spent: ${data.lifetimeSpent}`);
      console.log(`   Subscription Credits: ${data.subscriptionCredits}`);
      console.log('');

      if (data.currentBalance === 9976) {
        console.log('✅ API is returning CORRECT value (9,976)');
      } else if (data.currentBalance === 4976) {
        console.log('❌ API is still returning OLD value (4,976)');
        console.log('   This means the server is still using cached data or old code');
      } else {
        console.log(`⚠️  Unexpected value: ${data.currentBalance}`);
      }
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testApiEndpoint();
