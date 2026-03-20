const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'postgres', host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
});

async function run() {
  await ds.initialize();
  const res = await ds.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants'");
  res.forEach(r => console.log(r.column_name));
  await ds.destroy();
}
run();
