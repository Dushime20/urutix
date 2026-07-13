-- Migration 042: Payment audit log table + idempotency unique constraint
--
-- Changes:
--   1. Create payment_audit_logs — immutable, append-only audit trail.
--   2. Add a unique partial index on payments.idempotencyKey per tenant
--      so the DB enforces idempotency even if the application layer races.

-- ── 1. Payment audit log ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "paymentId"     UUID        NOT NULL,
  "tenantId"      UUID        NOT NULL,
  "actorId"       UUID,
  action          VARCHAR(100) NOT NULL,
  "previousStatus" VARCHAR(50),
  "currentStatus"  VARCHAR(50),
  metadata        JSONB        NOT NULL DEFAULT '{}',
  "ipAddress"     VARCHAR(64),
  "createdAt"     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Disable updates and deletes on this table (audit records are immutable).
-- In PostgreSQL this is enforced via a rule or trigger; here we add a
-- comment as documentation.  Application code must never UPDATE or DELETE rows.
COMMENT ON TABLE payment_audit_logs IS
  'Immutable append-only audit trail for all payment state changes. Never UPDATE or DELETE rows.';

CREATE INDEX IF NOT EXISTS idx_pal_payment_created  ON payment_audit_logs ("paymentId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_pal_tenant_created   ON payment_audit_logs ("tenantId",  "createdAt");
CREATE INDEX IF NOT EXISTS idx_pal_actor_created    ON payment_audit_logs ("actorId",   "createdAt");
CREATE INDEX IF NOT EXISTS idx_pal_action_created   ON payment_audit_logs (action,      "createdAt");

-- ── 2. Idempotency key unique partial index ───────────────────────────────
-- Enforce one idempotency key per tenant.  NULL keys are excluded so that
-- payments created without an idempotency key are not affected.

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_idempotency_key_tenant
  ON payments ("idempotencyKey", "tenantId")
  WHERE "idempotencyKey" IS NOT NULL;
