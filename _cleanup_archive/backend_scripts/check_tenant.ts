import { Client } from 'pg';

async function check() {
    const client = new Client({
        connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix',
    });

    await client.connect();

    try {
        const userRes = await client.query("SELECT id, email, tenant_id FROM users WHERE email = 'isdeborah47@gmail.com'");
        console.log('User Details:', userRes.rows[0]);

        if (userRes.rows[0]) {
            const tenantId = userRes.rows[0].tenant_id;
            const accRes = await client.query('SELECT * FROM credit_accounts WHERE tenant_id = $1 AND user_id IS NULL', [tenantId]);
            console.log('Tenant Credit Account:', accRes.rows[0]);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

check();
