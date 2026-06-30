/**
 * fix-trip-status.js
 * 
 * Resets trips that were incorrectly set to IN_PROGRESS by the advance payment
 * handler before the fix. A trip should only be IN_PROGRESS if the driver
 * explicitly started it (i.e. actualStartTime is set by the driver action,
 * not by the payment service).
 * 
 * Safe rule: if a trip is IN_PROGRESS but has NO actualStartTime, it was 
 * auto-set by the payment service — reset it to PLANNED.
 * 
 * Run: node fix-trip-status.js
 */

require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // 1. Show affected trips before fix
  const preview = await client.query(`
    SELECT id, "tripNumber", status, "actualStartTime", "plannedStartTime"
    FROM trips
    WHERE status = 'IN_PROGRESS'
      AND "actualStartTime" IS NULL
    ORDER BY "createdAt" DESC
  `);

  console.log(`\nFound ${preview.rows.length} trip(s) incorrectly set to IN_PROGRESS:\n`);
  preview.rows.forEach(t => {
    console.log(`  - ${t.tripNumber} (${t.id})  plannedStart: ${t.plannedStartTime}`);
  });

  if (preview.rows.length === 0) {
    console.log('Nothing to fix.');
    await client.end();
    return;
  }

  // 2. Reset them to PLANNED
  const result = await client.query(`
    UPDATE trips
    SET status = 'PLANNED', "updatedAt" = NOW()
    WHERE status = 'IN_PROGRESS'
      AND "actualStartTime" IS NULL
  `);

  console.log(`\n✅ Reset ${result.rowCount} trip(s) from IN_PROGRESS → PLANNED.\n`);

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
