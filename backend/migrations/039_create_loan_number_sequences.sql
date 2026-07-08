-- Migration 039: Create loan_number_sequences table
-- Date: 2026-07-08
-- Description: Atomic per-tenant-per-year counter for loan_number generation.
--
-- Root cause fixed:
--   The previous COUNT(*)-based generateLoanNumber() had a TOCTOU race condition.
--   Two concurrent requests for the same tenant both read count=N, both computed
--   LN-YYYY-000(N+1), and the second INSERT crashed with:
--   "duplicate key value violates unique constraint UQ_4382ec13ee491f4b516b8549d26"
--
-- How this fixes it:
--   INSERT ... ON CONFLICT DO UPDATE (upsert) is atomic at the PostgreSQL row level.
--   Concurrent writers for the same (tenant_id, year) are serialised by the DB —
--   each caller receives a strictly distinct last_seq value, no application-level
--   locking required.

CREATE TABLE IF NOT EXISTS loan_number_sequences (
    tenant_id  UUID    NOT NULL,
    year       INTEGER NOT NULL,
    last_seq   INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "PK_loan_number_sequences" PRIMARY KEY (tenant_id, year)
);

-- Back-fill existing tenants so the counter starts from the correct value.
-- For every (tenant_id, year) already in loan_requests we seed last_seq at
-- the current row count so the next generated number does not clash.
INSERT INTO loan_number_sequences (tenant_id, year, last_seq)
SELECT
    tenant_id,
    EXTRACT(YEAR FROM created_at)::INTEGER AS year,
    COUNT(*) AS last_seq
FROM loan_requests
WHERE loan_number IS NOT NULL
GROUP BY tenant_id, EXTRACT(YEAR FROM created_at)
ON CONFLICT (tenant_id, year)
DO UPDATE SET
    last_seq   = GREATEST(loan_number_sequences.last_seq, EXCLUDED.last_seq),
    updated_at = now();
