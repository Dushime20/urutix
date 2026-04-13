const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
  entities: [],
});

ds.initialize().then(async () => {
  console.log('Connected\n');

  const TRUCK_OWNER_ID = '7c96391b-6e0c-4067-999d-96e921b47ef4';

  const result = await ds.query(`
    UPDATE trucks SET
      "hasGps"                  = true,
      "hasTracking"             = true,
      "hasTelematics"           = true,
      "hasRealTimeTracking"     = true,
      "hasGPS"                  = true,
      "hasRefrigeration"        = true,
      "hasHazmatPermit"         = true,
      "hasLiftGate"             = true,
      "capacityWeight"          = 20000,
      "averageRating"           = 4.5,
      "securityFeatures"        = '{"hasGps": true, "hasTracking": true, "hasTelematics": true}'::jsonb
    WHERE "ownerId" = $1
    RETURNING id, "plateNumber", "hasGps", "hasTracking", "hasRefrigeration", "hasHazmatPermit", "capacityWeight", "averageRating"
  `, [TRUCK_OWNER_ID]);

  console.log('=== TRUCK UPDATED ===');
  console.log(JSON.stringify(result, null, 2));

  await ds.destroy();
  console.log('\nDone. Restart the backend and test matching again.');
}).catch(e => console.error('ERR:', e.message));
