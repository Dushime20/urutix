/**
 * Script to create the messages table in the database
 * Run with: node create-messages-table.js
 */

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'urutix',
});

const createMessagesTableSQL = `
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id VARCHAR(255) NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  sender_role VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
  is_read BOOLEAN NOT NULL DEFAULT false,
  trip_id UUID,
  load_id UUID,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON messages(tenant_id);
`;

async function createMessagesTable() {
  try {
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'urutix'}`);
    
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n📝 Creating messages table...');
    await client.query(createMessagesTableSQL);
    console.log('✅ Messages table created successfully');

    // Verify table exists
    console.log('\n🔍 Verifying table structure...');
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Messages table columns:');
    console.table(result.rows);

    // Check indexes
    const indexes = await client.query(`
      SELECT 
        indexname, 
        indexdef
      FROM pg_indexes
      WHERE tablename = 'messages';
    `);

    console.log('\n🔑 Indexes created:');
    indexes.rows.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });

    console.log('\n✨ Migration completed successfully!');
    console.log('   You can now restart your backend server.');

  } catch (error) {
    console.error('\n❌ Error creating messages table:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
createMessagesTable();
