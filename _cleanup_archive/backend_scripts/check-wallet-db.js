const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

async function checkData() {
    try {
        const wallets = await pool.query('SELECT * FROM fuel_wallets;');
        console.log(`\n--- FUEL WALLETS (${wallets.rows.length}) ---`);
        console.log(wallets.rows);

        const txs = await pool.query('SELECT * FROM fuel_wallet_transactions;');
        console.log(`\n--- WALLET TRANSACTIONS (${txs.rows.length}) ---`);
        console.log(txs.rows);

        const overbudget = await pool.query('SELECT * FROM fuel_budgets WHERE status = \'OVER_BUDGET\';');
        console.log(`\n--- OVER BUDGET TRIPS (${overbudget.rows.length}) ---`);
        console.log(overbudget.rows);

        const advances = await pool.query('SELECT * FROM driver_fuel_advances;');
        console.log(`\n--- FUEL ADVANCES (${advances.rows.length}) ---`);
        console.log(advances.rows);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

checkData();
