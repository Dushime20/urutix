const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix',
});

async function run() {
  await client.connect();
  try {
    const accountQuery = `
      SELECT * 
      FROM credit_accounts 
      WHERE tenant_id = 'b7d244e3-9a1a-4686-a22f-3fe18468500e' 
      AND user_id IS NULL;
    `;
    const accountRes = await client.query(accountQuery);

    const transQuery = `
      SELECT id, type, amount, balance_after, description, created_at 
      FROM credit_transactions 
      WHERE tenant_id = 'b7d244e3-9a1a-4686-a22f-3fe18468500e' 
      AND user_id IS NULL
      ORDER BY created_at DESC;
    `;
    const transRes = await client.query(transQuery);
    
    fs.writeFileSync('check_balance.json', JSON.stringify({
      account: accountRes.rows,
      transactions: transRes.rows
    }, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
