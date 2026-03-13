const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
  synchronize: false,
});

async function run() {
  try {
    await ds.initialize();
    const tables = await ds.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    await ds.destroy();
  } catch (err) {
    console.error(err);
  }
}
run();
