require('dotenv').config();
const axios = require('axios');

const baseUrl = 'http://localhost:3000/api';

async function checkCreditUsageData() {
  console.log('🔍 Checking Credit Usage History Data\n');

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

    // Get all transactions
    console.log('2️⃣  Fetching all transactions...');
    const response = await axios.get(
      `${baseUrl}/admin/credits/transactions?limit=10&days=30`,
      { headers }
    );

    console.log('📦 Response structure:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');

    const transactions = response.data.data || response.data;

    if (Array.isArray(transactions) && transactions.length > 0) {
      console.log('📊 Transaction Details:\n');
      
      transactions.forEach((t, i) => {
        console.log(`Transaction ${i + 1}:`);
        console.log(`  ID: ${t.id}`);
        console.log(`  Type: ${t.type}`);
        console.log(`  Amount: ${t.amount}`);
        console.log(`  Description: ${t.description}`);
        console.log(`  Balance After: ${t.balance_after || t.balanceAfter || 'N/A'}`);
        console.log(`  Created At: ${t.created_at || t.createdAt || 'N/A'}`);
        console.log(`  Tenant ID: ${t.tenant_id || t.tenantId || 'N/A'}`);
        
        // Check nested structures
        if (t.creditAccount) {
          console.log(`  Credit Account: ${t.creditAccount.id || 'N/A'}`);
          if (t.creditAccount.tenant) {
            console.log(`  Tenant (nested): ${t.creditAccount.tenant.name || 'N/A'}`);
          } else {
            console.log(`  Tenant (nested): NOT POPULATED`);
          }
        } else {
          console.log(`  Credit Account: NOT POPULATED`);
        }
        
        if (t.tenant) {
          console.log(`  Tenant (direct): ${t.tenant.name || 'N/A'}`);
        } else {
          console.log(`  Tenant (direct): NOT POPULATED`);
        }
        
        console.log('');
      });

      // Check if backend has been restarted
      console.log('🔍 Diagnosis:');
      const firstTransaction = transactions[0];
      
      if (!firstTransaction.creditAccount || !firstTransaction.creditAccount.tenant) {
        console.log('❌ Tenant relations NOT populated');
        console.log('   → Backend needs to be restarted to apply tenant joins');
      } else {
        console.log('✅ Tenant relations are populated');
      }

      if (!firstTransaction.created_at && !firstTransaction.createdAt) {
        console.log('❌ Date field missing');
        console.log('   → Check entity serialization');
      } else {
        console.log('✅ Date field present');
      }

    } else {
      console.log('⚠️  No transactions found or invalid response format');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('   Authentication failed');
    }
  }
}

checkCreditUsageData();
