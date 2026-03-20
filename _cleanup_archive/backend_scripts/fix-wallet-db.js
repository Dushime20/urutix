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
    try {
        // Check existing columns
        const cols = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'fuel_wallets' ORDER BY ordinal_position"
        );
        console.log('Current columns:', cols.rows.map(r => r.column_name));

        // Add owner_id column if missing
        const hasOwnerId = cols.rows.some(r => r.column_name === 'owner_id');
        if (!hasOwnerId) {
            console.log('Adding owner_id column...');
            await pool.query('ALTER TABLE fuel_wallets ADD COLUMN owner_id UUID');
            console.log('✅ owner_id column added');
        } else {
            console.log('✅ owner_id column already exists');
        }

        // Create index for owner_id
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_fuel_wallets_owner_id 
      ON fuel_wallets(tenant_id, owner_id)
    `);
        console.log('✅ Index created');

        console.log('\nDone!');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

fix();
