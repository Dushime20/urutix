const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Super Admin Phase 1 migration...');
    console.log('📋 This migration will:');
    console.log('   - Enhance system_health_logs table');
    console.log('   - Create security_events table');
    console.log('   - Create user_sessions table');
    console.log('   - Add health_score and last_health_check to tenants');
    console.log('   - Add security_relevant to activity_logs');
    console.log('');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '013_super_admin_phase1_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    
    // Verify table creation
    console.log('🔍 Verifying migration results...');
    
    // Check security_events table
    const securityEventsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'security_events'
    `);
    
    if (securityEventsResult.rows.length > 0) {
      console.log('✅ Table security_events created successfully');
      
      const securityIndexes = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'security_events'
        ORDER BY indexname
      `);
      
      console.log(`   - Created ${securityIndexes.rows.length} indexes`);
    }
    
    // Check user_sessions table
    const userSessionsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_sessions'
    `);
    
    if (userSessionsResult.rows.length > 0) {
      console.log('✅ Table user_sessions created successfully');
      
      const sessionIndexes = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'user_sessions'
        ORDER BY indexname
      `);
      
      console.log(`   - Created ${sessionIndexes.rows.length} indexes`);
    }
    
    // Check tenants table enhancements
    const tenantsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name IN ('health_score', 'last_health_check')
      ORDER BY column_name
    `);
    
    if (tenantsColumns.rows.length === 2) {
      console.log('✅ Tenants table enhanced with health monitoring columns');
      tenantsColumns.rows.forEach(row => {
        console.log(`   - ${row.column_name}`);
      });
    }
    
    // Check activity_logs table enhancements
    const activityLogsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs' 
      AND column_name = 'security_relevant'
    `);
    
    if (activityLogsColumns.rows.length > 0) {
      console.log('✅ Activity logs table enhanced with security_relevant column');
    }
    
    // Check views
    const views = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name IN ('recent_security_events', 'active_sessions_summary', 'tenant_health_overview')
      ORDER BY table_name
    `);
    
    if (views.rows.length > 0) {
      console.log('✅ Created helper views:');
      views.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Check functions
    const functions = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name IN ('cleanup_expired_sessions', 'update_session_activity')
      ORDER BY routine_name
    `);
    
    if (functions.rows.length > 0) {
      console.log('✅ Created helper functions:');
      functions.rows.forEach(row => {
        console.log(`   - ${row.routine_name}()`);
      });
    }
    
    console.log('');
    console.log('📊 Migration Summary:');
    console.log('   ✓ 2 new tables created (security_events, user_sessions)');
    console.log('   ✓ 3 tables enhanced (system_health_logs, tenants, activity_logs)');
    console.log('   ✓ 3 views created for common queries');
    console.log('   ✓ 2 helper functions created');
    console.log('');
    console.log('🎉 Phase 1 database schema is ready!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ All done! You can now proceed with Phase 1 implementation.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed. Please check the error above and try again.');
    process.exit(1);
  });
