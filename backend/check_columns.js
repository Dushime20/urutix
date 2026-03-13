const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix'
});

async function main() {
  try {
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'");
    const columns = res.rows.map(r => r.column_name).join(', ');
    require('fs').writeFileSync('columns_utf8.txt', columns, 'utf8');
    console.log('Done');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
