const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '123',
  database: 'urutix'
});

async function checkColumnType() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'notification_preferences' 
      AND column_name = 'enabled_channels'
    `);
    
    console.log('enabled_channels column info:');
    console.log(result.rows[0]);
    
    // Also check the actual data
    const data = await client.query(`
      SELECT enabled_channels, pg_typeof(enabled_channels) as type
      FROM notification_preferences 
      LIMIT 1
    `);
    
    console.log('\nActual data sample:');
    console.log(data.rows[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkColumnType();