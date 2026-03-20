require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function checkDrivers() {
  console.log('🚛 Checking Drivers in Database...\n');

  try {
    const client = await pool.connect();
    
    // Check drivers table
    const driversResult = await client.query(`
      SELECT 
        d.id,
        d.first_name,
        d.last_name,
        d.email,
        d.license_number,
        d.status,
        d.tenant_id,
        t.name as tenant_name,
        d.employer_id,
        u.email as employer_email
      FROM drivers d
      LEFT JOIN tenants t ON d.tenant_id = t.id
      LEFT JOIN users u ON d.employer_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 10
    `);

    console.log(`📊 Found ${driversResult.rows.length} drivers:`);
    
    driversResult.rows.forEach((driver, index) => {
      console.log(`\n${index + 1}. ${driver.first_name} ${driver.last_name}`);
      console.log(`   📧 Email: ${driver.email}`);
      console.log(`   🆔 ID: ${driver.id}`);
      console.log(`   🚗 License: ${driver.license_number}`);
      console.log(`   📊 Status: ${driver.status}`);
      console.log(`   🏢 Tenant: ${driver.tenant_name} (${driver.tenant_id})`);
      console.log(`   👤 Employer: ${driver.employer_email} (${driver.employer_id})`);
    });

    // Check if there are any users with DRIVER role
    const driverUsersResult = await client.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.tenant_id,
        t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.role = 'DRIVER'
      ORDER BY u.created_at DESC
    `);

    console.log(`\n👥 Found ${driverUsersResult.rows.length} users with DRIVER role:`);
    
    driverUsersResult.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   🏢 Tenant: ${user.tenant_name} (${user.tenant_id})`);
    });

    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDrivers();