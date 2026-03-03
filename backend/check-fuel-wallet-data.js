// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'urutix',
});

async function checkFuelWalletData() {
  const client = await pool.connect();
  
  try {
    console.log('='.repeat(60));
    console.log('FUEL WALLET DATA DIAGNOSTIC');
    console.log('='.repeat(60));
    console.log();

    // Check total wallets in database
    const totalWallets = await client.query('SELECT COUNT(*) FROM fuel_wallets');
    console.log(`📊 Total fuel wallets in database: ${totalWallets.rows[0].count}`);
    console.log();

    // Check wallets by tenant
    const walletsByTenant = await client.query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        COUNT(fw.id) as wallet_count,
        SUM(fw.balance) as total_balance,
        SUM(fw.total_credits) as total_credits,
        SUM(fw.total_debits) as total_debits
      FROM tenants t
      LEFT JOIN fuel_wallets fw ON fw.tenant_id = t.id
      GROUP BY t.id, t.name
      ORDER BY wallet_count DESC
    `);

    console.log('📋 Wallets by Tenant:');
    console.log('─'.repeat(60));
    walletsByTenant.rows.forEach(row => {
      console.log(`\nTenant: ${row.tenant_name} (ID: ${row.tenant_id})`);
      console.log(`  Wallets: ${row.wallet_count}`);
      console.log(`  Total Balance: ${row.total_balance || 0}`);
      console.log(`  Total Credits: ${row.total_credits || 0}`);
      console.log(`  Total Debits: ${row.total_debits || 0}`);
    });
    console.log();

    // Check sample wallet data
    const sampleWallets = await client.query(`
      SELECT 
        fw.id,
        fw.tenant_id,
        t.name as tenant_name,
        fw.driver_id,
        fw.truck_id,
        fw.balance,
        fw.total_credits,
        fw.total_debits,
        fw.status
      FROM fuel_wallets fw
      JOIN tenants t ON t.id = fw.tenant_id
      LIMIT 5
    `);

    console.log('🔍 Sample Wallet Records:');
    console.log('─'.repeat(60));
    sampleWallets.rows.forEach(wallet => {
      console.log(`\nWallet ID: ${wallet.id}`);
      console.log(`  Tenant: ${wallet.tenant_name} (ID: ${wallet.tenant_id})`);
      console.log(`  Driver ID: ${wallet.driver_id || 'N/A'}`);
      console.log(`  Truck ID: ${wallet.truck_id || 'N/A'}`);
      console.log(`  Balance: ${wallet.balance}`);
      console.log(`  Credits: ${wallet.total_credits}`);
      console.log(`  Debits: ${wallet.total_debits}`);
      console.log(`  Status: ${wallet.status}`);
    });
    console.log();

    // Check users and their tenants
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
      WHERE u.email NOT LIKE '%super%'
      ORDER BY u.created_at DESC
      LIMIT 5
    `);

    console.log('👤 Recent Users:');
    console.log('─'.repeat(60));
    users.rows.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`  Tenant: ${user.tenant_name || 'N/A'} (ID: ${user.tenant_id || 'N/A'})`);
      console.log(`  Role: ${user.role_name || 'N/A'}`);
    });
    console.log();

    // Check if there's a tenant mismatch
    console.log('🔍 DIAGNOSIS:');
    console.log('─'.repeat(60));
    
    if (totalWallets.rows[0].count === '0') {
      console.log('❌ No fuel wallets found in database');
      console.log('   Solution: Run the seeding script');
    } else {
      console.log('✅ Fuel wallets exist in database');
      
      const tenantsWithWallets = walletsByTenant.rows.filter(r => parseInt(r.wallet_count) > 0);
      if (tenantsWithWallets.length === 0) {
        console.log('❌ No tenants have wallets assigned');
      } else {
        console.log(`✅ ${tenantsWithWallets.length} tenant(s) have wallets`);
        console.log('\n⚠️  IMPORTANT: Make sure you are logged in as one of these tenants:');
        tenantsWithWallets.forEach(t => {
          console.log(`   - ${t.tenant_name} (ID: ${t.tenant_id}) - ${t.wallet_count} wallets`);
        });
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('NEXT STEPS:');
    console.log('='.repeat(60));
    console.log('1. Check which tenant you are logged in as');
    console.log('2. Verify that tenant has fuel wallets in the list above');
    console.log('3. If your tenant has no wallets, run: node seed-fuel-wallets.js');
    console.log('4. Check browser console for the tenantId in your JWT token');
    console.log('5. Hard refresh browser (Ctrl+F5) after confirming data exists');
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkFuelWalletData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
