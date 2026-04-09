-- Create messages table for messenger functionality
-- Run this SQL script in your PostgreSQL database

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

-- Create foreign keys (optional - will set NULL if user is deleted)
ALTER TABLE messages 
  DROP CONSTRAINT IF EXISTS fk_messages_sender,
  ADD CONSTRAINT fk_messages_sender 
  FOREIGN KEY (sender_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

ALTER TABLE messages 
  DROP CONSTRAINT IF EXISTS fk_messages_recipient,
  ADD CONSTRAINT fk_messages_recipient 
  FOREIGN KEY (recipient_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Verify table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'messages';

COMMIT;
