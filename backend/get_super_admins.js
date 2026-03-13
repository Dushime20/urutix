const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query("SELECT id, email, role FROM users WHERE role = 'SUPER_ADMIN'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run();
