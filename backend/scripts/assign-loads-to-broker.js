const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

async function assignLoadsToBroker() {
  const pool = new Pool(dbConfig);
  
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');

    const brokerEmail = 'urutibroker@gmail.com';

    // Find broker by email
    const brokerResult = await pool.query(
      `SELECT id, email, "tenantId" FROM users WHERE email = $1 AND role = 'BROKER'`,
      [brokerEmail]
    );

    if (brokerResult.rows.length === 0) {
      console.error(`❌ Broker with email ${brokerEmail} not found`);
      process.exit(1);
    }

    const broker = brokerResult.rows[0];
    console.log(`✅ Found broker: ${broker.id} (${broker.email})`);
    console.log(`   Tenant ID: ${broker.tenantId}\n`);

    // Find loads without a broker assigned in the same tenant
    const loadsResult = await pool.query(
      `SELECT id, title, "loadValue", "cargoOwnerId" 
       FROM loads 
       WHERE "tenantId" = $1 AND "brokerId" IS NULL 
       ORDER BY "createdAt" DESC 
       LIMIT 5`,
      [broker.tenantId]
    );

    if (loadsResult.rows.length === 0) {
      console.log('⚠️  No loads found without a broker assigned');
      process.exit(0);
    }

    const loads = loadsResult.rows;
    console.log(`📦 Found ${loads.length} loads to assign:`);
    loads.forEach((load, index) => {
      console.log(`   ${index + 1}. ${load.title || load.id} (${load.id})`);
    });
    console.log('');

    // Assign loads to broker
    const commissionRate = 5.0; // Default 5%
    let assignedCount = 0;

    for (const load of loads) {
      try {
        // Calculate commission
        const commissionAmount = (load.loadValue * commissionRate) / 100;

        // Update load
        await pool.query(
          `UPDATE loads 
           SET "brokerId" = $1, 
               "brokerCommissionRate" = $2, 
               "brokerCommissionAmount" = $3,
               "updatedAt" = NOW()
           WHERE id = $4`,
          [broker.id, commissionRate, commissionAmount, load.id]
        );

        assignedCount++;
        console.log(`✅ Assigned load ${load.id} to broker ${broker.email}`);
      } catch (error) {
        console.error(`❌ Failed to assign load ${load.id}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully assigned ${assignedCount} out of ${loads.length} loads to broker ${brokerEmail}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
assignLoadsToBroker();

