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
        const res = await pool.query("SELECT ca.tenant_id, ca.user_id, ca.current_balance, u.email, t.subdomain FROM credit_accounts ca JOIN users u ON ca.user_id = u.id JOIN tenants t ON ca.tenant_id = t.id WHERE ca.current_balance < 10000");
        console.log(JSON.stringify(res.rows, null, 2));

        const tenantRes = await pool.query("SELECT id, name, subdomain FROM tenants WHERE subdomain = 'isimbiruti'");
        console.log('Isimbiruti Tenant:', tenantRes.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
