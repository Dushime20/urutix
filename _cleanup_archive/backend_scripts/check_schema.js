const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix',
});

async function run() {
  await client.connect();
  try {
    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'credit_transactions';
    `;
    const res = await client.query(query);
    console.log(res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
