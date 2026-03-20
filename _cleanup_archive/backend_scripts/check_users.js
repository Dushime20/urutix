const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix',
});

async function run() {
  await client.connect();
  try {
    const userQuery = `
      SELECT u.id, u.email, u.role, ca.current_balance, ca.id as account_id
      FROM users u
      LEFT JOIN credit_accounts ca ON ca.user_id = u.id OR (ca.user_id IS NULL AND ca.tenant_id = u."tenantId")
      WHERE u."tenantId" = 'b7d244e3-9a1a-4686-a22f-3fe18468500e';
    `;
    const userRes = await client.query(userQuery);
    
    fs.writeFileSync('check_users.json', JSON.stringify(userRes.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
