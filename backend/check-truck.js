const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: '1234',
  database: 'urutix',
});

async function checkTruck() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    const truckId = '740f642e-65b6-41d7-8688-71b05352d456';
    
    console.log('\n🚛 Checking truck:', truckId);
    
    const truck = await client.query('SELECT id, "plateNumber", make, model FROM trucks WHERE id = $1', [truckId]);
    
    if (truck.rows.length > 0) {
      console.log('\n✅ Truck found:');
      console.log('ID:', truck.rows[0].id);
      console.log('Plate Number:', truck.rows[0].plateNumber);
      console.log('Make:', truck.rows[0].make);
      console.log('Model:', truck.rows[0].model);
    } else {
      console.log('\n❌ Truck not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkTruck();
