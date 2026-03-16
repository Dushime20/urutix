const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

async function runAIInsightsMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🚀 Starting AI Insights Migration (Phase 3)...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '025_ai_insights.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    console.log('🤖 Creating AI insights and predictive analytics tables...');
    await pool.query(migrationSQL);
    
    console.log('✅ AI Insights Migration completed successfully!');
    console.log('');
    console.log('📋 Created tables:');
    console.log('  - predictive_insights');
    console.log('  - ai_recommendations');
    console.log('  - analytics_alerts');
    console.log('  - alert_triggers_log');
    console.log('  - ai_model_performance');
    console.log('');
    console.log('🔧 Enhanced existing tables:');
    console.log('  - analytics_insights (added AI fields)');
    console.log('');
    console.log('📈 Created views:');
    console.log('  - ai_insights_dashboard');
    console.log('  - recommendations_summary');
    console.log('');
    console.log('⚡ Created functions:');
    console.log('  - expire_old_predictions()');
    console.log('  - update_prediction_accuracy()');
    console.log('  - schedule_prediction_expiry()');
    console.log('');
    console.log('🎯 Sample data inserted:');
    console.log('  - 3 predictive insights');
    console.log('  - 2 AI recommendations');
    console.log('  - 2 analytics alerts');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  1. Restart the backend server');
    console.log('  2. Test AI insights endpoints');
    console.log('  3. Verify predictive analytics functionality');
    console.log('  4. Test alert management system');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runAIInsightsMigration();