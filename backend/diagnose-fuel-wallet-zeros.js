// Diagnostic script for fuel wallet zeros issue
// This script helps identify why the API returns zeros despite having data

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'urutix',
});

async function diagnose() {
  const client = await pool.connect();
  
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 FUEL WALLET ZEROS DIAGNOSTIC');
    console.log('='.repeat(70) + '\n');

    // Step 1: Check if fuel_wallets table exists and has data
    console.log('📊 Step 1: Checking fuel_wallets table...\n');
    
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'fuel_wallets'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ fuel_wallets table does NOT exist!');
      console.log('   Solution: Run migration: node run-fuel-features-migration.js\n');
      return;
    }
    
    console.log('✅ fuel_wallets table exists\n');

    // Step 2: Count total wallets
    const totalCount = await client.query('SELECT COUNT(*) FROM fuel_wallets');
    const total = parseInt(totalCount.rows[0].count);
    
    console.log(`📈 Total fuel wallets in database: ${total}\n`);
    
    if (total === 0) {
      console.log('❌ No fuel wallets found in database!');
      console.log('   Solution: Run seeding script: node seed-fuel-wallets.js\n');
      return;
    }

    // Step 3: Show wallets grouped by tenant
    console.log('🏢 Step 2: Wallets by Tenant:\n');
    console.log('─'.repeat(70));
    
    const byTenant = await client.query(`
      SELECT 
        fw.tenant_id,
        t.name as tenant_name,
        COUNT(fw.id) as wallet_count,
        SUM(fw.balance::numeric) as total_balance,
        SUM(fw.total_credits::numeric) as total_credits,
        SUM(fw.total_debits::numeric) as total_debits,
        COUNT(CASE WHEN fw.status = 'ACTIVE' THEN 1 END) as active_count
      FROM fuel_wallets fw
      LEFT JOIN tenants t ON t.id = fw.tenant_id
      GROUP BY fw.tenant_id, t.name
      ORDER BY wallet_count DESC
    `);

    if (byTenant.rows.length === 0) {
      console.log('❌ No wallets found (this should not happen if total > 0)');
      return;
    }

    byTenant.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Tenant: ${row.tenant_name || 'UNKNOWN'}`);
      console.log(`   Tenant ID: ${row.tenant_id}`);
      console.log(`   Total Wallets: ${row.wallet_count}`);
      console.log(`   Active Wallets: ${row.active_count}`);
      console.log(`   Total Balance: ${parseFloat(row.total_balance || 0).toFixed(2)}`);
      console.log(`   Total Credits: ${parseFloat(row.total_credits || 0).toFixed(2)}`);
      console.log(`   Total Debits: ${parseFloat(row.total_debits || 0).toFixed(2)}`);
    });

    console.log('\n' + '─'.repeat(70) + '\n');

    // Step 4: Check users and their tenant associations
    console.log('👤 Step 3: User-Tenant Associations:\n');
    console.log('─'.repeat(70));
    
    const users = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.tenant_id,
        t.name as tenant_name,
        r.name as role_name
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.email NOT LIKE '%super%admin%'
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    users.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Tenant: ${user.tenant_name || 'NO TENANT'}`);
      console.log(`   Tenant ID: ${user.tenant_id || 'NULL'}`);
      console.log(`   Role: ${user.role_name || 'NO ROLE'}`);
      
      // Check if this user's tenant has wallets
      const userTenantWallets = byTenant.rows.find(t => t.tenant_id === user.tenant_id);
      if (userTenantWallets) {
        console.log(`   ✅ This tenant has ${userTenantWallets.wallet_count} wallet(s)`);
      } else if (user.tenant_id) {
        console.log(`   ❌ This tenant has NO wallets`);
      }
    });

    console.log('\n' + '─'.repeat(70) + '\n');

    // Step 5: Sample wallet data
    console.log('📋 Step 4: Sample Wallet Records:\n');
    console.log('─'.repeat(70));
    
    const samples = await client.query(`
      SELECT 
        fw.id,
        fw.tenant_id,
        t.name as tenant_name,
        fw.driver_id,
        fw.truck_id,
        fw.balance,
        fw.total_credits,
        fw.total_debits,
        fw.status,
        fw.created_at
      FROM fuel_wallets fw
      LEFT JOIN tenants t ON t.id = fw.tenant_id
      ORDER BY fw.created_at DESC
      LIMIT 5
    `);

    samples.rows.forEach((wallet, index) => {
      console.log(`\n${index + 1}. Wallet ID: ${wallet.id}`);
      console.log(`   Tenant: ${wallet.tenant_name || 'UNKNOWN'} (${wallet.tenant_id})`);
      console.log(`   Driver ID: ${wallet.driver_id || 'N/A'}`);
      console.log(`   Truck ID: ${wallet.truck_id || 'N/A'}`);
      console.log(`   Balance: ${parseFloat(wallet.balance).toFixed(2)}`);
      console.log(`   Credits: ${parseFloat(wallet.total_credits).toFixed(2)}`);
      console.log(`   Debits: ${parseFloat(wallet.total_debits).toFixed(2)}`);
      console.log(`   Status: ${wallet.status}`);
      console.log(`   Created: ${wallet.created_at}`);
    });

    console.log('\n' + '─'.repeat(70) + '\n');

    // Step 6: Diagnosis and recommendations
    console.log('🔍 DIAGNOSIS & RECOMMENDATIONS:\n');
    console.log('='.repeat(70) + '\n');

    const tenantsWithWallets = byTenant.rows.filter(t => parseInt(t.wallet_count) > 0);
    const usersWithoutWallets = users.rows.filter(u => {
      if (!u.tenant_id) return true;
      return !byTenant.rows.find(t => t.tenant_id === u.tenant_id);
    });

    if (tenantsWithWallets.length === 0) {
      console.log('❌ PROBLEM: No tenants have fuel wallets');
      console.log('   SOLUTION: Run: node seed-fuel-wallets.js\n');
    } else {
      console.log(`✅ ${tenantsWithWallets.length} tenant(s) have fuel wallets\n`);
      
      if (usersWithoutWallets.length > 0) {
        console.log('⚠️  WARNING: Some users belong to tenants without wallets:\n');
        usersWithoutWallets.forEach(u => {
          console.log(`   - ${u.email} (Tenant: ${u.tenant_name || 'NO TENANT'})`);
        });
        console.log('\n   If you are logged in as one of these users, you will see zeros.');
        console.log('   SOLUTION: Either:');
        console.log('   1. Log in as a user from a tenant that has wallets, OR');
        console.log('   2. Run seed script to add wallets for your tenant\n');
      }
    }

    console.log('📝 NEXT STEPS:\n');
    console.log('1. Check which user you are logged in as (check JWT token in browser)');
    console.log('2. Find that user in the list above');
    console.log('3. Verify that user\'s tenant has wallets');
    console.log('4. If not, run: node seed-fuel-wallets.js');
    console.log('5. Hard refresh browser (Ctrl+F5)\n');

    console.log('💡 HOW TO CHECK YOUR JWT TOKEN:');
    console.log('   1. Open browser DevTools (F12)');
    console.log('   2. Go to Application tab → Local Storage');
    console.log('   3. Find "token" or "accessToken"');
    console.log('   4. Copy the token value');
    console.log('   5. Go to https://jwt.io and paste it');
    console.log('   6. Look for "tenantId" in the payload\n');

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

diagnose().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
