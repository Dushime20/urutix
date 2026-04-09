const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'urutix',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting credit-based subscription migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '028_update_subscription_plans_credit_based.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    console.log('📝 Executing migration SQL...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify the new columns exist
    console.log('🔍 Verifying new columns...');
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'subscription_plans' 
      AND column_name IN (
        'price_per_credit', 
        'total_credits', 
        'credits_per_ton_tenant', 
        'credits_per_ton_truck_owner'
      )
      ORDER BY column_name;
    `);
    
    console.log('\n📊 New columns in subscription_plans table:');
    console.table(result.rows);
    
    // Check existing plans
    const plansResult = await client.query(`
      SELECT 
        id,
        name,
        slug,
        price_per_credit,
        total_credits,
        credits_per_ton_tenant,
        credits_per_ton_truck_owner,
        is_active
      FROM subscription_plans
      ORDER BY display_order;
    `);
    
    if (plansResult.rows.length > 0) {
      console.log('\n📋 Existing subscription plans updated:');
      console.table(plansResult.rows);
    } else {
      console.log('\n⚠️  No existing subscription plans found.');
      console.log('💡 You can create new plans using the admin interface.');
    }
    
    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test creating a new subscription plan in the admin UI');
    console.log('   2. Verify the credit-based fields are saved correctly');
    console.log('   3. Update the backend entity to match the new schema');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
