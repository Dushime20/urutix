const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

const pool = new Pool(dbConfig);

async function seedTrucks() {
  try {
    // 1. Get Broker Tenant to align with
    const brokerRes = await pool.query("SELECT id, \"tenantId\" FROM users WHERE email = 'broker1@test.com'");
    if (brokerRes.rows.length === 0) { console.log("Broker not found"); return; }
    const broker = brokerRes.rows[0];
    const tenantId = broker.tenantId; // This should be the aligned tenant now

    console.log(`Seeding into Tenant: ${tenantId}`);

    // Cleanup first
    await pool.query("DELETE FROM trucks WHERE \"plateNumber\" IN ('LA-TRUCK-01', 'CHI-TRUCK-01', 'FAR-TRUCK-01')");
    await pool.query("DELETE FROM users WHERE email = 'transporter1@test.com'");

    // Create Transporter
    const transporterId = uuidv4();
    await pool.query(`
        INSERT INTO users (id, email, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt")
        VALUES ($1, 'transporter1@test.com', 'hash', 'TRUCK_OWNER', 'ACTIVE', $2, NOW(), NOW())
    `, [transporterId, tenantId]);
    
    await pool.query(`
        INSERT INTO user_profiles ("userId", "firstName", "lastName", "companyName", "tenantId", "createdAt", "updatedAt")
        VALUES ($1, 'John', 'Transporter', 'Express Logistics', $2, NOW(), NOW())
    `, [transporterId, tenantId]);

    console.log("Transporter created.");

    // 2. Seed Trucks
    const trucks = [
        {
            plate: 'LA-TRUCK-01',
            lat: 34.0500, lng: -118.2400, // Very close to LA
            type: 'VAN'
        },
        {
            plate: 'CHI-TRUCK-01',
            lat: 41.8700, lng: -87.6200, // Very close to Chi
            type: 'VAN'
        },
        {
            plate: 'FAR-TRUCK-01',
            lat: 40.7128, lng: -74.0060, // New York (far)
            type: 'REFRIGERATED'
        }
    ];

    for (const t of trucks) {
        const truckId = uuidv4();
        // Correct JSON structure for Location entity (jsonb)
        // Adjusting to what standard structure likely is, based on usage
        const location = {
            coordinates: { latitude: t.lat, longitude: t.lng },
            address: 'Mock Address',
            timestamp: new Date().toISOString()
        };

        await pool.query(`
            INSERT INTO trucks (
                id, "ownerId", "tenantId", "plateNumber", 
                "truckType", "capacityWeight", "capacityVolume", 
                status, "isActive", "currentLocation",
                "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4,
                $5, 20000, 100,
                'AVAILABLE', true, $6,
                NOW(), NOW()
            )
        `, [truckId, transporterId, tenantId, t.plate, t.type, JSON.stringify(location)]);
        
        console.log(`Seeded truck ${t.plate}`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

seedTrucks();
