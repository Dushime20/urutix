-- Database Schema for Optimistic Locking
-- Add version fields to critical tables

-- Loan Requests Table
ALTER TABLE loan_requests ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE loan_requests ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Active Loans Table  
ALTER TABLE loans ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE loans ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Disbursements Table
ALTER TABLE disbursements ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE disbursements ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Repayments Table
ALTER TABLE repayments ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE repayments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to auto-increment version on updates
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to critical tables
CREATE TRIGGER loan_requests_version_trigger
    BEFORE UPDATE ON loan_requests
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER loans_version_trigger
    BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER disbursements_version_trigger
    BEFORE UPDATE ON disbursements
    FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER repayments_version_trigger
    BEFORE UPDATE ON repayments
    FOR EACH ROW EXECUTE FUNCTION increment_version();
