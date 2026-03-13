const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function reset() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const hash = await bcrypt.hash('SuperAdmin@123', 14);
  await client.query("UPDATE users SET \"passwordHash\" = $1 WHERE email = 'superadmin@urutix.com'", [hash]);
  console.log('Password reset successfully');
  await client.end();
}
reset();
