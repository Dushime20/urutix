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

  const TENANT_ID = 'cde9f694-d92f-4525-8c0a-d601ae1e7af6';
  const LOAD_ID   = '08b4074b-cc2c-4209-a707-fe161ad512d9';

  // 1. Current truck state
  const trucks = await ds.query(
    `SELECT id, "plateNumber", status, "isActive", "tenantId", "capacityWeight" FROM trucks WHERE "tenantId" = $1`,
    [TENANT_ID]
  );
  console.log('=== TRUCKS (after capacity update) ===');
  trucks.forEach(t => console.log(`  ${t.plateNumber} | status=${t.status} | isActive=${t.isActive} | capacity=${t.capacityWeight} kg | tenantId=${t.tenantId}`));

  // 2. Current load state
  const loads = await ds.query(
    `SELECT id, status, weight, "tenantId" FROM loads WHERE id = $1`,
    [LOAD_ID]
  );
  console.log('\n=== LOAD ===');
  loads.forEach(l => console.log(`  id=${l.id} | status=${l.status} | weight=${l.weight} kg | tenantId=${l.tenantId}`));

  // 3. Simulate exact getAvailableTrucks query
  console.log('\n=== SIMULATING getAvailableTrucks QUERY ===');
  const load = loads[0];
  const loadWeight = Number(load?.weight);
  console.log(`  Load weight: ${loadWeight} kg`);
  console.log(`  Query: tenantId=${TENANT_ID}, status=AVAILABLE, isActive=true, capacityWeight >= ${loadWeight}`);

  const matchingTrucks = await ds.query(
    `SELECT id, "plateNumber", status, "isActive", "tenantId", "capacityWeight"
     FROM trucks
     WHERE "tenantId" = $1
       AND status = 'AVAILABLE'
       AND "isActive" = true
       AND "capacityWeight" >= $2`,
    [TENANT_ID, loadWeight]
  );
  console.log(`\n  Result: ${matchingTrucks.length} truck(s) found`);
  matchingTrucks.forEach(t => console.log(`  ✅ ${t.plateNumber} | capacity=${t.capacityWeight} | status=${t.status} | isActive=${t.isActive}`));

  if (matchingTrucks.length === 0) {
    console.log('\n  ❌ No trucks passed the query. Checking each condition individually:');

    const byTenant = await ds.query(`SELECT id, "plateNumber" FROM trucks WHERE "tenantId" = $1`, [TENANT_ID]);
    console.log(`  - tenantId match: ${byTenant.length} truck(s)`);

    const byStatus = await ds.query(`SELECT id, "plateNumber", status FROM trucks WHERE "tenantId" = $1 AND status = 'AVAILABLE'`, [TENANT_ID]);
    console.log(`  - status=AVAILABLE: ${byStatus.length} truck(s)`, byStatus.map(t => `${t.plateNumber}=${t.status}`));

    const byActive = await ds.query(`SELECT id, "plateNumber", "isActive" FROM trucks WHERE "tenantId" = $1 AND "isActive" = true`, [TENANT_ID]);
    console.log(`  - isActive=true: ${byActive.length} truck(s)`, byActive.map(t => `${t.plateNumber}=${t.isActive}`));

    const byCapacity = await ds.query(`SELECT id, "plateNumber", "capacityWeight" FROM trucks WHERE "tenantId" = $1 AND "capacityWeight" >= $2`, [TENANT_ID, loadWeight]);
    console.log(`  - capacityWeight >= ${loadWeight}: ${byCapacity.length} truck(s)`, byCapacity.map(t => `${t.plateNumber}=${t.capacityWeight}`));
  }

  // 4. Check load status is allowed
  console.log('\n=== LOAD STATUS CHECK ===');
  const allowedStatuses = ['CREATED', 'PUBLISHED', 'PENDING_CONFIRMATION'];
  console.log(`  Load status: ${load?.status}`);
  console.log(`  Allowed: ${allowedStatuses.join(', ')}`);
  console.log(`  Passes: ${allowedStatuses.includes(load?.status)}`);

  await ds.destroy();
  console.log('\nDone.');
}).catch(e => console.error('ERR:', e.message));
