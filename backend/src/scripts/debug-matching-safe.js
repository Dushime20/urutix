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

async function debugMatchingSafe() {
  try {
    const brokerRes = await pool.query("SELECT id, \"tenantId\" FROM users WHERE email = 'broker1@test.com'");
    const broker = brokerRes.rows[0];
    
    const loadRes = await pool.query(`
        SELECT id, locations
        FROM loads 
        WHERE title = 'Electronics to New York' AND "tenantId" = $1
    `, [broker.tenantId]);
    
    if (loadRes.rows.length === 0) { console.log("No Load"); return; }
    const load = loadRes.rows[0];
    const pickup = load.locations.find(l => l.type === 'PICKUP');
    console.log("Load Pickup:", JSON.stringify(pickup?.locationData?.coordinates));

    const trucksRes = await pool.query(`
        SELECT "plateNumber", "currentLocation"
        FROM trucks 
        WHERE "tenantId" = $1
    `, [broker.tenantId]);

    trucksRes.rows.forEach(t => {
        console.log(`Truck ${t.plateNumber} Loc:`, JSON.stringify(t.currentLocation));
    });

  } catch (e) {
    console.log("Error:", e.message);
  } finally {
    pool.end();
  }
}

debugMatchingSafe();
