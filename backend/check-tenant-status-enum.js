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
  const r = await AppDataSource.query(`SELECT unnest(enum_range(NULL::tenants_status_enum))::text as status`);
  console.log('Valid tenant statuses:', r.map(x => x.status).join(', '));
  
  const tenants = await AppDataSource.query(`SELECT id, name, status FROM tenants LIMIT 3`);
  console.log('\nExisting tenants:');
  tenants.forEach(t => console.log(`  - ${t.name}: ${t.status}`));
  
  await AppDataSource.destroy();
}

check();
