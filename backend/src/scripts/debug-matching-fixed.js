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

async function debugMatchingFixed() {
  try {
    // 1. Get Broker Tenant
    const brokerRes = await pool.query("SELECT id, \"tenantId\" FROM users WHERE email = 'broker1@test.com'");
    const broker = brokerRes.rows[0];
    
    // 2. Get Load with simpler columns + locations
    // Note: adjusting for snake_case column names if needed, but 'locations' matches property name usually.
    const loadRes = await pool.query(`
        SELECT id, "tenantId", locations, status, weight
        FROM loads 
        WHERE title = 'Electronics to New York' AND "tenantId" = $1
    `, [broker.tenantId]);
    
    if (loadRes.rows.length === 0) {
        console.log("Load NOT FOUND.");
        return;
    }

    const load = loadRes.rows[0];
    // console.log("Load Locations:", JSON.stringify(load.locations, null, 2));

    const pickup = load.locations.find(l => l.type === 'PICKUP');
    console.log("Pickup Coords:", pickup?.locationData?.coordinates);

    // 3. Check Trucks
    const trucksRes = await pool.query(`
        SELECT id, "plateNumber", "tenantId", status, "currentLocation"
        FROM trucks 
        WHERE "tenantId" = $1
    `, [broker.tenantId]);

    console.log(`Checking ${trucksRes.rows.length} trucks...`);
    
    trucksRes.rows.forEach(t => {
        const truckLoc = t.currentLocation;
        console.log(`Truck ${t.plateNumber}:`, truckLoc);
        
        // Manual Distance Check (Haversine approx)
        if (pickup && truckLoc) {
             const lat1 = pickup.locationData.coordinates.latitude;
             const lon1 = pickup.locationData.coordinates.longitude;
             const lat2 = truckLoc.coordinates.latitude;
             const lon2 = truckLoc.coordinates.longitude;
             
             const R = 6371; // km
             const dLat = (lat2 - lat1) * Math.PI / 180;
             const dLon = (lon2 - lon1) * Math.PI / 180;
             const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                       Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                       Math.sin(dLon/2) * Math.sin(dLon/2);
             const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
             const d = R * c;
             
             console.log(`  -> Distance to Pickup: ${d.toFixed(2)} km`);
        }
    });

  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

debugMatchingFixed();
