const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || '123',
});

async function checkTrucks() {
  try {
    const tenantId = '00000000-0000-0000-0000-000000000001';
    
    // Check all trucks for this tenant
    const allTrucks = await pool.query(`
      SELECT id, "plateNumber", "make", "model", "status", "isActive", "tenantId", "deleted_at"
      FROM trucks 
      WHERE "tenantId" = $1
    `, [tenantId]);
    
    console.log('\n📋 All trucks for tenant:', tenantId);
    console.log('='.repeat(70));
    allTrucks.rows.forEach((truck, index) => {
      console.log(`${index + 1}. ${truck.plateNumber} - ${truck.make} ${truck.model}`);
      console.log(`   ID: ${truck.id}`);
      console.log(`   Status: ${truck.status}`);
      console.log(`   isActive: ${truck.isActive} (type: ${typeof truck.isActive})`);
      console.log(`   deleted_at: ${truck.deleted_at || 'NULL'}`);
      console.log('');
    });
    
    // Check trucks that match the query conditions
    const activeTrucks = await pool.query(`
      SELECT COUNT(*) as count
      FROM trucks 
      WHERE "tenantId" = $1 
        AND "isActive" = $2 
        AND "deleted_at" IS NULL
    `, [tenantId, true]);
    
    console.log(`\n✅ Trucks matching query conditions (tenantId + isActive=true + not deleted): ${activeTrucks.rows[0].count}`);
    
    // Check trucks without isActive filter
    const trucksWithoutActive = await pool.query(`
      SELECT COUNT(*) as count
      FROM trucks 
      WHERE "tenantId" = $1 
        AND "deleted_at" IS NULL
    `, [tenantId]);
    
    console.log(`📊 Trucks without isActive filter: ${trucksWithoutActive.rows[0].count}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTrucks();

