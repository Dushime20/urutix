const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

async function check() {
    try {
        const tenantRes = await pool.query("SELECT id FROM tenants WHERE subdomain = 'isimbiruti'");
        if (tenantRes.rows.length === 0) {
            console.log('Tenant isimbiruti not found');
            return;
        }
        const tenantId = tenantRes.rows[0].id;
        console.log('Tenant ID:', tenantId);

        const usersRes = await pool.query("SELECT u.id, u.email, ca.current_balance FROM users u JOIN credit_accounts ca ON u.id = ca.user_id WHERE u.\"tenantId\" = $1", [tenantId]);
        console.log('Users and Balances for isimbiruti:', usersRes.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
