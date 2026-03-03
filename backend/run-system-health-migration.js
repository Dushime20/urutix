const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting system health migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '010_system_health_logs.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ System health migration completed successfully!');
    
    // Verify table creation
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'system_health_logs'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table system_health_logs created successfully');
      
      // Check indexes
      const indexes = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'system_health_logs'
      `);
      
      console.log(`✅ Created ${indexes.rows.length} indexes`);
      indexes.rows.forEach(row => {
        console.log(`   - ${row.indexname}`);
      });
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
