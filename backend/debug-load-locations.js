const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false, logging: false, entities: [],
});

ds.initialize().then(async () => {
  const LOAD_ID = '08b4074b-cc2c-4209-a707-fe161ad512d9';

  const load = await ds.query(
    `SELECT id, weight, "offeredPrice", "loadValue", origin, destination, locations, "pickupDate", "deliveryDate"
     FROM loads WHERE id = $1`, [LOAD_ID]
  );
  const l = load[0];
  console.log('=== LOAD ===');
  console.log('weight:', l.weight);
  console.log('offeredPrice:', l.offeredPrice);
  console.log('loadValue:', l.loadValue);
  console.log('origin:', JSON.stringify(l.origin));
  console.log('destination:', JSON.stringify(l.destination));
  console.log('locations count:', l.locations?.length);
  if (l.locations?.length) {
    l.locations.forEach((loc, i) => {
      console.log(`  location[${i}]: type=${loc.type}, coords=`, loc.locationData?.coordinates);
    });
  }

  // Check existing match records
  const matches = await ds.query(
    `SELECT id, status, score, match_details FROM load_matches WHERE load_id = $1`, [LOAD_ID]
  );
  console.log('\n=== EXISTING MATCHES ===');
  matches.forEach(m => {
    console.log(`  id=${m.id} status=${m.status} score=${m.score}`);
    console.log(`  estimatedCost=${m.match_details?.estimatedCost}`);
    console.log(`  recommendedPrice=${m.match_details?.recommendedPrice}`);
    console.log(`  distanceKm=${m.match_details?.distanceKm}`);
  });

  await ds.destroy();
}).catch(e => console.error('ERR:', e.message));
