const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
});

const config = {
  host: env.DB_HOST || '127.0.0.1',
  port: parseInt(env.DB_PORT || '5433', 10),
  user: env.DB_USERNAME || 'postgres',
  password: env.DB_PASSWORD || '123',
  database: env.DB_NAME || 'urutix',
};

async function check() {
  const client = new Client(config);
  try {
    await client.connect();
    const res = await client.query('SELECT DISTINCT role FROM kyc_role_requirements');
    console.log('Roles in kyc_role_requirements:', res.rows.map(r => r.role).join(', '));
    
    const res2 = await client.query('SELECT DISTINCT role FROM users');
    console.log('Roles in users table:', res2.rows.map(r => r.role).join(', '));

    await client.end();
  } catch (err) {
    console.error(err);
  }
}
check();
