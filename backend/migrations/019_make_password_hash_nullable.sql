-- Migration: Make passwordHash nullable for email-based password setup
-- This allows users to be created without a password initially
-- They will set their password via email link

-- Make passwordHash column nullable
ALTER TABLE users ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN users."passwordHash" IS 'Password hash - nullable to allow email-based password setup';