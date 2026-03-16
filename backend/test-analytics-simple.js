const { Pool } = require('pg');
require('dotenv').config();

async function testAnalyticsSystem() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🚀 Testing Cargo Owner Analytics System...\n');

    // Test Phase 1: Foundation tables
    console.log('📊 Phase 1: Foundation & Financial Analytics');
    const phase1Tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('cargo_owner_analytics', 'analytics_insights')
      ORDER BY table_name;
    `);
    
    phase1Tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Test Phase 2: Operational Analytics
    console.log('\n📈 Phase 2: Operational Analytics');
    const operationalData = await pool.query(`
      SELECT COUNT(*) as count FROM cargo_owner_analytics;
    `);
    console.log(`  ✅ Analytics data records: ${operationalData.rows[0].count}`);

    // Test Phase 3: AI Insights
    console.log('\n🤖 Phase 3: AI Insights & Predictive Analytics');
    const insightsData = await pool.query(`
      SELECT COUNT(*) as count FROM analytics_insights;
    `);
    console.log(`  ✅ Insights records: ${insightsData.rows[0].count}`);

    // Test Phase 4: Advanced Analytics
    console.log('\n🚀 Phase 4: Advanced Analytics & Market Leadership');
    const phase4Tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ml_models', 'analytics_stream', 'api_marketplace_keys', 'api_usage_logs')
      ORDER BY table_name;
    `);
    
    phase4Tables.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Test Views
    console.log('\n📋 Advanced Analytics Views');
    const views = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE 'v_ml_%' OR 
        table_name LIKE 'v_realtime_%' OR 
        table_name LIKE 'v_api_%'
      )
      ORDER BY table_name;
    `);
    
    views.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Test Functions
    console.log('\n🔧 Advanced Analytics Functions');
    const functions = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND (
        routine_name LIKE 'fn_train_ml_%' OR 
        routine_name LIKE 'fn_generate_api_%' OR 
        routine_name LIKE 'fn_process_analytics_%'
      )
      ORDER BY routine_name;
    `);
    
    functions.rows.forEach(row => {
      console.log(`  ✅ ${row.routine_name}`);
    });

    // Test Permissions
    console.log('\n🔐 Analytics Permissions');
    const permissions = await pool.query(`
      SELECT name 
      FROM permissions 
      WHERE category = 'analytics' 
      ORDER BY name;
    `);
    
    permissions.rows.forEach(row => {
      console.log(`  ✅ ${row.name}`);
    });

    console.log('\n🎉 Cargo Owner Analytics System Database Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`  • Phase 1 Tables: ${phase1Tables.rows.length}/2`);
    console.log(`  • Phase 4 Tables: ${phase4Tables.rows.length}/4`);
    console.log(`  • Advanced Views: ${views.rows.length}`);
    console.log(`  • Advanced Functions: ${functions.rows.length}`);
    console.log(`  • Analytics Permissions: ${permissions.rows.length}`);
    console.log(`  • Analytics Data Records: ${operationalData.rows[0].count}`);
    console.log(`  • Insights Records: ${insightsData.rows[0].count}`);

    if (phase1Tables.rows.length === 2 && phase4Tables.rows.length === 4) {
      console.log('\n✅ All phases successfully deployed!');
      console.log('🚀 Cargo Owner Analytics System is ready for production!');
    } else {
      console.log('\n❌ Some tables are missing - check migration status');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testAnalyticsSystem();