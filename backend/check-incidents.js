const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: '1234',
  database: 'urutix',
});

async function checkIncidents() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if safety_incidents table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'safety_incidents'
      );
    `);
    console.log('\n📋 Table exists:', tableCheck.rows[0].exists);

    if (tableCheck.rows[0].exists) {
      // Get all incidents
      const incidents = await client.query('SELECT * FROM safety_incidents ORDER BY date DESC LIMIT 10');
      console.log('\n📊 Total incidents in database:', incidents.rowCount);
      
      if (incidents.rowCount > 0) {
        console.log('\n🔍 Sample incidents:');
        incidents.rows.forEach((incident, idx) => {
          console.log(`\n--- Incident ${idx + 1} ---`);
          console.log('ID:', incident.id);
          console.log('Type:', incident.type);
          console.log('Severity:', incident.severity);
          console.log('Status:', incident.status);
          console.log('Driver ID:', incident.driverId);
          console.log('Driver Name:', incident.driverName);
          console.log('Truck ID:', incident.truckId);
          console.log('Truck Plate:', incident.truckPlate);
          console.log('Date:', incident.date);
          console.log('Location:', incident.location);
          console.log('Description:', incident.description);
          console.log('Tenant ID:', incident.tenantId);
          console.log('Deleted At:', incident.deletedAt);
        });
      } else {
        console.log('\n⚠️ No incidents found in database');
      }

      // Check for any soft-deleted incidents
      const deletedIncidents = await client.query('SELECT COUNT(*) FROM safety_incidents WHERE "deletedAt" IS NOT NULL');
      console.log('\n🗑️ Soft-deleted incidents:', deletedIncidents.rows[0].count);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkIncidents();
