const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '123',
  database: 'urutix'
});

async function checkTables() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check all tables with 'notification' in the name
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%notification%'
      ORDER BY table_name;
    `);
    
    console.log('\nTables with "notification" in name:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check if the migration was applied
    const migrationCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);
    
    if (migrationCheck.rows[0].exists) {
      const migrations = await client.query(`
        SELECT name FROM migrations 
        WHERE name LIKE '%notification%' 
        ORDER BY timestamp DESC;
      `);
      
      console.log('\nNotification-related migrations:');
      migrations.rows.forEach(migration => {
        console.log(`  - ${migration.name}`);
      });
    }
    
    // Check the actual structure of notification_preferences if it exists
    const prefTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notification_preferences'
      );
    `);
    
    if (prefTableExists.rows[0].exists) {
      console.log('\nnotification_preferences table structure:');
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'notification_preferences'
        ORDER BY ordinal_position;
      `);
      
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) default: ${col.column_default}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();