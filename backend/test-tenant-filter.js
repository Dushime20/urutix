require('dotenv').config();
const axios = require('axios');

const baseUrl = 'http://localhost:3000/api';

async function testTenantFilter() {
  console.log('🧪 Testing Tenant Filter in Credit Usage History\n');

  try {
    // Login
    console.log('1️⃣  Logging in...');
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'SuperAdmin@123',
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful\n');

    const headers = { Authorization: `Bearer ${token}` };

    // Get all transactions first
    console.log('2️⃣  Getting all transactions...');
    const allResponse = await axios.get(
      `${baseUrl}/admin/credits/transactions?limit=10&days=30`,
      { headers }
    );

    const allTransactions = allResponse.data.data || [];
    console.log(`✅ Found ${allTransactions.length} total transactions\n`);

    if (allTransactions.length > 0) {
      // Get unique tenant IDs
      const tenantIds = [...new Set(allTransactions.map(t => t.tenantId))];
      console.log(`📊 Unique tenants: ${tenantIds.length}`);
      
      tenantIds.forEach((id, i) => {
        const tenant = allTransactions.find(t => t.tenantId === id);
        const tenantName = tenant?.creditAccount?.tenant?.name || 'Unknown';
        console.log(`   ${i + 1}. ${tenantName} (${id.substring(0, 8)}...)`);
      });
      console.log('');

      // Test filtering by first tenant
      const testTenantId = tenantIds[0];
      const testTenantName = allTransactions.find(t => t.tenantId === testTenantId)?.creditAccount?.tenant?.name || 'Unknown';
      
      console.log(`3️⃣  Testing filter for tenant: ${testTenantName}`);
      console.log(`   Tenant ID: ${testTenantId}\n`);

      const filteredResponse = await axios.get(
        `${baseUrl}/admin/credits/transactions?tenantId=${testTenantId}&days=30&limit=10`,
        { headers }
      );

      const filteredTransactions = filteredResponse.data.data || [];
      console.log(`✅ Found ${filteredTransactions.length} transactions for this tenant\n`);

      if (filteredTransactions.length > 0) {
        console.log('📋 Filtered transactions:');
        filteredTransactions.forEach((t, i) => {
          const tenantName = t.creditAccount?.tenant?.name || 'Unknown';
          console.log(`   ${i + 1}. ${t.type} - ${t.amount} credits`);
          console.log(`      Tenant: ${tenantName}`);
          console.log(`      Description: ${t.description}`);
          console.log(`      Date: ${new Date(t.createdAt).toLocaleString()}\n`);
        });

        // Verify all transactions belong to the filtered tenant
        const allMatch = filteredTransactions.every(t => t.tenantId === testTenantId);
        if (allMatch) {
          console.log('✅ All transactions belong to the filtered tenant');
        } else {
          console.log('❌ Some transactions do NOT belong to the filtered tenant');
        }
      }

      // Test with different tenant if available
      if (tenantIds.length > 1) {
        const secondTenantId = tenantIds[1];
        const secondTenantName = allTransactions.find(t => t.tenantId === secondTenantId)?.creditAccount?.tenant?.name || 'Unknown';
        
        console.log(`\n4️⃣  Testing filter for second tenant: ${secondTenantName}`);
        
        const secondFilteredResponse = await axios.get(
          `${baseUrl}/admin/credits/transactions?tenantId=${secondTenantId}&days=30&limit=10`,
          { headers }
        );

        const secondFiltered = secondFilteredResponse.data.data || [];
        console.log(`✅ Found ${secondFiltered.length} transactions for ${secondTenantName}\n`);
      }

    } else {
      console.log('⚠️  No transactions found in database');
    }

    console.log('\n✅ Tenant filter test complete!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('   Authentication failed');
    }
  }
}

testTenantFilter();
