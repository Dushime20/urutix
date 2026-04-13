/**
 * Fix Permissions Schema
 * 
 * This script fixes the mismatch between existing tables and migration 003.
 * It aligns the existing schema with what the migration expects.
 */

const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
};

async function fixSchema() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔧 Fixing permissions schema...\n');
    
    await client.connect();
    console.log('✅ Connected to database\n');

    await client.query('BEGIN');

    // 1. Fix user_permissions table
    console.log('1. Fixing user_permissions table...');
    
    // Check if 'granted' column exists
    const grantedExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'granted'
      )
    `);

    // Check if 'is_granted' column exists
    const isGrantedExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_permissions' 
        AND column_name = 'is_granted'
      )
    `);

    if (grantedExists.rows[0].exists && !isGrantedExists.rows[0].exists) {
      console.log('   Renaming column "granted" to "is_granted"...');
      await client.query(`
        ALTER TABLE user_permissions 
        RENAME COLUMN granted TO is_granted
      `);
      console.log('   ✅ Column renamed');
    } else if (isGrantedExists.rows[0].exists) {
      console.log('   ✅ Column "is_granted" already exists');
    } else {
      console.log('   Adding column "is_granted"...');
      await client.query(`
        ALTER TABLE user_permissions 
        ADD COLUMN IF NOT EXISTS is_granted BOOLEAN NOT NULL DEFAULT true
      `);
      console.log('   ✅ Column added');
    }

    // Add missing columns if they don't exist
    console.log('   Adding missing columns...');
    
    await client.query(`
      ALTER TABLE user_permissions 
      ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP DEFAULT NOW()
    `);
    
    await client.query(`
      ALTER TABLE user_permissions 
      ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    
    await client.query(`
      ALTER TABLE user_permissions 
      ADD COLUMN IF NOT EXISTS reason TEXT
    `);
    
    await client.query(`
      ALTER TABLE user_permissions 
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP
    `);
    
    console.log('   ✅ Missing columns added\n');

    // 2. Add missing indexes
    console.log('2. Adding missing indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_permissions_granted 
      ON user_permissions(is_granted)
    `);
    
    console.log('   ✅ Indexes added\n');

    // 3. Create permission_audit_log table if missing
    console.log('3. Creating permission_audit_log table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS permission_audit_log (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        changes JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_entity 
      ON permission_audit_log(entity_type, entity_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_created 
      ON permission_audit_log(created_at DESC)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_user 
      ON permission_audit_log(user_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_action 
      ON permission_audit_log(action)
    `);
    
    console.log('   ✅ Table created\n');

    // 4. Fix role_permissions table
    console.log('4. Fixing role_permissions table...');
    
    await client.query(`
      ALTER TABLE role_permissions 
      ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP DEFAULT NOW()
    `);
    
    await client.query(`
      ALTER TABLE role_permissions 
      ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    
    console.log('   ✅ Columns added\n');

    // 5. Remove the failed migration record
    console.log('5. Removing failed migration record...');
    await client.query(`
      DELETE FROM schema_migrations 
      WHERE migration_name = '003_rbac_permissions_system.sql'
    `);
    console.log('   ✅ Record removed\n');

    await client.query('COMMIT');

    console.log('✅ Schema fixed successfully!\n');
    console.log('Now run: npm run migrations:run\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixSchema();
