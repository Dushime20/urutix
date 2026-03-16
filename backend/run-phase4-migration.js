#!/usr/bin/env node

/**
 * Phase 4 Advanced Analytics Migration Runner
 * Executes the advanced analytics and ML pipeline database migration
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
};

async function runPhase4Migration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🚀 Starting Phase 4 Advanced Analytics Migration...');
    console.log('🤖 Creating advanced ML pipeline and API marketplace tables...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '026_advanced_analytics_phase4.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Phase 4 migration completed successfully!');
    console.log('📊 Advanced analytics tables created:');
    console.log('   - ml_models (ML model management)');
    console.log('   - analytics_stream (real-time processing)');
    console.log('   - api_marketplace_keys (API key management)');
    console.log('   - api_usage_logs (usage tracking)');
    console.log('🔍 Advanced views and functions created');
    console.log('🔐 Advanced analytics permissions added');
    
    // Verify the migration
    const verificationQueries = [
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'ml_models'",
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'analytics_stream'",
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'api_marketplace_keys'",
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'api_usage_logs'"
    ];
    
    for (const query of verificationQueries) {
      const result = await pool.query(query);
      if (result.rows[0].count === '0') {
        throw new Error('Migration verification failed - tables not created');
      }
    }
    
    console.log('✅ Migration verification passed - all tables created successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runPhase4Migration().catch(error => {
  console.error('❌ Migration execution failed:', error);
  process.exit(1);
});