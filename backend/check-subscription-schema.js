const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
});

async function check() {
  await AppDataSource.initialize();
  const r = await AppDataSource.query('SELECT * FROM tenant_subscriptions LIMIT 1');
  console.log('tenant_subscriptions columns:', Object.keys(r[0] || {}));
  await AppDataSource.destroy();
}

check();
