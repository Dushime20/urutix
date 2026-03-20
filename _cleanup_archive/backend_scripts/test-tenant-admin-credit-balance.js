const axios = require('axios');

async function testTenantAdminCreditBalance() {
  try {
    console.log('🧪 Testing Tenant Admin Credit Balance Endpoint...\n');

    // First, login as tenant admin
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      email: 'deborahrutagengwa.admin@urutix.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;

    console.log('✅ Login successful');
    console.log('👤 User:', user.email, '- Role:', user.role);
    console.log('🏢 Tenant ID:', user.tenantId);
    console.log('');

    // Test credit balance endpoint
    const balanceResponse = await axios.get('http://localhost:3001/credits/balance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('💰 Credit Balance Response:');
    console.log('Status:', balanceResponse.status);
    console.log('Data:', JSON.stringify(balanceResponse.data, null, 2));

    if (balanceResponse.data.success) {
      const balance = balanceResponse.data.data;
      console.log('\n📊 Balance Summary:');
      console.log('Current Balance:', balance.currentBalance, 'TRX');
      console.log('Purchased Credits:', balance.purchasedCredits, 'TRX');
      console.log('Bonus Credits:', balance.bonusCredits, 'TRX');
      console.log('Total Spent:', balance.totalSpent, 'TRX');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testTenantAdminCreditBalance();