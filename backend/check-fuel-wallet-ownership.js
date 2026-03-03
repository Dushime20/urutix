// Check fuel wallet ownership - wallets should belong to truck owners
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_NAME || 'urutix',
});

async function checkOwnership() {
  const client = await pool.connect();
  
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 FUEL WALLET OWNERSHIP DIAGNOSTIC');
    console.log('='.repeat(70) + '\n');

    // Check wallets and their truck owners
    console.log('📊 Fuel Wallets by Truck Owner:\n');
    console.log('─'.repeat(70));
    
    const walletsByOwner = await client.query(`
      SELECT 
        u.id as owner_id,
        u.email as owner_email,
        u.tenant_id,
        t.name as tenant_name,
        r.name as role_name,
        COUNT(DISTINCT tr.id) as trucks_count,
        COUNT(DISTINCT fw.id) as wallets_count,
        SUM(fw.balance::numeric) as total_balance,
        SUM(fw.total_credits::numeric) as total_credits,
        SUM(fw.total_debits::numeric) as total_debits
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      LEFT JOIN roles r ON r.id = u.role_id
      LEFT JOIN trucks tr ON tr."ownerId" = u.id
      LEFT JOIN fuel_wallets fw ON fw.truck_id = tr.id
      WHERE r.name = 'TRUCK_OWNER' OR u.email LIKE '%truck%owner%'
      GROUP BY u.id, u.email, u.tenant_id, t.name, r.name
      ORDER BY wallets_count DESC
    `);

    if (walletsByOwner.rows.length === 0) {
      console.log('❌ No truck owners found in database\n');
    } else {
      walletsByOwner.rows.forEach((owner, index) => {
        console.log(`\n${index + 1}. ${owner.owner_email}`);
        console.log(`   Owner ID: ${owner.owner_id}`);
        console.log(`   Tenant: ${owner.tenant_name || 'NO TENANT'}`);
        console.log(`   Role: ${owner.role_name || 'NO ROLE'}`);
        console.log(`   Trucks Owned: ${owner.trucks_count}`);
        console.log(`   Fuel Wallets: ${owner.wallets_count}`);
        if (parseInt(owner.wallets_count) > 0) {
          console.log(`   Total Balance: ${parseFloat(owner.total_balance || 0).toFixed(2)}`);
          console.log(`   Total Credits: ${parseFloat(owner.total_credits || 0).toFixed(2)}`);
          console.log(`   Total Debits: ${parseFloat(owner.total_debits || 0).toFixed(2)}`);
        }
      });
    }

    console.log('\n' + '─'.repeat(70) + '\n');

    // Check detailed wallet-truck-owner relationships
    console.log('🔗 Wallet → Truck → Owner Relationships:\n');
    console.log('─'.repeat(70));
    
    const relationships = await client.query(`
      SELECT 
        fw.id as wallet_id,
        fw.balance,
        fw.status,
        tr.id as truck_id,
        tr.plate_number,
        tr."ownerId" as owner_id,
        u.email as owner_email,
        u.tenant_id,
        t.name as tenant_name
      FROM fuel_wallets fw
      LEFT JOIN trucks tr ON tr.id = fw.truck_id
      LEFT JOIN users u ON u.id = tr."ownerId"
      LEFT JOIN tenants t ON t.id = u.tenant_id
      ORDER BY u.email, tr.plate_number
      LIMIT 10
    `);

    if (relationships.rows.length === 0) {
      console.log('❌ No fuel wallets found\n');
    } else {
      relationships.rows.forEach((rel, index) => {
        console.log(`\n${index + 1}. Wallet: ${rel.wallet_id.substring(0, 8)}...`);
        console.log(`   Balance: ${parseFloat(rel.balance).toFixed(2)}`);
        console.log(`   Status: ${rel.status}`);
        console.log(`   Truck: ${rel.plate_number || 'NO TRUCK'} (${rel.truck_id ? rel.truck_id.substring(0, 8) + '...' : 'NULL'})`);
        console.log(`   Owner: ${rel.owner_email || 'NO OWNER'}`);
        console.log(`   Owner ID: ${rel.owner_id ? rel.owner_id.substring(0, 8) + '...' : 'NULL'}`);
        console.log(`   Tenant: ${rel.tenant_name || 'NO TENANT'}`);
      });
    }

    console.log('\n' + '─'.repeat(70) + '\n');

    // Diagnosis
    console.log('🔍 DIAGNOSIS:\n');
    console.log('='.repeat(70) + '\n');

    const ownersWithWallets = walletsByOwner.rows.filter(o => parseInt(o.wallets_count) > 0);
    const ownersWithoutWallets = walletsByOwner.rows.filter(o => parseInt(o.wallets_count) === 0);

    if (ownersWithWallets.length === 0) {
      console.log('❌ PROBLEM: No truck owners have fuel wallets\n');
      console.log('   This is why you see zeros!\n');
      console.log('   SOLUTION: Run the seeding script to create wallets for trucks\n');
    } else {
      console.log(`✅ ${ownersWithWallets.length} truck owner(s) have fuel wallets:\n`);
      ownersWithWallets.forEach(o => {
        console.log(`   - ${o.owner_email}: ${o.wallets_count} wallet(s), Balance: ${parseFloat(o.total_balance || 0).toFixed(2)}`);
      });
      console.log();
    }

    if (ownersWithoutWallets.length > 0) {
      console.log(`⚠️  ${ownersWithoutWallets.length} truck owner(s) have NO wallets:\n`);
      ownersWithoutWallets.forEach(o => {
        console.log(`   - ${o.owner_email} (${o.trucks_count} truck(s))`);
      });
      console.log('\n   If you are logged in as one of these users, you will see zeros.\n');
    }

    console.log('─'.repeat(70) + '\n');

    console.log('📝 HOW IT WORKS:\n');
    console.log('1. Fuel wallets are linked to TRUCKS (via truck_id)');
    console.log('2. Trucks are owned by USERS (via ownerId)');
    console.log('3. When you log in as a truck owner, you see wallets for YOUR trucks only');
    console.log('4. Admins see ALL wallets for their tenant\n');

    console.log('💡 NEXT STEPS:\n');
    console.log('1. Check which user you are logged in as');
    console.log('2. Find that user in the list above');
    console.log('3. Verify that user has trucks with wallets');
    console.log('4. If not, run: node seed-fuel-wallets.js');
    console.log('5. Restart backend: npm run start:dev');
    console.log('6. Hard refresh browser (Ctrl+F5)\n');

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

checkOwnership().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
