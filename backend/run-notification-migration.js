const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '123',
  database: 'urutix'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Running notification system migration...');
    
    // First, let's drop the existing notification_preferences table to avoid conflicts
    console.log('Dropping existing notification_preferences table...');
    await client.query('DROP TABLE IF EXISTS notification_preferences CASCADE');
    
    // Read and execute the migration
    const migrationSQL = fs.readFileSync('./migrations/018_notification_system.sql', 'utf8');
    
    // Execute the entire migration
    console.log('Executing migration...');
    await client.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify the new table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'notification_preferences'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nNew table structure:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if default preferences were inserted
    const count = await client.query('SELECT COUNT(*) FROM notification_preferences');
    console.log(`\nDefault preferences inserted: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

runMigration();