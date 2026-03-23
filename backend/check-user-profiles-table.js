const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: true,
});

async function checkUserProfilesTable() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();

    console.log('Checking user_profiles table structure...');
    
    // Get table columns
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);

    console.log('\nCurrent user_profiles columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if kyc_requirement_level exists
    const hasKycRequirementLevel = columns.some(col => col.column_name === 'kyc_requirement_level');
    
    if (!hasKycRequirementLevel) {
      console.log('\n❌ Missing column: kyc_requirement_level');
      console.log('Adding the missing column...');
      
      await dataSource.query(`
        ALTER TABLE "user_profiles" 
        ADD COLUMN IF NOT EXISTS "kyc_requirement_level" character varying(20) DEFAULT 'BASIC'
      `);
      
      console.log('✅ Added kyc_requirement_level column');
    } else {
      console.log('\n✅ kyc_requirement_level column exists');
    }

    await dataSource.destroy();
    console.log('\nTable check completed!');
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

checkUserProfilesTable();