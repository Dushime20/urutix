require('dotenv').config();
const axios = require('axios');

const baseUrl = 'http://localhost:3000/api';

async function testAdminTransactionsEndpoint() {
  console.log('🧪 Testing Admin Credit Transactions Endpoint\n');

  try {
    // Step 1: Login as super admin
    console.log('1️⃣  Logging in as super admin...');
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'SuperAdmin@123',
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful\n');

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Step 2: Test GET /admin/credits/transactions (all transactions)
    console.log('2️⃣  Testing GET /admin/credits/transactions (all transactions)...');
    const allTransactionsResponse = await axios.get(
      `${baseUrl}/admin/credits/transactions?limit=10`,
      { headers }
    );

    const allTransactions = allTransactionsResponse.data.data || allTransactionsResponse.data;
    console.log(`✅ Found ${allTransactions.length} transactions`);
    
    if (allTransactions.length > 0) {
      console.log('\nSample transactions:');
      allTransactions.slice(0, 3).forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.type} - ${t.amount} credits`);
        console.log(`     Tenant: ${t.tenant?.name || 'Unknown'}`);
        console.log(`     Description: ${t.description}`);
        console.log(`     Date: ${new Date(t.created_at).toLocaleString()}\n`);
      });
    }

    // Step 3: Test with filters
    console.log('3️⃣  Testing with type filter (CONSUMPTION)...');
    const consumptionResponse = await axios.get(
      `${baseUrl}/admin/credits/transactions?type=CONSUMPTION&limit=5`,
      { headers }
    );

    const consumptionTransactions = consumptionResponse.data.data || consumptionResponse.data;
    console.log(`✅ Found ${consumptionTransactions.length} CONSUMPTION transactions\n`);

    // Step 4: Test with date range
    console.log('4️⃣  Testing with date range (last 7 days)...');
    const recentResponse = await axios.get(
      `${baseUrl}/admin/credits/transactions?days=7&limit=10`,
      { headers }
    );

    const recentTransactions = recentResponse.data.data || recentResponse.data;
    console.log(`✅ Found ${recentTransactions.length} transactions in last 7 days\n`);

    // Step 5: Test tenant-specific endpoint
    if (allTransactions.length > 0 && allTransactions[0].tenant_id) {
      const testTenantId = allTransactions[0].tenant_id;
      console.log(`5️⃣  Testing GET /admin/credits/transactions/${testTenantId.substring(0, 8)}...`);
      
      const tenantResponse = await axios.get(
        `${baseUrl}/admin/credits/transactions/${testTenantId}?limit=5`,
        { headers }
      );

      const tenantTransactions = tenantResponse.data.data || tenantResponse.data;
      console.log(`✅ Found ${tenantTransactions.length} transactions for tenant\n`);
    }

    console.log('✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - Total transactions: ${allTransactions.length}`);
    console.log(`   - Consumption transactions: ${consumptionTransactions.length}`);
    console.log(`   - Recent transactions (7 days): ${recentTransactions.length}`);
    console.log('\n✅ Admin transactions endpoint is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('   Authentication failed. Check credentials.');
    } else if (error.response?.status === 404) {
      console.error('   Endpoint not found. Check route configuration.');
    }
    process.exit(1);
  }
}

testAdminTransactionsEndpoint();
