const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

const pool = new Pool(dbConfig);

async function debugMatching() {
  try {
    // 1. Get Broker Tenant
    const brokerRes = await pool.query("SELECT id, \"tenantId\" FROM users WHERE email = 'broker1@test.com'");
    const broker = brokerRes.rows[0];
    console.log(`Broker ID: ${broker.id}`);
    console.log(`Broker Tenant: ${broker.tenantId}`);

    // 2. Get the specific Load (Electronics to New York)
    const loadRes = await pool.query(`
        SELECT id, "tenantId", "pickupLocation", status, weight, "truckRequirements" 
        FROM loads 
        WHERE title = 'Electronics to New York' AND "tenantId" = $1
    `, [broker.tenantId]);
    
    if (loadRes.rows.length === 0) {
        console.log("Load 'Electronics to New York' NOT FOUND in this tenant.");
        // Try finding it globally to see where it went
        const allLoads = await pool.query("SELECT id, \"tenantId\" FROM loads WHERE title = 'Electronics to New York'");
        console.log("Global search for load:", allLoads.rows);
        return;
    }

    const load = loadRes.rows[0];
    console.log("Load Found:", load);

    // 3. Check Available Trucks in the same tenant
    const trucksRes = await pool.query(`
        SELECT id, "plateNumber", "tenantId", status, "currentLocation", "truckType", "capacityWeight"
        FROM trucks 
        WHERE "tenantId" = $1
    `, [broker.tenantId]);

    console.log(`Found ${trucksRes.rows.length} trucks in tenant.`);
    trucksRes.rows.forEach(t => {
        console.log(`Truck ${t.plateNumber}: Type=${t.truckType}, Status=${t.status}, Loc=${JSON.stringify(t.currentLocation)}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

debugMatching();
