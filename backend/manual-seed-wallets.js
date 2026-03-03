const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

const TARGET_TENANT = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d';

async function seed() {
    try {
        console.log('Fetching drivers for tenant:', TARGET_TENANT);
        const driverRes = await pool.query('SELECT id, "firstName", "lastName" FROM drivers WHERE "tenantId" = $1 LIMIT 5', [TARGET_TENANT]);

        if (driverRes.rows.length === 0) {
            console.log('No drivers found for this tenant.');
            return;
        }

        console.log(`Found ${driverRes.rows.length} drivers.`);

        for (const driver of driverRes.rows) {
            const walletId = uuidv4();

            // Check if wallet already exists for this driver to avoid duplicate errors if driver_id is unique
            const checkWallet = await pool.query('SELECT id FROM fuel_wallets WHERE driver_id = $1', [driver.id]);
            if (checkWallet.rows.length > 0) {
                console.log(`Driver ${driver.firstName} ${driver.lastName} already has a wallet. Updating balance.`);
                await pool.query(
                    'UPDATE fuel_wallets SET balance = balance + 2500, total_credits = total_credits + 5000, total_debits = total_debits + 2500 WHERE driver_id = $1',
                    [driver.id]
                );
            } else {
                console.log(`Creating fuel wallet for driver: ${driver.firstName} ${driver.lastName}`);
                await pool.query(`
          INSERT INTO fuel_wallets (id, tenant_id, driver_id, balance, total_credits, total_debits, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [walletId, TARGET_TENANT, driver.id, 2500.00, 5000.00, 2500.00, 'ACTIVE']);
            }
        }

        console.log('✅ Manual seeding completed successfully!');
    } catch (err) {
        console.error('❌ Error seeding wallets:', err);
    } finally {
        await pool.end();
    }
}

seed();
