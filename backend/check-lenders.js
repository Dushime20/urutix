const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 5433, user: 'postgres', password: '1234', database: 'urutix' });
const TENANT_ID = 'a6d0858d-eb06-4748-9b12-d847e74d7d9b';

c.connect().then(async () => {
  const r1 = await c.query('SELECT id, name, tenant_id, status FROM lenders ORDER BY created_at DESC');
  console.log('\n=== ALL LENDERS ===');
  console.table(r1.rows);

  const r2 = await c.query('SELECT id, name, tenant_id, status FROM lenders WHERE tenant_id = $1', [TENANT_ID]);
  console.log(`\n=== LENDERS WITH TENANT ${TENANT_ID} ===`);
  console.table(r2.rows);
  console.log(r2.rows.length === 0 ? '❌ NO LENDERS FOUND FOR THIS TENANT' : `✅ Found ${r2.rows.length} lender(s)`);

  await c.end();
}).catch(e => console.error(e));
