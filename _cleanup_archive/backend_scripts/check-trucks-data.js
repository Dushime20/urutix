const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTrucksData() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking trucks data...\n');

    // Check total trucks
    const totalResult = await client.query('SELECT COUNT(*) FROM trucks');
    console.log(`📊 Total trucks in database: ${totalResult.rows[0].count}`);

    // Check trucks by tenant
    const tenantResult = await client.query(`
      SELECT "tenantId", COUNT(*) as count
      FROM trucks
      GROUP BY "tenantId"
    `);
    console.log('\n📊 Trucks by tenant:');
    tenantResult.rows.forEach(row => {
      console.log(`   Tenant ${row.tenantId}: ${row.count} trucks`);
    });

    // Check trucks by owner
    const ownerResult = await client.query(`
      SELECT "ownerId", COUNT(*) as count
      FROM trucks
      WHERE "ownerId" IS NOT NULL
      GROUP BY "ownerId"
    `);
    console.log('\n📊 Trucks by owner:');
    ownerResult.rows.forEach(row => {
      console.log(`   Owner ${row.ownerId}: ${row.count} trucks`);
    });

    // Check trucks without owner
    const noOwnerResult = await client.query(`
      SELECT COUNT(*) FROM trucks WHERE "ownerId" IS NULL
    `);
    console.log(`\n📊 Trucks without owner: ${noOwnerResult.rows[0].count}`);

    // Check active trucks
    const activeResult = await client.query(`
      SELECT COUNT(*) FROM trucks WHERE "isActive" = true
    `);
    console.log(`\n📊 Active trucks: ${activeResult.rows[0].count}`);

    // Check deleted trucks
    const deletedResult = await client.query(`
      SELECT COUNT(*) FROM trucks WHERE deleted_at IS NOT NULL
    `);
    console.log(`📊 Deleted trucks: ${deletedResult.rows[0].count}`);

    // Sample trucks data
    const sampleResult = await client.query(`
      SELECT id, "plateNumber", make, model, "tenantId", "ownerId", "isActive", deleted_at, status
      FROM trucks
      LIMIT 5
    `);
    console.log('\n📊 Sample trucks:');
    sampleResult.rows.forEach(truck => {
      console.log(`   ${truck.plateNumber} (${truck.make} ${truck.model})`);
      console.log(`      ID: ${truck.id}`);
      console.log(`      Tenant: ${truck.tenantId}`);
      console.log(`      Owner: ${truck.ownerId || 'NULL'}`);
      console.log(`      Active: ${truck.isActive}`);
      console.log(`      Deleted: ${truck.deleted_at ? 'Yes' : 'No'}`);
      console.log(`      Status: ${truck.status}`);
      console.log('');
    });

    // Check users
    const usersResult = await client.query(`
      SELECT id, email, role, "tenantId"
      FROM users
      LIMIT 5
    `);
    console.log('\n📊 Sample users:');
    usersResult.rows.forEach(user => {
      console.log(`   ${user.email} (${user.role})`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Tenant: ${user.tenantId}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTrucksData();
