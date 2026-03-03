const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

async function findTenant() {
    try {
        const res = await pool.query('SELECT email, "tenantId" FROM users WHERE email = \'admin@urutix.com\'');
        console.log(res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

findTenant();
