-- Migration: Add KYC fields to tenants table
-- This migration adds comprehensive KYC (Know Your Customer) fields to the tenants table

-- Add KYC status enum type
DO $$ BEGIN
    CREATE TYPE kyc_status_enum AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'INCOMPLETE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add onboarding step enum type
DO $$ BEGIN
    CREATE TYPE onboarding_step_enum AS ENUM ('STEP_1_BRANDING', 'STEP_2_KYC', 'STEP_3_PLAN', 'STEP_4_CONFIG', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add KYC fields to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS kyc_status kyc_status_enum DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS kyc_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS kyc_notes TEXT,
ADD COLUMN IF NOT EXISTS kyc_reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS onboarding_step onboarding_step_enum DEFAULT 'STEP_1_BRANDING',
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tenants_kyc_status ON tenants(kyc_status);
CREATE INDEX IF NOT EXISTS idx_tenants_kyc_submitted_at ON tenants(kyc_submitted_at);
CREATE INDEX IF NOT EXISTS idx_tenants_onboarding_step ON tenants(onboarding_step);

-- Create KYC documents table for file management
CREATE TABLE IF NOT EXISTS tenant_kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'business_license', 'tax_certificate', 'identity_document', etc.
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for KYC documents
CREATE INDEX IF NOT EXISTS idx_tenant_kyc_documents_tenant_id ON tenant_kyc_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_kyc_documents_type ON tenant_kyc_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_tenant_kyc_documents_verified ON tenant_kyc_documents(verified);

-- Create KYC audit log table for tracking changes
CREATE TABLE IF NOT EXISTS tenant_kyc_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'SUBMITTED', 'APPROVED', 'REJECTED', 'DOCUMENT_UPLOADED', etc.
    old_status kyc_status_enum,
    new_status kyc_status_enum,
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_tenant_kyc_audit_log_tenant_id ON tenant_kyc_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_kyc_audit_log_created_at ON tenant_kyc_audit_log(created_at);

-- Update existing tenants to have default KYC status
UPDATE tenants 
SET kyc_status = 'PENDING', 
    onboarding_step = 'STEP_1_BRANDING'
WHERE kyc_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN tenants.kyc_status IS 'Current KYC verification status';
COMMENT ON COLUMN tenants.kyc_data IS 'JSON object containing KYC form data (registration number, tax ID, etc.)';
COMMENT ON COLUMN tenants.kyc_submitted_at IS 'Timestamp when KYC was first submitted';
COMMENT ON COLUMN tenants.kyc_verified_at IS 'Timestamp when KYC was approved';
COMMENT ON COLUMN tenants.kyc_notes IS 'Admin notes about KYC status (rejection reasons, etc.)';
COMMENT ON COLUMN tenants.kyc_reviewed_by IS 'User ID of admin who reviewed the KYC';
COMMENT ON COLUMN tenants.onboarding_step IS 'Current step in the onboarding process';
COMMENT ON COLUMN tenants.onboarding_completed_at IS 'Timestamp when onboarding was completed';

COMMENT ON TABLE tenant_kyc_documents IS 'Stores uploaded KYC documents for tenants';
COMMENT ON TABLE tenant_kyc_audit_log IS 'Audit trail for all KYC-related actions';