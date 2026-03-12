const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix',
});

async function run() {
  await client.connect();
  try {
    const transQuery = `
      SELECT id, type, amount, balance_after, description, created_at, metadata 
      FROM credit_transactions 
      WHERE credit_account_id = '65e9cee4-4298-46e9-9249-67c55e15529e' 
      ORDER BY created_at DESC;
    `;
    const transRes = await client.query(transQuery);
    
    fs.writeFileSync('check_user_balance.json', JSON.stringify(transRes.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
