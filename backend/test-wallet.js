// Direct DB approach: check the fuel_wallets table structure and test the query
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

async function main() {
    try {
        // Test 1: Can we query fuel_wallets with owner_id filter?
        console.log('TEST1: Query fuel_wallets with owner_id');
        const r1 = await pool.query("SELECT id, owner_id, tenant_id FROM fuel_wallets WHERE owner_id IS NOT NULL LIMIT 3");
        console.log('  Result:', r1.rows.length, 'rows');
        r1.rows.forEach(r => console.log('  ', r.id, r.owner_id));

        // Test 2: Try the exact query TypeORM would do
        console.log('TEST2: TypeORM-style query');
        const r2 = await pool.query(
            'SELECT * FROM fuel_wallets WHERE "tenant_id" = $1 AND "owner_id" = $2 LIMIT 1',
            ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001']
        );
        console.log('  Result:', r2.rows.length, 'rows');

        // Test 3: Try INSERT
        console.log('TEST3: Insert test wallet');
        const r3 = await pool.query(
            `INSERT INTO fuel_wallets (tenant_id, owner_id, balance, total_credits, total_debits, status, metadata) 
             VALUES ($1, $2, 0, 0, 0, 'ACTIVE', '{}') RETURNING id`,
            ['f31e73f2-2c65-4b6c-b6f1-f9d11550012d', 'test-owner-id-123']
        );
        console.log('  Created:', r3.rows[0].id);

        // Cleanup
        await pool.query('DELETE FROM fuel_wallets WHERE owner_id = $1', ['test-owner-id-123']);
        console.log('  Cleaned up');

        console.log('ALL TESTS PASSED');
    } catch (err) {
        console.log('FAILED:', err.message);
    } finally {
        await pool.end();
    }
}

main();
