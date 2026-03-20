const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '123',
  database: 'urutix'
});

async function checkNotificationLogs() {
  try {
    await client.connect();
    
    const exists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_logs'
      );
    `);
    
    console.log('notification_logs table exists:', exists.rows[0].exists);
    
    if (exists.rows[0].exists) {
      const count = await client.query('SELECT COUNT(*) FROM notification_logs');
      console.log('notification_logs record count:', count.rows[0].count);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkNotificationLogs();