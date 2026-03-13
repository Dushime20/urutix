const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query("SELECT email FROM users WHERE role = 'SUPER_ADMIN'");
  res.rows.forEach(r => console.log(r.email));
  await client.end();
}
run();
