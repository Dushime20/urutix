const { Pool } = require('pg');
require('dotenv').config();

async function checkPhase4Tables() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔍 Checking Phase 4 Advanced Analytics tables...');
    
    // Check for Phase 4 specific tables
    const phase4Tables = [
      'ml_models',
      'analytics_stream',
      'api_marketplace_keys',
      'api_usage_logs'
    ];

    for (const tableName of phase4Tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);

      const exists = result.rows[0].exists;
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Check for Phase 4 views and functions
    console.log('\n🔍 Checking Phase 4 views and functions...');
    
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

    console.log('📊 Phase 4 views:');
    if (views.rows.length > 0) {
      views.rows.forEach(row => {
        console.log(`  ✅ ${row.table_name}`);
      });
    } else {
      console.log('  ❌ No Phase 4 views found');
    }

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

    console.log('\n🔧 Phase 4 functions:');
    if (functions.rows.length > 0) {
      functions.rows.forEach(row => {
        console.log(`  ✅ ${row.routine_name}`);
      });
    } else {
      console.log('  ❌ No Phase 4 functions found');
    }

    // Summary
    const allTablesExist = phase4Tables.every(async (tableName) => {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      return result.rows[0].exists;
    });

    console.log('\n📋 Phase 4 Migration Status:');
    if (views.rows.length > 0 && functions.rows.length > 0) {
      console.log('✅ Phase 4 Advanced Analytics migration appears to be complete!');
    } else {
      console.log('❌ Phase 4 migration needed - some tables/views/functions are missing');
    }

  } catch (error) {
    console.error('❌ Error checking Phase 4 tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkPhase4Tables();