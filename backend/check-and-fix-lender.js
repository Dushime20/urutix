const { Client } = require('pg');
const c = new Client({ host: '127.0.0.1', port: 5433, user: 'postgres', password: '1234', database: 'urutix' });

const LENDER_USER_ID = '94e77408-b083-485b-9871-1dd293e6ad65';
const TENANT_ID = 'a6d0858d-eb06-4748-9b12-d847e74d7d9b';
const LENDER_EMAIL = 'yobebi3135@bncinema.com';

c.connect().then(async () => {

  // 1. Show current lenders table
  const r1 = await c.query('SELECT id, name, tenant_id, status, contact_email FROM lenders');
  console.log('\n=== LENDERS TABLE ===');
  console.table(r1.rows);

  // 2. Check if this user already has a lenders record
  const r2 = await c.query('SELECT id FROM lenders WHERE contact_email = $1 OR tenant_id = $2', [LENDER_EMAIL, TENANT_ID]);
  console.log(`\nExisting lender records matching email or tenant: ${r2.rows.length}`);
  console.table(r2.rows);

  // 3. Create lender record for this user if missing
  const existing = await c.query('SELECT id FROM lenders WHERE contact_email = $1', [LENDER_EMAIL]);
  if (existing.rows.length === 0) {
    const inserted = await c.query(
      `INSERT INTO lenders (tenant_id, name, contact_email, status, api_key_hash)
       VALUES ($1, $2, $3, 'active', 'N/A')
       RETURNING id, name, tenant_id, status, contact_email`,
      [TENANT_ID, 'lender user', LENDER_EMAIL]
    );
    console.log('\n✅ Created lender record:');
    console.table(inserted.rows);
  } else {
    // Update tenant_id if it's null
    const upd = await c.query(
      `UPDATE lenders SET tenant_id = $1 WHERE contact_email = $2 AND (tenant_id IS NULL OR tenant_id != $1) RETURNING id, name, tenant_id, status`,
      [TENANT_ID, LENDER_EMAIL]
    );
    if (upd.rowCount > 0) {
      console.log('\n✅ Updated lender tenant_id:');
      console.table(upd.rows);
    } else {
      console.log('\nℹ️  Lender record already exists with correct tenant_id — no changes needed');
    }
  }

  // 4. Final state
  const r3 = await c.query('SELECT id, name, tenant_id, status, contact_email FROM lenders WHERE tenant_id = $1', [TENANT_ID]);
  console.log(`\n=== LENDERS FOR TENANT ${TENANT_ID} ===`);
  console.table(r3.rows);

  await c.end();
}).catch(e => console.error(e));
