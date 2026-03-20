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

async function runOperationalAnalyticsMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🚀 Starting Operational Analytics Migration (Phase 2)...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '023_operational_analytics.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    console.log('📊 Creating operational analytics tables...');
    await pool.query(migrationSQL);
    
    console.log('✅ Operational Analytics Migration completed successfully!');
    console.log('');
    console.log('📋 Created tables:');
    console.log('  - carrier_performance_metrics');
    console.log('  - route_analytics');
    console.log('  - market_intelligence_data');
    console.log('  - operational_performance_snapshots');
    console.log('');
    console.log('🔧 Enhanced existing tables:');
    console.log('  - cargo_owner_analytics (added operational fields)');
    console.log('  - analytics_insights (added operational context)');
    console.log('');
    console.log('📈 Created views:');
    console.log('  - operational_analytics_dashboard');
    console.log('');
    console.log('⚡ Created triggers:');
    console.log('  - trigger_update_carrier_performance');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('  1. Restart the backend server');
    console.log('  2. Test operational analytics endpoints');
    console.log('  3. Verify carrier performance calculations');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runOperationalAnalyticsMigration();