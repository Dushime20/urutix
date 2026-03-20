// Load environment variables from .env file
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433, // Updated to match your .env
  database: process.env.DB_NAME || 'urutix',
});

async function seedFuelWallets() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log('🔍 Checking existing data...\n');

    // Get a tenant ID
    const tenantResult = await client.query('SELECT id, name FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenants found. Please create a tenant first.');
      return;
    }
    const tenantId = tenantResult.rows[0].id;
    const tenantName = tenantResult.rows[0].name;
    console.log(`✅ Using tenant: ${tenantName} (${tenantId})`);

    // Get some drivers
    const driversResult = await client.query(
      'SELECT id, first_name, last_name FROM drivers WHERE tenant_id = $1 LIMIT 5',
      [tenantId]
    );
    console.log(`✅ Found ${driversResult.rows.length} drivers`);

    // Get some trucks
    const trucksResult = await client.query(
      'SELECT id, plate_number FROM trucks WHERE tenant_id = $1 LIMIT 5',
      [tenantId]
    );
    console.log(`✅ Found ${trucksResult.rows.length} trucks\n`);

    if (driversResult.rows.length === 0 && trucksResult.rows.length === 0) {
      console.log('❌ No drivers or trucks found. Please create some first.');
      return;
    }

    console.log('💰 Creating fuel wallets...\n');

    let walletsCreated = 0;

    // Create wallets for drivers
    for (const driver of driversResult.rows) {
      const balance = Math.floor(Math.random() * 5000) + 1000; // Random balance between 1000-6000
      const totalCredits = balance + Math.floor(Math.random() * 2000);
      const totalDebits = totalCredits - balance;

      await client.query(`
        INSERT INTO fuel_wallets (tenant_id, driver_id, balance, total_credits, total_debits, status)
        VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
        ON CONFLICT DO NOTHING
      `, [tenantId, driver.id, balance, totalCredits, totalDebits]);

      console.log(`✅ Created wallet for driver: ${driver.first_name} ${driver.last_name} - Balance: $${balance}`);
      walletsCreated++;

      // Create some transactions for this wallet
      const walletResult = await client.query(
        'SELECT id FROM fuel_wallets WHERE tenant_id = $1 AND driver_id = $2',
        [tenantId, driver.id]
      );

      if (walletResult.rows.length > 0) {
        const walletId = walletResult.rows[0].id;

        // Add credit transaction
        await client.query(`
          INSERT INTO fuel_wallet_transactions (tenant_id, wallet_id, type, amount, description)
          VALUES ($1, $2, 'CREDIT', $3, 'Initial credit allocation')
        `, [tenantId, walletId, totalCredits]);

        // Add some debit transactions
        const numDebits = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numDebits; i++) {
          const debitAmount = Math.floor(totalDebits / numDebits);
          await client.query(`
            INSERT INTO fuel_wallet_transactions (tenant_id, wallet_id, type, amount, description)
            VALUES ($1, $2, 'DEBIT', $3, $4)
          `, [tenantId, walletId, debitAmount, `Fuel purchase #${i + 1}`]);
        }
      }
    }

    // Create wallets for trucks (if no drivers)
    if (driversResult.rows.length === 0) {
      for (const truck of trucksResult.rows) {
        const balance = Math.floor(Math.random() * 5000) + 1000;
        const totalCredits = balance + Math.floor(Math.random() * 2000);
        const totalDebits = totalCredits - balance;

        await client.query(`
          INSERT INTO fuel_wallets (tenant_id, truck_id, balance, total_credits, total_debits, status)
          VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
          ON CONFLICT DO NOTHING
        `, [tenantId, truck.id, balance, totalCredits, totalDebits]);

        console.log(`✅ Created wallet for truck: ${truck.plate_number} - Balance: $${balance}`);
        walletsCreated++;
      }
    }

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✅ FUEL WALLETS SEEDED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`\nCreated ${walletsCreated} fuel wallets`);
    console.log(`Tenant: ${tenantName}`);
    console.log('\nYou can now view the fuel wallet data in the frontend!');
    console.log('Navigate to: Fuel Management → Fuel Wallets tab\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding fuel wallets:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

console.log('='.repeat(60));
console.log('FUEL WALLETS SEEDING SCRIPT');
console.log('='.repeat(60));
console.log();

seedFuelWallets().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
