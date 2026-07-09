/**
 * Backfill pending payments for completed trips that have no payment record.
 *
 * Safe to run multiple times — skips any trip that already has a payment.
 *
 * Run on production:
 *   docker exec -it urutix_backend node /app/backfill-cargo-owner-payments.js
 * Or locally:
 *   node backfill-cargo-owner-payments.js
 */
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'urutix',
});

function pad8(id) { return id ? id.slice(-8).toUpperCase() : 'NULL'; }

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected:', process.env.DB_NAME || 'urutix');

    // Find all completed trips that belong to a cargo owner
    // but have NO payment record where payerId = cargoOwnerId
    const { rows: trips } = await client.query(`
      SELECT
        t.id AS trip_id,
        t."tripNumber",
        t.status,
        t."agreedPrice",
        t."currencyCode",
        t."tenantId",
        t."completedAt",
        l."cargoOwnerId",
        l.title AS load_title,
        l."cargoType",
        -- truck owner
        truck."ownerId" AS truck_owner_id
      FROM trips t
      JOIN loads l ON l.id = t."loadId"
      LEFT JOIN trucks truck ON truck.id = t."truckId"
      WHERE t.status = 'COMPLETED'
        AND l."cargoOwnerId" IS NOT NULL
        AND CAST(t."agreedPrice" AS numeric) > 0
        AND NOT EXISTS (
          SELECT 1 FROM payments p
          WHERE p."tripId" = t.id
            AND p."payerId" = l."cargoOwnerId"
            AND p.status IN ('pending', 'processing', 'completed')
        )
      ORDER BY t."completedAt" DESC NULLS LAST
    `);

    console.log(`\nTrips needing backfill: ${trips.length}`);

    if (trips.length === 0) {
      console.log('✅ Nothing to backfill.');
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const trip of trips) {
      // Calculate due date: 30 days from completion (or now if no completedAt)
      const base = trip.completedAt ? new Date(trip.completedAt) : new Date();
      const dueDate = new Date(base);
      dueDate.setDate(dueDate.getDate() + 30);

      const referenceNum = `PAY-${pad8(trip.trip_id)}`;
      const currency = trip.currencyCode || 'RWF';
      const amount = parseFloat(trip.agreedPrice);

      // Double-check: idempotency — skip if referenceNumber already exists
      const { rows: existing } = await client.query(
        `SELECT id FROM payments WHERE "referenceNumber" = $1 LIMIT 1`,
        [referenceNum]
      );
      if (existing.length > 0) {
        console.log(`  ⏭  skip trip:${pad8(trip.trip_id)} — payment with ref ${referenceNum} already exists`);
        skipped++;
        continue;
      }

      const metadata = JSON.stringify({
        tripCompletionTriggeredBy: 'BACKFILL',
        cargoTitle: trip.load_title || trip.cargoType,
        truckOwnerId: trip.truck_owner_id || null,
        cargoOwnerId: trip.cargoOwnerId,
        completedAt: trip.completedAt ? new Date(trip.completedAt).toISOString() : new Date().toISOString(),
        automaticallyCreated: true,
        backfilledAt: new Date().toISOString(),
      });

      await client.query(`
        INSERT INTO payments (
          id, "tenantId", "tripId", "payerId", "payeeId",
          amount, currency, "paymentMethod", "paymentType", status,
          "dueDate", description, "referenceNumber", metadata,
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          $1, $2, $3, $4,
          $5, $6, 'bank_transfer', 'trip_payment', 'pending',
          $7, $8, $9, $10::jsonb,
          NOW(), NOW()
        )
      `, [
        trip.tenantId,
        trip.trip_id,
        trip.cargoOwnerId,
        trip.truck_owner_id || null,
        amount,
        currency,
        dueDate.toISOString(),
        `Payment for cargo delivery - ${trip.load_title || trip.cargoType || 'Cargo'}`,
        referenceNum,
        metadata,
      ]);

      console.log(`  ✅ Created payment for trip:${pad8(trip.trip_id)} | #${trip.tripNumber} | amt:${amount} ${currency} | owner:${pad8(trip.cargoOwnerId)} | due:${dueDate.toDateString()}`);
      created++;
    }

    console.log(`\n📊 Done: ${created} created, ${skipped} skipped.`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
