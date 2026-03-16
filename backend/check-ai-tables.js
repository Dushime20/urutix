const { Pool } = require('pg');
require('dotenv').config();

async function checkAITables() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔍 Checking AI Insights tables...');
    
    // Check for AI-related tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%ai%' OR 
        table_name LIKE '%predict%' OR 
        table_name LIKE '%ml%' OR
        table_name LIKE '%insight%' OR
        table_name LIKE '%forecast%'
      )
      ORDER BY table_name;
    `);

    console.log('📊 AI-related tables found:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check analytics_insights table structure
    const insightsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'analytics_insights' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 analytics_insights table structure:');
    insightsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check if Phase 3 specific columns exist
    const phase3Columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'analytics_insights' 
      AND column_name IN ('prediction_data', 'confidence_score', 'ai_model_version');
    `);

    console.log('\n🤖 Phase 3 AI columns:');
    if (phase3Columns.rows.length > 0) {
      phase3Columns.rows.forEach(row => {
        console.log(`  ✅ ${row.column_name}`);
      });
      console.log('\n✅ Phase 3 AI Insights migration appears to be complete!');
    } else {
      console.log('  ❌ Phase 3 AI columns not found - migration needed');
    }

  } catch (error) {
    console.error('❌ Error checking AI tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkAITables();