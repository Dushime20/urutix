const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix',
});

async function run() {
  await client.connect();
  try {
    const accountQuery = `
      SELECT id, user_id, current_balance, created_at
      FROM credit_accounts 
      WHERE tenant_id = 'b7d244e3-9a1a-4686-a22f-3fe18468500e'
      ORDER BY created_at ASC;
    `;
    const accountRes = await client.query(accountQuery);
    fs.writeFileSync('check_order.json', JSON.stringify(accountRes.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
