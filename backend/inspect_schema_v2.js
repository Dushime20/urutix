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
    const tables = ['tenants', 'users'];
    for (const table of tables) {
      const cols = await ds.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      console.log(`Table: ${table}`);
      cols.forEach(c => console.log(`  - ${c.column_name}`));
    }
    await ds.destroy();
  } catch (err) {
    console.error(err);
  }
}
run();
