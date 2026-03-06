import { Client } from 'pg';

async function check() {
    const client = new Client({
        connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix',
    });

    await client.connect();

    try {
        const res = await client.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('users', 'credit_accounts') ORDER BY table_name, column_name");
        res.rows.forEach(row => {
            console.log(`${row.table_name}.${row.column_name}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

check();
