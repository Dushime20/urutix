const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'urutix',
});

async function seedBrokerData() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get tenant and broker IDs
    const tenantResult = await client.query('SELECT id FROM tenants LIMIT 1');
    const tenantId = tenantResult.rows[0].id;

    const brokerResult = await client.query("SELECT id FROM users WHERE role = 'BROKER' LIMIT 1");
    if (brokerResult.rows.length === 0) {
      console.error('No brokers found. Please run the broker seeding script first.');
      return;
    }
    const brokerId = brokerResult.rows[0].id;

    // Get a cargo owner
    const cargoOwnerResult = await client.query("SELECT id FROM users WHERE role = 'CARGO_OWNER' LIMIT 1");
    if (cargoOwnerResult.rows.length === 0) {
      console.log('No cargo owners found, creating one...');
      // Create a cargo owner
      const cargoOwnerId = '4d7f39g3-1993-5011-a136-61114151f59e';
      await client.query(`
        INSERT INTO users (
          id, "tenantId", email, phone, "passwordHash", role, status, 
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [
        cargoOwnerId,
        tenantId,
        'cargoowner@urutix.com',
        '0794716445',
        '$2b$12$JdKvN7Y2sMqSJ3aGf.sotuXCNxrODJnimokfuB5Bl/fWI2siu6rcu',
        'CARGO_OWNER',
        'ACTIVE'
      ]);
    }

    const finalCargoOwnerResult = await client.query("SELECT id FROM users WHERE role = 'CARGO_OWNER' LIMIT 1");
    const cargoOwnerId = finalCargoOwnerResult.rows[0].id;

    // Sample loads for brokers
    const loads = [
      {
        id: '5e8g49h4-2004-6122-b247-72225262g60f',
        title: 'Electronics Shipment - Nairobi to Mombasa',
        description: 'Urgent electronics shipment requiring careful handling',
        pickupLocation: 'Nairobi, Kenya',
        deliveryLocation: 'Mombasa, Kenya',
        cargoType: 'ELECTRONICS',
        weight: 2500.00,
        volume: 15.5,
        estimatedValue: 150000.00,
        status: 'PENDING',
        urgencyLevel: 'HIGH'
      },
      {
        id: '6f9h50i5-3115-7233-c358-83336373h71g',
        title: 'Agricultural Products - Kisumu to Eldoret',
        description: 'Fresh produce requiring temperature control',
        pickupLocation: 'Kisumu, Kenya',
        deliveryLocation: 'Eldoret, Kenya',
        cargoType: 'AGRICULTURAL',
        weight: 5000.00,
        volume: 25.0,
        estimatedValue: 75000.00,
        status: 'PENDING',
        urgencyLevel: 'MEDIUM'
      },
      {
        id: '7g0i61j6-4226-8344-d469-94447484i82h',
        title: 'Construction Materials - Nakuru to Thika',
        description: 'Heavy construction materials for building project',
        pickupLocation: 'Nakuru, Kenya',
        deliveryLocation: 'Thika, Kenya',
        cargoType: 'CONSTRUCTION',
        weight: 8000.00,
        volume: 40.0,
        estimatedValue: 200000.00,
        status: 'PENDING',
        urgencyLevel: 'LOW'
      }
    ];

    for (const load of loads) {
      // Check if load already exists
      const existingLoad = await client.query('SELECT id FROM loads WHERE id = $1', [load.id]);
      
      if (existingLoad.rows.length === 0) {
        console.log(`Creating load: ${load.title}`);
        await client.query(`
          INSERT INTO loads (
            id, "tenantId", "cargoOwnerId", "brokerId", title, description,
            "pickupLocation", "deliveryLocation", "cargoType", weight, volume,
            "estimatedValue", status, "urgencyLevel", "brokerCommissionRate",
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        `, [
          load.id,
          tenantId,
          cargoOwnerId,
          brokerId,
          load.title,
          load.description,
          load.pickupLocation,
          load.deliveryLocation,
          load.cargoType,
          load.weight,
          load.volume,
          load.estimatedValue,
          load.status,
          load.urgencyLevel,
          5.00 // 5% commission rate
        ]);
      } else {
        console.log(`Load ${load.title} already exists, skipping...`);
      }
    }

    console.log('✅ Broker sample data seeded successfully!');
    console.log('Sample loads created for broker operations');

  } catch (error) {
    console.error('Error seeding broker data:', error);
  } finally {
    await client.end();
  }
}

seedBrokerData();