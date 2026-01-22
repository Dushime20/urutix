const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

async function createContractsForAssignedLoads() {
  const pool = new Pool(dbConfig);
  
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected\n');

    const brokerEmail = 'urutibroker@gmail.com';

    // Find broker
    const brokerResult = await pool.query(
      `SELECT id, email, "tenantId" FROM users WHERE email = $1 AND role = 'BROKER'`,
      [brokerEmail]
    );

    if (brokerResult.rows.length === 0) {
      console.error(`❌ Broker with email ${brokerEmail} not found`);
      process.exit(1);
    }

    const broker = brokerResult.rows[0];
    console.log(`✅ Found broker: ${broker.id}\n`);

    // Find loads assigned to this broker without contracts
    const loadsResult = await pool.query(
      `SELECT l.id, l.title, l."loadValue", l."currencyCode", l."cargoOwnerId", 
              l."brokerCommissionRate", l."brokerCommissionAmount",
              l."pickupDate", l."deliveryDate", l."paymentTerms"
       FROM loads l
       LEFT JOIN load_contracts lc ON lc."loadId" = l.id AND lc."brokerId" = $1
       WHERE l."brokerId" = $1 AND l."tenantId" = $2 AND lc.id IS NULL
       ORDER BY l."createdAt" DESC`,
      [broker.id, broker.tenantId]
    );

    if (loadsResult.rows.length === 0) {
      console.log('✅ All assigned loads already have contracts');
      process.exit(0);
    }

    const loads = loadsResult.rows;
    console.log(`📋 Found ${loads.length} loads without contracts:\n`);

    let createdCount = 0;

    for (const load of loads) {
      try {
        const commissionRate = parseFloat(load.brokerCommissionRate) || 5.0;
        const loadValue = parseFloat(load.loadValue) || 0;
        const commissionAmount = parseFloat(load.brokerCommissionAmount) || (loadValue * commissionRate / 100);
        const agreedRate = loadValue;
        
        // Generate contract content
        const contractContent = `Broker Service Agreement for Load: ${load.title || load.id}
        
This contract is between the Cargo Owner and the Broker for the management of the specified load.
Commission Rate: ${commissionRate}%
Commission Amount: ${load.currencyCode || 'KES'} ${commissionAmount.toFixed(2)}
Agreed Rate: ${load.currencyCode || 'KES'} ${agreedRate.toFixed(2)}
Payment Terms: ${load.paymentTerms || 'Net 30 days'}`;

        // Create contract
        const contractResult = await pool.query(
          `INSERT INTO load_contracts (
            id, "tenantId", "brokerId", "loadId", "cargoOwnerId",
            "contractType", "status", "agreedRate", "currencyCode",
            "commissionRate", "commissionAmount", "paymentTerms",
            "pickupDate", "deliveryDate", "contractContent",
            "negotiationHistory", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4,
            'BROKER_AGREEMENT', 'PENDING_BROKER_ACCEPTANCE', $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13::jsonb, NOW(), NOW()
          ) RETURNING id`,
          [
            broker.tenantId,
            broker.id,
            load.id,
            load.cargoOwnerId,
            agreedRate,
            load.currencyCode || 'KES',
            commissionRate,
            commissionAmount,
            load.paymentTerms || 'Net 30 days',
            load.pickupDate,
            load.deliveryDate,
            contractContent,
            JSON.stringify([{
              timestamp: new Date().toISOString(),
              changedBy: load.cargoOwnerId,
              changes: { status: 'PENDING_BROKER_ACCEPTANCE', created: true },
              notes: 'Contract created automatically when broker was assigned'
            }])
          ]
        );

        createdCount++;
        console.log(`✅ Created contract ${contractResult.rows[0].id} for load ${load.id}`);
      } catch (error) {
        console.error(`❌ Failed to create contract for load ${load.id}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully created ${createdCount} out of ${loads.length} contracts`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
createContractsForAssignedLoads();

