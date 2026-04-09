const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: '1234',
  database: 'urutix',
});

async function checkDriverUser() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get the driver from incidents
    const incidentDriverId = '805a514d-cb59-4199-8d2a-fe3256d649ca';
    
    console.log('\n🔍 Checking driver from incident:', incidentDriverId);
    
    // Check if this is in drivers table
    const driver = await client.query('SELECT * FROM drivers WHERE id = $1', [incidentDriverId]);
    console.log('\n📋 Driver record:', driver.rows[0] || 'NOT FOUND');
    
    if (driver.rows[0]) {
      const userId = driver.rows[0].userId;
      console.log('\n🔍 Driver userId:', userId);
      
      // Check user
      const user = await client.query('SELECT id, email, role FROM users WHERE id = $1', [userId]);
      console.log('\n👤 User record:', user.rows[0] || 'NOT FOUND');
    }
    
    // List all drivers
    console.log('\n\n📋 All drivers:');
    const allDrivers = await client.query('SELECT id, "firstName", "lastName", "userId" FROM drivers LIMIT 10');
    allDrivers.rows.forEach((d, idx) => {
      console.log(`${idx + 1}. ID: ${d.id}, Name: ${d.firstName} ${d.lastName}, UserID: ${d.userId}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkDriverUser();
