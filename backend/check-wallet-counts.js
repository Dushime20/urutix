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
        const wallets = await pool.query('SELECT COUNT(*) FROM fuel_wallets;');
        const txs = await pool.query('SELECT COUNT(*) FROM fuel_wallet_transactions;');
        const overbudget = await pool.query('SELECT COUNT(*) FROM fuel_budgets WHERE status = \'OVER_BUDGET\';');
        const advances = await pool.query('SELECT COUNT(*) FROM driver_fuel_advances;');

        console.log(`Wallets: ${wallets.rows[0].count}`);
        console.log(`Transactions: ${txs.rows[0].count}`);
        console.log(`Overbudget: ${overbudget.rows[0].count}`);
        console.log(`Advances: ${advances.rows[0].count}`);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

checkData();
