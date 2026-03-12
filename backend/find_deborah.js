const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix_database',
    user: process.env.DB_USERNAME || 'dev',
    password: process.env.DB_PASSWORD || 'password',
});

async function findDeborah() {
    try {
        const userRes = await pool.query("SELECT u.id, u.email, p.\"firstName\", p.\"lastName\", p.\"companyName\", t.name as tenant_name, t.subdomain FROM users u LEFT JOIN user_profiles p ON u.id = p.\"userId\" LEFT JOIN tenants t ON u.\"tenantId\" = t.id WHERE p.\"firstName\" ILIKE '%deborah%' OR u.email ILIKE '%deborah%'");
        console.log('Users found:', userRes.rows);

        const tenantRes = await pool.query("SELECT id, name, subdomain FROM tenants WHERE name ILIKE '%deborah%' OR subdomain ILIKE '%deborah%'");
        console.log('Tenants found:', tenantRes.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

findDeborah();
