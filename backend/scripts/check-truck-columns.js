const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'trucks' ORDER BY column_name");
        res.rows.forEach(row => console.log(row.column_name));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

check();
