const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'urutix',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function runAnalyticsMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Analytics Foundation Migration...');
    
    // Check if migration has already been run
    const migrationCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'cargo_owner_analytics'
      );
    `);
    
    if (migrationCheck.rows[0].exists) {
      console.log('⚠️  Analytics tables already exist. Skipping migration.');
      return;
    }
    
    // Read and execute the migration file
    const migrationPath = path.join(__dirname, 'migrations', '021_cargo_owner_analytics_foundation.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📊 Creating analytics tables...');
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Analytics Foundation Migration completed successfully!');
    
    // Verify tables were created
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('cargo_owner_analytics', 'analytics_insights')
      ORDER BY table_name;
    `);
    
    console.log('📋 Created tables:', tableCheck.rows.map(row => row.table_name));
    
    // Check permissions were added
    const permissionCheck = await client.query(`
      SELECT name, description 
      FROM permissions 
      WHERE category = 'analytics'
      ORDER BY name;
    `);
    
    console.log('🔐 Added permissions:', permissionCheck.rows.map(row => row.name));
    
    // Check pricing rules were added
    const pricingCheck = await client.query(`
      SELECT rule_name, rule_type, credit_cost 
      FROM credit_pricing_rules 
      WHERE rule_type LIKE 'ANALYTICS_%'
      ORDER BY rule_name;
    `);
    
    console.log('💰 Added pricing rules:', pricingCheck.rows.map(row => `${row.rule_name} (${row.credit_cost} credits)`));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runAnalyticsMigration()
    .then(() => {
      console.log('🎉 Analytics migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Analytics migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runAnalyticsMigration };