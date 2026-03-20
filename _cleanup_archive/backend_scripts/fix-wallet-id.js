const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

async function fix() {
    const tables = [
        'fuel_wallets',
        'fuel_wallet_transactions',
        'fuel_logs',
        'fuel_budgets',
        'driver_fuel_advances',
    ];

    for (const table of tables) {
        try {
            await pool.query(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT gen_random_uuid()`);
            console.log('FIXED: ' + table);
        } catch (err) {
            console.log('SKIP: ' + table + ' - ' + err.message);
        }
    }

    await pool.end();
    console.log('DONE');
}
fix();
