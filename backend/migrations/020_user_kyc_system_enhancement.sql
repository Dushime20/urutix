-- Migration: Enhanced User KYC System
-- This migration enhances the existing user KYC system to support all user roles

-- Add role-specific KYC requirements enum (alias for kyc_requirement_level created in 000)
DO $$ BEGIN
    CREATE TYPE user_kyc_requirement_level AS ENUM ('BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhance user_profiles table with additional KYC fields
-- NOTE: kyc_requirement_level column already uses kyc_requirement_level type from 000_base_schema.
-- We cast using the base type to avoid type-mismatch when user_kyc_requirement_level is a duplicate.
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS kyc_requirement_level kyc_requirement_level DEFAULT 'BASIC',
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS kyc_reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS kyc_notes TEXT,
ADD COLUMN IF NOT EXISTS kyc_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS address_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS financial_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS business_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS background_check_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS compliance_score INTEGER DEFAULT 0;

-- Create user KYC documents table
CREATE TABLE IF NOT EXISTS user_kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'IDENTITY', 'DRIVER_LICENSE', 'PASSPORT', 'BANK_STATEMENT', etc.
    document_category VARCHAR(50) NOT NULL, -- 'IDENTITY', 'ADDRESS', 'FINANCIAL', 'BUSINESS', 'PROFESSIONAL'
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    expiry_date DATE, -- For documents that expire (licenses, passports, etc.)
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user KYC audit log table
CREATE TABLE IF NOT EXISTS user_kyc_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'SUBMITTED', 'APPROVED', 'REJECTED', 'DOCUMENT_UPLOADED', etc.
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create KYC requirements by role table
CREATE TABLE IF NOT EXISTS kyc_role_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL, -- 'TRUCK_OWNER', 'CARGO_OWNER', 'BROKER', 'DRIVER', 'AGENT', 'LENDER'
    requirement_level user_kyc_requirement_level NOT NULL,
    required_documents TEXT[] NOT NULL, -- Array of required document types
    optional_documents TEXT[] DEFAULT '{}',
    verification_steps TEXT[] NOT NULL, -- Steps required for verification
    auto_approval_eligible BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_status ON user_profiles("kycStatus");
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_requirement_level ON user_profiles(kyc_requirement_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_kyc ON user_profiles("tenantId", "kycStatus");

CREATE INDEX IF NOT EXISTS idx_user_kyc_documents_user_id ON user_kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_documents_profile_id ON user_kyc_documents(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_documents_type ON user_kyc_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_kyc_documents_category ON user_kyc_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_user_kyc_documents_verified ON user_kyc_documents(verified);
CREATE INDEX IF NOT EXISTS idx_user_kyc_documents_expiry ON user_kyc_documents(expiry_date);

CREATE INDEX IF NOT EXISTS idx_user_kyc_audit_log_user_id ON user_kyc_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_audit_log_profile_id ON user_kyc_audit_log(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_audit_log_created_at ON user_kyc_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_kyc_role_requirements_role ON kyc_role_requirements(role);

-- Insert default KYC requirements for each role (idempotent)
INSERT INTO kyc_role_requirements (role, requirement_level, required_documents, optional_documents, verification_steps, auto_approval_eligible, description)
SELECT * FROM (VALUES
('TRUCK_OWNER', 'ENHANCED', 
 ARRAY['IDENTITY_DOCUMENT', 'DRIVER_LICENSE', 'BUSINESS_LICENSE', 'INSURANCE_CERTIFICATE', 'BANK_STATEMENT'], 
 ARRAY['VEHICLE_REGISTRATION', 'SAFETY_CERTIFICATE'],
 ARRAY['identity_verification', 'address_verification', 'business_verification', 'financial_verification', 'background_check'],
 FALSE,
 'Enhanced KYC for truck owners including business and financial verification'),

('CARGO_OWNER', 'STANDARD', 
 ARRAY['IDENTITY_DOCUMENT', 'BUSINESS_LICENSE', 'TAX_CERTIFICATE', 'BANK_STATEMENT'], 
 ARRAY['TRADE_LICENSE', 'WAREHOUSE_CERTIFICATE'],
 ARRAY['identity_verification', 'business_verification', 'financial_verification'],
 FALSE,
 'Standard KYC for cargo owners with business verification'),

('BROKER', 'ENHANCED', 
 ARRAY['IDENTITY_DOCUMENT', 'BROKER_LICENSE', 'BUSINESS_LICENSE', 'BANK_STATEMENT', 'PROFESSIONAL_CERTIFICATE'], 
 ARRAY['BONDING_CERTIFICATE', 'CREDIT_REPORT'],
 ARRAY['identity_verification', 'business_verification', 'financial_verification', 'professional_verification'],
 FALSE,
 'Enhanced KYC for brokers including professional licensing verification'),

('DRIVER', 'STANDARD', 
 ARRAY['IDENTITY_DOCUMENT', 'DRIVER_LICENSE', 'MEDICAL_CERTIFICATE'], 
 ARRAY['SAFETY_TRAINING_CERTIFICATE', 'EXPERIENCE_CERTIFICATE'],
 ARRAY['identity_verification', 'license_verification', 'medical_verification'],
 TRUE,
 'Standard KYC for drivers with license and medical verification'),

('AGENT', 'BASIC', 
 ARRAY['IDENTITY_DOCUMENT', 'PROOF_OF_ADDRESS'], 
 ARRAY['PROFESSIONAL_REFERENCE'],
 ARRAY['identity_verification', 'address_verification'],
 TRUE,
 'Basic KYC for agents with identity verification'),

('LENDER', 'PREMIUM', 
 ARRAY['IDENTITY_DOCUMENT', 'BUSINESS_LICENSE', 'FINANCIAL_LICENSE', 'BANK_STATEMENT', 'CREDIT_REPORT', 'REGULATORY_APPROVAL'], 
 ARRAY['AUDIT_REPORT', 'COMPLIANCE_CERTIFICATE'],
 ARRAY['identity_verification', 'business_verification', 'financial_verification', 'regulatory_verification', 'compliance_verification'],
 FALSE,
 'Premium KYC for lenders with full regulatory compliance verification')
) AS v(role, requirement_level, required_documents, optional_documents, verification_steps, auto_approval_eligible, description)
WHERE NOT EXISTS (
  SELECT 1 FROM kyc_role_requirements k WHERE k.role = v.role
);

-- Update existing user profiles with appropriate requirement levels based on user roles
UPDATE user_profiles 
SET kyc_requirement_level = CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles."userId" AND users.role = 'TRUCK_OWNER') THEN 'ENHANCED'::kyc_requirement_level
    WHEN EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles."userId" AND users.role = 'CARGO_OWNER') THEN 'STANDARD'::kyc_requirement_level
    WHEN EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles."userId" AND users.role = 'BROKER') THEN 'ENHANCED'::kyc_requirement_level
    WHEN EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles."userId" AND users.role = 'DRIVER') THEN 'STANDARD'::kyc_requirement_level
    WHEN EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles."userId" AND users.role = 'AGENT') THEN 'BASIC'::kyc_requirement_level
    WHEN EXISTS (SELECT 1 FROM users WHERE users.id = user_profiles."userId" AND users.role = 'LENDER') THEN 'PREMIUM'::kyc_requirement_level
    ELSE 'BASIC'::kyc_requirement_level
END;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.kyc_requirement_level IS 'KYC requirement level based on user role';
COMMENT ON COLUMN user_profiles.kyc_data IS 'JSON object containing role-specific KYC form data';
COMMENT ON COLUMN user_profiles.identity_verified IS 'Whether identity documents have been verified';
COMMENT ON COLUMN user_profiles.address_verified IS 'Whether address proof has been verified';
COMMENT ON COLUMN user_profiles.financial_verified IS 'Whether financial documents have been verified';
COMMENT ON COLUMN user_profiles.business_verified IS 'Whether business documents have been verified';
COMMENT ON COLUMN user_profiles.background_check_completed IS 'Whether background check has been completed';
COMMENT ON COLUMN user_profiles.compliance_score IS 'Overall compliance score (0-100)';

COMMENT ON TABLE user_kyc_documents IS 'Stores uploaded KYC documents for users by role';
COMMENT ON TABLE user_kyc_audit_log IS 'Audit trail for all user KYC-related actions';
COMMENT ON TABLE kyc_role_requirements IS 'Defines KYC requirements for each user role';