const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '123',
  database: 'urutix'
});

async function checkTable() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check if table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_preferences'
      );
    `);
    
    console.log('Table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'notification_preferences'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure:');
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check if there are any records
      const count = await client.query('SELECT COUNT(*) FROM notification_preferences');
      console.log('\nRecord count:', count.rows[0].count);
      
      // Try to query the table like the controller does
      console.log('\nTesting query similar to controller...');
      const testQuery = await client.query(`
        SELECT * FROM notification_preferences 
        WHERE tenant_id = '1' 
        ORDER BY notification_type ASC
        LIMIT 5;
      `);
      console.log('Test query result count:', testQuery.rows.length);
      
    } else {
      console.log('Table does not exist - this is the problem!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

checkTable();