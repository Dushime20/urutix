const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'urutix',
  password: process.env.DB_PASSWORD || '123',
  port: process.env.DB_PORT || 5433,
};

async function runUserKycMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🚀 Starting User KYC System Migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '020_user_kyc_system_enhancement.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ User KYC System Migration completed successfully!');
    
    // Verify the migration by checking if tables exist
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_kyc_documents', 'user_kyc_audit_log', 'kyc_role_requirements')
    `);
    
    console.log('📊 Created tables:', tableCheck.rows.map(row => row.table_name));
    
    // Check if KYC requirements were seeded
    const requirementsCheck = await pool.query('SELECT role, requirement_level FROM kyc_role_requirements ORDER BY role');
    console.log('📋 KYC Requirements seeded:');
    requirementsCheck.rows.forEach(row => {
      console.log(`  - ${row.role}: ${row.requirement_level}`);
    });
    
    // Check user profiles with KYC requirement levels
    const profilesCheck = await pool.query(`
      SELECT 
        u.role,
        up.kyc_requirement_level,
        COUNT(*) as count
      FROM user_profiles up
      JOIN users u ON u.id = up."userId"
      GROUP BY u.role, up.kyc_requirement_level
      ORDER BY u.role
    `);
    
    console.log('👥 User profiles updated with KYC requirement levels:');
    profilesCheck.rows.forEach(row => {
      console.log(`  - ${row.role} (${row.kyc_requirement_level}): ${row.count} users`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runUserKycMigration();