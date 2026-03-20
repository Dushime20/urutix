const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix',
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting fuel features migration...');

        const migrationPath = path.join(__dirname, 'migrations', '015_fuel_wallet_budget_advance.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Executing migration SQL...');
        await client.query(sql);

        console.log('✅ Fuel wallet, budget, and advance tables created successfully!');

        // Verify tables
        const tables = ['fuel_wallets', 'fuel_wallet_transactions', 'fuel_budgets', 'driver_fuel_advances'];
        for (const table of tables) {
            const result = await client.query(
                `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
                [table]
            );
            if (result.rows[0].exists) {
                console.log(`✓ Table ${table} verified`);
            } else {
                console.log(`✗ Table ${table} NOT found`);
            }
        }

        console.log('\n✨ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        await pool.end();
    }
}

runMigration();
