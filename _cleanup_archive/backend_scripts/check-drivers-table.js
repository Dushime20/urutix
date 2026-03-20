const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkDriversTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚛 CHECKING DRIVERS TABLE');
    console.log('=' .repeat(50));

    // Check drivers table structure
    console.log('\n📋 1. DRIVERS TABLE STRUCTURE:');
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'drivers' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(structureQuery);
    
    if (structureResult.rows.length === 0) {
      console.log('❌ Drivers table not found');
      return;
    }

    console.log('✅ Drivers table columns:');
    structureResult.rows.forEach((column, index) => {
      console.log(`   ${index + 1}. ${column.column_name} (${column.data_type})`);
    });

    // Check drivers data
    console.log('\n📋 2. DRIVERS DATA:');
    const driversQuery = `
      SELECT 
        d.*,
        u.email,
        u.status as user_status
      FROM drivers d
      LEFT JOIN users u ON d."userId" = u.id
      ORDER BY d."createdAt" DESC;
    `;
    
    const driversResult = await client.query(driversQuery);
    
    if (driversResult.rows.length === 0) {
      console.log('❌ No drivers found in drivers table');
    } else {
      console.log(`✅ Found ${driversResult.rows.length} driver record(s):`);
      driversResult.rows.forEach((driver, index) => {
        console.log(`\n   Driver ${index + 1}:`);
        console.log(`   - ID: ${driver.id}`);
        console.log(`   - User ID: ${driver.userId}`);
        console.log(`   - Email: ${driver.email || 'No user linked'}`);
        console.log(`   - Name: ${driver.firstName || 'N/A'} ${driver.lastName || 'N/A'}`);
        console.log(`   - Phone: ${driver.phone || 'Not set'}`);
        console.log(`   - License: ${driver.licenseNumber || 'Not set'}`);
        console.log(`   - Status: ${driver.status || 'Not set'}`);
        console.log(`   - Created: ${driver.createdAt}`);
      });
    }

    // Check for users without driver records
    console.log('\n📋 3. USERS WITHOUT DRIVER RECORDS:');
    const usersWithoutDriversQuery = `
      SELECT 
        u.id,
        u.email,
        u."createdAt"
      FROM users u
      LEFT JOIN drivers d ON u.id = d."userId"
      WHERE u.role = 'DRIVER' AND d.id IS NULL
      ORDER BY u."createdAt" DESC;
    `;
    
    const usersWithoutDriversResult = await client.query(usersWithoutDriversQuery);
    
    if (usersWithoutDriversResult.rows.length === 0) {
      console.log('✅ All driver users have driver records');
    } else {
      console.log(`⚠️ Found ${usersWithoutDriversResult.rows.length} driver user(s) without driver records:`);
      usersWithoutDriversResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking drivers table:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDriversTable().catch(console.error);