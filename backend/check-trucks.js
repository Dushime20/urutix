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
    // Check trucks by tenant
    const result = await pool.query(`
      SELECT COUNT(*) as count, "tenantId" 
      FROM trucks 
      GROUP BY "tenantId"
    `);
    
    console.log('\n📊 Trucks by Tenant:');
    console.log('='.repeat(50));
    if (result.rows.length === 0) {
      console.log('❌ No trucks found in database');
    } else {
      result.rows.forEach(row => {
        console.log(`  Tenant ${row.tenantId}: ${row.count} trucks`);
      });
    }
    
    // Get default tenant ID
    const tenantResult = await pool.query(`
      SELECT id FROM tenants LIMIT 1
    `);
    
    if (tenantResult.rows.length > 0) {
      const defaultTenantId = tenantResult.rows[0].id;
      console.log(`\n🔍 Checking trucks for default tenant: ${defaultTenantId}`);
      
      const trucksResult = await pool.query(`
        SELECT id, "plateNumber", "make", "model", "status", "tenantId", "ownerId"
        FROM trucks 
        WHERE "tenantId" = $1
        LIMIT 10
      `, [defaultTenantId]);
      
      console.log(`\n📋 Trucks for tenant ${defaultTenantId}:`);
      console.log('='.repeat(50));
      if (trucksResult.rows.length === 0) {
        console.log('❌ No trucks found for this tenant');
      } else {
        trucksResult.rows.forEach((truck, index) => {
          console.log(`  ${index + 1}. ${truck.plateNumber} - ${truck.make} ${truck.model} (${truck.status})`);
          console.log(`     ID: ${truck.id}`);
          console.log(`     Owner: ${truck.ownerId}`);
        });
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTrucks();

