const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'urutix',
  password: process.env.DB_PASSWORD || '123',
  port: process.env.DB_PORT || 5433,
};

async function checkUserProfilesStructure() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔍 Checking user_profiles table structure...\n');
    
    // Check if user_profiles table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ user_profiles table does not exist!');
      return;
    }
    
    console.log('✅ user_profiles table exists');
    
    // Get table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      ORDER BY ordinal_position;
    `);
    
    console.log(`\n📊 user_profiles table has ${columns.rows.length} columns:`);
    console.log('Column Name'.padEnd(30) + 'Data Type'.padEnd(20) + 'Nullable'.padEnd(10) + 'Default');
    console.log('-'.repeat(80));
    
    const kycColumns = [];
    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
      const defaultVal = col.column_default || 'NULL';
      console.log(
        col.column_name.padEnd(30) + 
        col.data_type.padEnd(20) + 
        nullable.padEnd(10) + 
        defaultVal
      );
      
      // Check for existing KYC columns
      if (col.column_name.includes('kyc') || 
          col.column_name.includes('verified') || 
          col.column_name === 'compliance_score') {
        kycColumns.push(col.column_name);
      }
    });
    
    console.log(`\n🔍 Existing KYC-related columns (${kycColumns.length}):`);
    if (kycColumns.length > 0) {
      kycColumns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('  No KYC columns found - migration will add them');
    }
    
    // Check for specific columns that might cause issues
    const criticalColumns = ['kyc_status', 'kyc_requirement_level', 'kyc_data'];
    console.log('\n🎯 Critical KYC columns check:');
    criticalColumns.forEach(col => {
      const exists = columns.rows.some(row => row.column_name === col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserProfilesStructure();