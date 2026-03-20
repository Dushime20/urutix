const { Client } = require('pg');

async function verifySchema() {
  const client = new Client({
    connectionString: 'postgresql://postgres:123@127.0.0.1:5433/urutix'
  });

  try {
    await client.connect();
    console.log('🔍 Verifying Phase 1 Schema...\n');
    
    // 1. Check security_events table
    console.log('=== SECURITY_EVENTS TABLE ===');
    const securityEventsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'security_events' 
      ORDER BY ordinal_position
    `);
    securityEventsColumns.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.data_type} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 2. Check user_sessions table
    console.log('\n=== USER_SESSIONS TABLE ===');
    const userSessionsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_sessions' 
      ORDER BY ordinal_position
    `);
    userSessionsColumns.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.data_type} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 3. Check tenants table enhancements
    console.log('\n=== TENANTS TABLE (New Columns) ===');
    const tenantsNewColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      AND column_name IN ('health_score', 'last_health_check')
      ORDER BY column_name
    `);
    tenantsNewColumns.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.data_type} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${r.column_default ? `DEFAULT ${r.column_default}` : ''}`);
    });
    
    // 4. Check activity_logs table enhancements
    console.log('\n=== ACTIVITY_LOGS TABLE (New Columns) ===');
    const activityLogsNewColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs' 
      AND column_name IN ('ip_address', 'user_agent', 'security_relevant')
      ORDER BY column_name
    `);
    activityLogsNewColumns.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.data_type} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${r.column_default ? `DEFAULT ${r.column_default}` : ''}`);
    });
    
    // 5. Check indexes
    console.log('\n=== INDEXES ===');
    const indexes = await client.query(`
      SELECT tablename, indexname
      FROM pg_indexes 
      WHERE tablename IN ('security_events', 'user_sessions', 'tenants', 'activity_logs')
      AND indexname LIKE '%security%' OR indexname LIKE '%health%' OR indexname LIKE '%session%'
      ORDER BY tablename, indexname
    `);
    const groupedIndexes = {};
    indexes.rows.forEach(r => {
      if (!groupedIndexes[r.tablename]) groupedIndexes[r.tablename] = [];
      groupedIndexes[r.tablename].push(r.indexname);
    });
    Object.keys(groupedIndexes).forEach(table => {
      console.log(`  ${table}:`);
      groupedIndexes[table].forEach(idx => console.log(`    - ${idx}`));
    });
    
    // 6. Check views
    console.log('\n=== VIEWS ===');
    const views = await client.query(`
      SELECT table_name
      FROM information_schema.views 
      WHERE table_name IN ('recent_security_events', 'active_sessions_summary', 'tenant_health_overview')
      ORDER BY table_name
    `);
    views.rows.forEach(r => {
      console.log(`  ✓ ${r.table_name}`);
    });
    
    // 7. Check functions
    console.log('\n=== FUNCTIONS ===');
    const functions = await client.query(`
      SELECT routine_name
      FROM information_schema.routines 
      WHERE routine_name IN ('cleanup_expired_sessions', 'update_session_activity')
      ORDER BY routine_name
    `);
    functions.rows.forEach(r => {
      console.log(`  ✓ ${r.routine_name}()`);
    });
    
    // 8. Check foreign keys
    console.log('\n=== FOREIGN KEY CONSTRAINTS ===');
    const foreignKeys = await client.query(`
      SELECT 
        tc.table_name, 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('security_events', 'user_sessions')
      ORDER BY tc.table_name, tc.constraint_name
    `);
    foreignKeys.rows.forEach(r => {
      console.log(`  ${r.table_name}.${r.column_name} -> ${r.foreign_table_name}.${r.foreign_column_name}`);
    });
    
    console.log('\n✅ Phase 1 schema verification complete!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifySchema();
