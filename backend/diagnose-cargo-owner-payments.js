/**
 * Diagnose why cargo owner sees no pending payments.
 * Checks: users, trips, payments, loan_requests for all CARGO_OWNER users.
 *
 * Run: node diagnose-cargo-owner-payments.js
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

const sep = () => console.log('\n' + '─'.repeat(70));

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to DB:', process.env.DB_NAME || 'urutix');

    // ── 1. All CARGO_OWNER users ──────────────────────────────────────────────
    sep();
    const coUsers = await client.query(`
      SELECT u.id, u.email, u.role, u."tenantId"
      FROM users u
      WHERE u.role = 'CARGO_OWNER'
      ORDER BY u."createdAt" DESC
      LIMIT 20
    `);
    console.log(`[1] CARGO_OWNER users: ${coUsers.rows.length}`);
    coUsers.rows.forEach(u =>
      console.log(`  • ${u.id}  ${u.email}  tenant:${u.tenantId}`)
    );

    if (coUsers.rows.length === 0) {
      console.log('❌ No CARGO_OWNER users — nothing to diagnose.');
      return;
    }

    const cargoOwnerIds = coUsers.rows.map(u => u.id);

    // ── 2. Trips owned by these cargo owners ──────────────────────────────────
    sep();
    const trips = await client.query(`
      SELECT t.id, t."tripNumber", t.status, t."agreedPrice", t."currencyCode",
             l."cargoOwnerId", l.title AS load_title, t."tenantId"
      FROM trips t
      JOIN loads l ON l.id = t."loadId"
      WHERE l."cargoOwnerId" = ANY($1::uuid[])
      ORDER BY t."createdAt" DESC
      LIMIT 30
    `, [cargoOwnerIds]);
    console.log(`[2] Trips for these cargo owners: ${trips.rows.length}`);
    trips.rows.forEach(t =>
      console.log(`  • trip:${t.id.slice(-8)} | #${t.tripNumber} | status:${t.status} | price:${t.agreedPrice} ${t.currencyCode} | owner:${t.cargoOwnerId?.slice(-8)} | tenant:${t.tenantId?.slice(-8)}`)
    );

    const tripIds = trips.rows.map(t => t.id);

    // ── 3. All payments where payerId is any cargo owner ─────────────────────
    sep();
    const payments = await client.query(`
      SELECT p.id, p."tripId", p."payerId", p."payeeId", p.status,
             p."paymentType", p.amount, p.currency, p."dueDate",
             p.metadata->>'isLoanRepaymentObligation' AS is_loan_obligation,
             p.metadata->>'paymentSource' AS payment_source,
             p."createdAt"
      FROM payments p
      WHERE p."payerId" = ANY($1::uuid[])
      ORDER BY p."createdAt" DESC
      LIMIT 50
    `, [cargoOwnerIds]);
    console.log(`[3] Payments where payerId=cargoOwner: ${payments.rows.length}`);
    payments.rows.forEach(p =>
      console.log(`  • pay:${p.id.slice(-8)} | trip:${p.tripId?.slice(-8) ?? 'NULL'} | type:${p.paymentType} | status:${p.status} | amt:${p.amount} ${p.currency} | obligation:${p.is_loan_obligation} | source:${p.payment_source}`)
    );

    // ── 4. PENDING/PROCESSING payments specifically ───────────────────────────
    sep();
    const pending = await client.query(`
      SELECT p.id, p."tripId", p."payerId", p.status, p."paymentType",
             p.amount, p.currency, p."dueDate", p."tenantId",
             p.metadata->>'isLoanRepaymentObligation' AS is_loan_obligation
      FROM payments p
      WHERE p."payerId" = ANY($1::uuid[])
        AND p.status IN ('pending', 'processing')
      ORDER BY p."dueDate" ASC
    `, [cargoOwnerIds]);
    console.log(`[4] PENDING/PROCESSING payments for cargo owners: ${pending.rows.length}`);
    if (pending.rows.length === 0) {
      console.log('  ⚠️  None found — this is why the dashboard shows empty.');
    }
    pending.rows.forEach(p =>
      console.log(`  • pay:${p.id.slice(-8)} | trip:${p.tripId?.slice(-8) ?? 'NULL'} | type:${p.paymentType} | status:${p.status} | amt:${p.amount} | due:${p.dueDate} | tenant:${p.tenantId?.slice(-8)}`)
    );

    // ── 5. Trips with COMPLETED/IN_TRANSIT status but no PENDING payment ─────
    sep();
    const tripsNeedingPayment = await client.query(`
      SELECT t.id, t."tripNumber", t.status, t."agreedPrice", t."tenantId",
             l."cargoOwnerId", l.title
      FROM trips t
      JOIN loads l ON l.id = t."loadId"
      WHERE l."cargoOwnerId" = ANY($1::uuid[])
        AND t.status IN ('COMPLETED', 'IN_PROGRESS', 'IN_TRANSIT', 'DELIVERED')
        AND NOT EXISTS (
          SELECT 1 FROM payments p
          WHERE p."tripId" = t.id
            AND p."payerId" = l."cargoOwnerId"
            AND p.status IN ('pending', 'processing', 'completed')
        )
      ORDER BY t."createdAt" DESC
    `, [cargoOwnerIds]);
    console.log(`[5] Trips that are active/complete but have NO payment record: ${tripsNeedingPayment.rows.length}`);
    tripsNeedingPayment.rows.forEach(t =>
      console.log(`  • trip:${t.id.slice(-8)} | #${t.tripNumber} | status:${t.status} | price:${t.agreedPrice} | owner:${t.cargoOwnerId?.slice(-8)} | tenant:${t.tenantId?.slice(-8)}`)
    );

    // ── 6. Loan requests created by cargo owners ──────────────────────────────
    sep();
    const loans = await client.query(`
      SELECT lr.id, lr.status, lr.requested_amount, lr.approved_amount,
             lr.interest_amount, lr.due_date, lr.created_by,
             lr.trip_id, lr.lender_id, lr.tenant_id,
             lr.metadata->>'purpose' AS purpose
      FROM loan_requests lr
      WHERE lr.created_by = ANY($1::uuid[])
      ORDER BY lr.created_at DESC
      LIMIT 20
    `, [cargoOwnerIds]);
    console.log(`[6] Loan requests by cargo owners: ${loans.rows.length}`);
    loans.rows.forEach(l =>
      console.log(`  • loan:${l.id.slice(-8)} | status:${l.status} | req:${l.requested_amount} | approved:${l.approved_amount} | trip:${l.trip_id?.slice(-8) ?? 'NULL'} | lender:${l.lender_id?.slice(-8) ?? 'NULL'} | tenant:${l.tenant_id?.slice(-8)}`)
    );

    // ── 7. Disbursed loans with payments ─────────────────────────────────────
    sep();
    const disbursedLoans = await client.query(`
      SELECT lr.id AS loan_id, lr.status AS loan_status,
             lr.created_by AS cargo_owner_id,
             lr.trip_id,
             lr.approved_amount,
             p.id AS payment_id, p."payerId", p.status AS pay_status,
             p."paymentType",
             p.metadata->>'isLoanRepaymentObligation' AS is_obligation
      FROM loan_requests lr
      LEFT JOIN payments p ON p."tripId" = lr.trip_id
      WHERE lr.created_by = ANY($1::uuid[])
        AND lr.status IN ('disbursed', 'approved')
      ORDER BY lr.created_at DESC
      LIMIT 20
    `, [cargoOwnerIds]);
    console.log(`[7] Disbursed/approved loans + linked payments: ${disbursedLoans.rows.length}`);
    disbursedLoans.rows.forEach(r =>
      console.log(`  • loan:${r.loan_id.slice(-8)} | loanStatus:${r.loan_status} | trip:${r.trip_id?.slice(-8) ?? 'NULL'} | pay:${r.payment_id?.slice(-8) ?? 'NO PAYMENT'} | payerId:${r.payer_id?.slice(-8) ?? 'NULL'} | payStatus:${r.pay_status ?? 'N/A'} | obligation:${r.is_obligation}`)
    );

    // ── 8. All payments for trips owned by cargo owners (any payerId) ─────────
    sep();
    if (tripIds.length > 0) {
      const allTripPayments = await client.query(`
        SELECT p.id, p."tripId", p."payerId", p."payeeId", p.status,
               p."paymentType", p.amount, p.currency,
               p.metadata->>'isLenderPayment' AS is_lender,
               p.metadata->>'isLoanRepaymentObligation' AS is_obligation
        FROM payments p
        WHERE p."tripId" = ANY($1::uuid[])
        ORDER BY p."createdAt" DESC
      `, [tripIds]);
      console.log(`[8] ALL payments for these cargo owner trips (any payerId): ${allTripPayments.rows.length}`);
      allTripPayments.rows.forEach(p =>
        console.log(`  • pay:${p.id.slice(-8)} | trip:${p.tripId?.slice(-8)} | payer:${p.payerId?.slice(-8)} | payee:${p.payeeId?.slice(-8) ?? 'NULL'} | type:${p.paymentType} | status:${p.status} | amt:${p.amount} | lender:${p.is_lender} | obligation:${p.is_obligation}`)
      );
    } else {
      console.log('[8] No trips found — skipping trip payment check.');
    }

    // ── 9. Summary ────────────────────────────────────────────────────────────
    sep();
    console.log('DIAGNOSIS SUMMARY');
    console.log(`  Cargo owners:        ${coUsers.rows.length}`);
    console.log(`  Their trips:         ${trips.rows.length}`);
    console.log(`  Any payments made:   ${payments.rows.length}`);
    console.log(`  PENDING payments:    ${pending.rows.length}  ← should be > 0`);
    console.log(`  Trips no payment:    ${tripsNeedingPayment.rows.length}  ← trips that need a payment record`);
    console.log(`  Loan requests:       ${loans.rows.length}`);

    if (pending.rows.length === 0 && tripsNeedingPayment.rows.length > 0) {
      console.log('\n⚠️  ISSUE: Active/completed trips exist but no PENDING payment records.');
      console.log('   Likely cause: trip completion did not trigger handleTripCompletion().');
      console.log('   Fix: manually backfill payment records for these trips OR trigger completion again.');
    }
    if (pending.rows.length === 0 && payments.rows.length > 0) {
      console.log('\n⚠️  ISSUE: Payments exist but none are PENDING/PROCESSING.');
      console.log('   Check the status column — they may all be COMPLETED or CANCELLED.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await client.end();
  }
})();
