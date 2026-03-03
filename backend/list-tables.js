const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

async function listTables() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        console.log('TABLES:', res.rows.map(r => r.table_name).join(', '));
    } catch (err) {
        console.log('ERR:', err.message);
    } finally {
        await pool.end();
    }
}
listTables();
