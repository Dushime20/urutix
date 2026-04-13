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

  // Update the truck capacity to 20000 kg (20 tonnes - realistic for a heavy truck)
  const result = await ds.query(
    `UPDATE trucks SET "capacityWeight" = 20000 WHERE "ownerId" = '7c96391b-6e0c-4067-999d-96e921b47ef4' RETURNING id, "plateNumber", "capacityWeight", status`
  );
  console.log('Updated trucks:', JSON.stringify(result, null, 2));

  // Also update any loads that have unrealistically high weights for testing
  const loads = await ds.query(
    `SELECT id, weight, status, "tenantId" FROM loads WHERE status IN ('CREATED','PUBLISHED') AND "tenantId" = 'cde9f694-d92f-4525-8c0a-d601ae1e7af6'`
  );
  console.log('\nEligible loads:', JSON.stringify(loads, null, 2));

  await ds.destroy();
  console.log('\nDone.');
}).catch(e => console.error('ERR:', e.message));
