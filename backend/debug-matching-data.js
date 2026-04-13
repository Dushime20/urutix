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

  // 1. Find truck owner
  const users = await ds.query(
    `SELECT id, email, role, status, "tenantId" FROM users WHERE email = 'truckowner@test.com' LIMIT 1`
  );
  console.log('=== TRUCK OWNER USER ===');
  console.log(JSON.stringify(users, null, 2));

  if (users.length === 0) {
    console.log('Truck owner not found, checking all TRUCK_OWNER roles...');
    const allTruckOwners = await ds.query(
      `SELECT id, email, role, status, "tenantId" FROM users WHERE role = 'TRUCK_OWNER' LIMIT 5`
    );
    console.log(JSON.stringify(allTruckOwners, null, 2));
  }

  const truckOwner = users[0];
  const ownerTenantId = truckOwner?.tenantId;
  const ownerId = truckOwner?.id;

  // 2. Find trucks for this owner
  const cols = await ds.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'trucks' ORDER BY ordinal_position`
  );
  console.log('\n=== TRUCKS TABLE COLUMNS ===');
  console.log(cols.map(c => c.column_name).join(', '));

  const trucks = await ds.query(
    `SELECT * FROM trucks WHERE "ownerId" = $1 LIMIT 10`,
    [ownerId]
  );
  console.log('\n=== TRUCKS OWNED BY TRUCK OWNER ===');
  console.log(JSON.stringify(trucks, null, 2));

  // 3. All trucks in system
  const allTrucks = await ds.query(`SELECT * FROM trucks LIMIT 10`);
  console.log('\n=== ALL TRUCKS IN SYSTEM ===');
  console.log(JSON.stringify(allTrucks, null, 2));

  // 4. Cargo owners and their tenantIds
  const cargoOwners = await ds.query(
    `SELECT id, email, role, "tenantId" FROM users WHERE role = 'CARGO_OWNER' LIMIT 5`
  );
  console.log('\n=== CARGO OWNERS ===');
  console.log(JSON.stringify(cargoOwners, null, 2));

  // 5. Check if truck tenantId matches cargo owner tenantId
  if (trucks.length > 0 && cargoOwners.length > 0) {
    console.log('\n=== TENANT MISMATCH CHECK ===');
    console.log('Truck owner tenantId:', ownerTenantId);
    console.log('Truck tenantIds:', trucks.map(t => t.tenantId || t.tenant_id));
    console.log('Cargo owner tenantIds:', cargoOwners.map(c => c.tenantId));
    const truckTenantIds = [...new Set(trucks.map(t => t.tenantId || t.tenant_id))];
    const cargoTenantIds = [...new Set(cargoOwners.map(c => c.tenantId))];
    const overlap = truckTenantIds.filter(t => cargoTenantIds.includes(t));
    console.log('Overlapping tenantIds (trucks & cargo owners):', overlap);
  }

  // 6. Check loads that are CREATED/PUBLISHED
  const loadCols = await ds.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'loads' ORDER BY ordinal_position`
  );
  console.log('\n=== LOADS TABLE COLUMNS ===');
  console.log(loadCols.map(c => c.column_name).join(', '));

  const loads = await ds.query(
    `SELECT id, status, weight, "tenantId" FROM loads WHERE status IN ('CREATED','PUBLISHED') LIMIT 5`
  );
  console.log('\n=== ELIGIBLE LOADS ===');
  console.log(JSON.stringify(loads, null, 2));

  await ds.destroy();
}).catch(e => console.error('DB ERROR:', e.message));
