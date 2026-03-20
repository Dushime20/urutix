const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'urutix',
  password: '123', 
  port: 5433,
});

async function checkColumns() {
  try {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'trips'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkColumns();
