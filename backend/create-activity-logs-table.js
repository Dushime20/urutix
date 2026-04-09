const { Client } = require('pg');
require('dotenv').config();

async function createActivityLogsTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if table already exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'activity_logs'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('ℹ️  activity_logs table already exists');
      return;
    }

    console.log('📝 Creating activity_logs table...');
    
    // Create the activity_logs table
    await client.query(`
      CREATE TABLE activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        resource_id VARCHAR(255),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        location JSONB,
        is_suspicious BOOLEAN DEFAULT false,
        session_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) 
          REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    console.log('✅ activity_logs table created');

    // Create indexes
    console.log('📝 Creating indexes...');
    
    await client.query(`
      CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
    `);
    console.log('✅ Index on user_id created');

    await client.query(`
      CREATE INDEX idx_activity_logs_action ON activity_logs(action);
    `);
    console.log('✅ Index on action created');

    await client.query(`
      CREATE INDEX idx_activity_logs_resource ON activity_logs(resource, resource_id);
    `);
    console.log('✅ Index on resource and resource_id created');

    await client.query(`
      CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
    `);
    console.log('✅ Index on created_at created');

    await client.query(`
      CREATE INDEX idx_activity_logs_suspicious ON activity_logs(is_suspicious) WHERE is_suspicious = true;
    `);
    console.log('✅ Partial index on is_suspicious created');

    // Verify table structure
    console.log('\n📊 Verifying activity_logs table structure...');
    const result = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'activity_logs'
      ORDER BY ordinal_position;
    `);

    console.log('\n✅ Columns in activity_logs table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'} ${row.column_default ? `(default: ${row.column_default})` : ''}`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error creating activity_logs table:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createActivityLogsTable()
  .then(() => {
    console.log('\n🎉 activity_logs table created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
