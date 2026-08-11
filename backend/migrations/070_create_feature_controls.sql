-- Global / tenant feature kill-switches for enterprise capability management.
-- Absence of a row means the feature is ENABLED by default.

CREATE TABLE IF NOT EXISTS feature_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_id UUID NULL REFERENCES permissions(id) ON DELETE SET NULL,
  permission_code VARCHAR(150) NOT NULL,
  scope VARCHAR(20) NOT NULL DEFAULT 'PLATFORM',
  tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_feature_controls_scope CHECK (scope IN ('PLATFORM', 'TENANT')),
  CONSTRAINT chk_feature_controls_tenant CHECK (
    (scope = 'PLATFORM' AND tenant_id IS NULL)
    OR (scope = 'TENANT' AND tenant_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_controls_platform_code
  ON feature_controls (permission_code)
  WHERE scope = 'PLATFORM' AND tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_controls_tenant_code
  ON feature_controls (permission_code, tenant_id)
  WHERE scope = 'TENANT' AND tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feature_controls_code ON feature_controls (permission_code);
CREATE INDEX IF NOT EXISTS idx_feature_controls_scope ON feature_controls (scope);
CREATE INDEX IF NOT EXISTS idx_feature_controls_tenant ON feature_controls (tenant_id);

COMMENT ON TABLE feature_controls IS 'Platform/tenant capability kill-switches keyed by permission resource:action codes';
