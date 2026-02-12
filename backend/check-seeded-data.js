const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function checkData() {
  try {
    console.log('📊 Checking seeded data...\n');
    
    const users = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Users: ${users.rows[0].count}`);
    
    const usersList = await pool.query(`
      SELECT email, role, status 
      FROM users 
      ORDER BY role, email
    `);
    console.log('\nUser accounts:');
    usersList.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.status}`);
    });
    
    const trucks = await pool.query('SELECT COUNT(*) FROM trucks');
    console.log(`\n🚛 Trucks: ${trucks.rows[0].count}`);
    
    const loads = await pool.query('SELECT COUNT(*) FROM loads');
    console.log(`📦 Loads: ${loads.rows[0].count}`);
    
    const bids = await pool.query('SELECT COUNT(*) FROM bids');
    console.log(`💰 Bids: ${bids.rows[0].count}`);
    
    const trips = await pool.query('SELECT COUNT(*) FROM trips');
    console.log(`🚗 Trips: ${trips.rows[0].count}`);
    
    const tenants = await pool.query('SELECT COUNT(*) FROM tenants');
    console.log(`🏢 Tenants: ${tenants.rows[0].count}`);
    
    console.log('\n✅ Data check complete!');
    console.log('\n📝 Login credentials (password for all: test123):');
    console.log('  Cargo Owner: cargo.owner@test.com');
    console.log('  Cargo Owner 2: cargo.owner2@test.com');
    console.log('  Truck Owner: truck.owner@test.com');
    console.log('  Truck Owner 2: truck.owner2@test.com');
    console.log('  Driver 1: driver1@test.com');
    console.log('  Driver 2: driver2@test.com');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
