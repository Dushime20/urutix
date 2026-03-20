-- Unified Document and Notification System Migration Script
-- This script creates the complete unified document and notification management system schema
-- Run this script directly in your PostgreSQL database

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create documents table
CREATE TABLE "documents" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "entityType" character varying NOT NULL,
  "entityId" uuid NOT NULL,
  "documentType" character varying NOT NULL,
  "category" character varying NOT NULL,
  "status" character varying NOT NULL DEFAULT 'PENDING',
  "priority" character varying NOT NULL DEFAULT 'NORMAL',
  "documentNumber" character varying,
  "title" character varying NOT NULL,
  "description" text,
  "fileName" character varying NOT NULL,
  "originalFileName" character varying NOT NULL,
  "fileUrl" text NOT NULL,
  "thumbnailUrl" text,
  "fileSize" integer NOT NULL,
  "mimeType" character varying NOT NULL,
  "fileExtension" character varying NOT NULL,
  "issueDate" date,
  "expiryDate" date,
  "isExpired" boolean NOT NULL DEFAULT false,
  "requiresRenewal" boolean NOT NULL DEFAULT false,
  "renewalReminderDays" integer NOT NULL DEFAULT 30,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "tags" jsonb NOT NULL DEFAULT '[]',
  "verificationData" jsonb NOT NULL DEFAULT '{}',
  "versions" jsonb NOT NULL DEFAULT '[]',
  "currentVersion" integer NOT NULL DEFAULT 1,
  "accessControl" jsonb NOT NULL DEFAULT '{}',
  "auditTrail" jsonb NOT NULL DEFAULT '[]',
  "isPublic" boolean NOT NULL DEFAULT false,
  "isConfidential" boolean NOT NULL DEFAULT false,
  "encryptionKey" text,
  "ocrData" jsonb NOT NULL DEFAULT '{}',
  "digitalSignature" text,
  "complianceInfo" jsonb NOT NULL DEFAULT '{}',
  "workflowInfo" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  CONSTRAINT "PK_documents" PRIMARY KEY ("id")
);

-- Create notifications table
CREATE TABLE "notifications" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" uuid NOT NULL,
  "recipientId" uuid NOT NULL,
  "recipientEmail" character varying,
  "recipientPhone" character varying,
  "recipientDeviceTokens" jsonb NOT NULL DEFAULT '[]',
  "entityType" character varying,
  "entityId" uuid,
  "notificationType" character varying NOT NULL,
  "category" character varying NOT NULL,
  "status" character varying NOT NULL DEFAULT 'PENDING',
  "priority" character varying NOT NULL DEFAULT 'NORMAL',
  "title" character varying NOT NULL,
  "message" text NOT NULL,
  "shortMessage" character varying,
  "channels" jsonb NOT NULL DEFAULT '[]',
  "channelData" jsonb NOT NULL DEFAULT '{}',
  "tags" jsonb NOT NULL DEFAULT '[]',
  "scheduledAt" TIMESTAMP,
  "sentAt" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  "readAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "requiresAction" boolean NOT NULL DEFAULT false,
  "actionUrl" text,
  "actionText" character varying,
  "actionData" jsonb NOT NULL DEFAULT '{}',
  "attachments" jsonb NOT NULL DEFAULT '[]',
  "deliveryAttempts" jsonb NOT NULL DEFAULT '[]',
  "userPreferences" jsonb NOT NULL DEFAULT '{}',
  "analytics" jsonb NOT NULL DEFAULT '{}',
  "relatedNotifications" jsonb NOT NULL DEFAULT '[]',
  "workflowInfo" jsonb NOT NULL DEFAULT '{}',
  "escalationInfo" jsonb NOT NULL DEFAULT '{}',
  "complianceInfo" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "deleted_at" TIMESTAMP,
  CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX "IDX_documents_tenant_entity" ON "documents" ("tenantId", "entityType", "entityId");
CREATE INDEX "IDX_documents_type_category" ON "documents" ("documentType", "category");
CREATE INDEX "IDX_documents_status_priority" ON "documents" ("status", "priority");
CREATE INDEX "IDX_documents_expiry" ON "documents" ("expiryDate") WHERE "expiryDate" IS NOT NULL;
CREATE INDEX "IDX_documents_requires_renewal" ON "documents" ("requiresRenewal") WHERE "requiresRenewal" = true;
CREATE INDEX "IDX_documents_created_at" ON "documents" ("createdAt");
CREATE INDEX "IDX_documents_updated_at" ON "documents" ("updatedAt");
CREATE INDEX "IDX_documents_deleted_at" ON "documents" ("deleted_at") WHERE "deleted_at" IS NOT NULL;

CREATE INDEX "IDX_notifications_tenant_recipient" ON "notifications" ("tenantId", "recipientId");
CREATE INDEX "IDX_notifications_entity" ON "notifications" ("entityType", "entityId") WHERE "entityType" IS NOT NULL;
CREATE INDEX "IDX_notifications_type_category" ON "notifications" ("notificationType", "category");
CREATE INDEX "IDX_notifications_status_priority" ON "notifications" ("status", "priority");
CREATE INDEX "IDX_notifications_scheduled" ON "notifications" ("scheduledAt") WHERE "scheduledAt" IS NOT NULL;
CREATE INDEX "IDX_notifications_expires" ON "notifications" ("expiresAt") WHERE "expiresAt" IS NOT NULL;
CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("createdAt");
CREATE INDEX "IDX_notifications_updated_at" ON "notifications" ("updatedAt");
CREATE INDEX "IDX_notifications_deleted_at" ON "notifications" ("deleted_at") WHERE "deleted_at" IS NOT NULL;

-- Create unique constraints
CREATE UNIQUE INDEX "IDX_documents_number_tenant" ON "documents" ("documentNumber", "tenantId") WHERE "documentNumber" IS NOT NULL AND "deleted_at" IS NULL;

-- Add check constraints
ALTER TABLE "documents"
ADD CONSTRAINT "documents_status_check"
CHECK ("status" IN ('DRAFT', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'ARCHIVED', 'DELETED'));

ALTER TABLE "documents"
ADD CONSTRAINT "documents_priority_check"
CHECK ("priority" IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'));

ALTER TABLE "documents"
ADD CONSTRAINT "documents_category_check"
CHECK ("category" IN ('DRIVER', 'VEHICLE', 'CARGO', 'BUSINESS', 'USER', 'TRIP', 'FINANCIAL', 'COMPLIANCE', 'OTHER'));

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_status_check"
CHECK ("status" IN ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED'));

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_priority_check"
CHECK ("priority" IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'));

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_category_check"
CHECK ("category" IN ('SYSTEM', 'DRIVER', 'VEHICLE', 'CARGO', 'TRIP', 'FINANCIAL', 'COMPLIANCE', 'OTHER'));

-- Create a function to automatically update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updatedAt
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON "documents"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON "notifications"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to check document expiry
CREATE OR REPLACE FUNCTION check_document_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."expiryDate" IS NOT NULL THEN
        NEW."isExpired" = (NEW."expiryDate" < CURRENT_DATE);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically check document expiry
CREATE TRIGGER check_document_expiry_trigger
    BEFORE INSERT OR UPDATE ON "documents"
    FOR EACH ROW
    EXECUTE FUNCTION check_document_expiry();

-- Create a function to check if document requires renewal
CREATE OR REPLACE FUNCTION check_document_renewal()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."expiryDate" IS NOT NULL AND NEW."renewalReminderDays" > 0 THEN
        NEW."requiresRenewal" = (NEW."expiryDate" - INTERVAL '1 day' * NEW."renewalReminderDays" <= CURRENT_DATE);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically check if document requires renewal
CREATE TRIGGER check_document_renewal_trigger
    BEFORE INSERT OR UPDATE ON "documents"
    FOR EACH ROW
    EXECUTE FUNCTION check_document_renewal();

-- Create a function to check notification expiry
CREATE OR REPLACE FUNCTION check_notification_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."expiresAt" IS NOT NULL THEN
        IF NEW."expiresAt" < CURRENT_TIMESTAMP AND NEW."status" = 'PENDING' THEN
            NEW."status" = 'CANCELLED';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically check notification expiry
CREATE TRIGGER check_notification_expiry_trigger
    BEFORE INSERT OR UPDATE ON "notifications"
    FOR EACH ROW
    EXECUTE FUNCTION check_notification_expiry();

-- Insert sample data for testing (optional)
-- Uncomment the following lines if you want to insert sample data

/*
INSERT INTO "documents" (
  "id", "tenantId", "entityType", "entityId", "documentType", "category",
  "title", "fileName", "originalFileName", "fileUrl", "fileSize", "mimeType", "fileExtension"
) VALUES (
  uuid_generate_v4(), uuid_generate_v4(), 'DRIVER', uuid_generate_v4(), 'DRIVERS_LICENSE', 'DRIVER',
  'Driver License - John Doe', 'sample_license.pdf', 'license.pdf', 'https://example.com/uploads/sample_license.pdf',
  1024000, 'application/pdf', '.pdf'
);

INSERT INTO "notifications" (
  "id", "tenantId", "recipientId", "notificationType", "category", "title", "message", "channels"
) VALUES (
  uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), 'DRIVER_ASSIGNMENT', 'DRIVER',
  'New Trip Assignment', 'You have been assigned to a new trip from New York to Los Angeles', '["EMAIL", "PUSH"]'
);
*/

-- Create a rollback script (save this separately)
/*
-- Rollback script (run this to undo the migration)
-- Drop triggers first
DROP TRIGGER IF EXISTS check_notification_expiry_trigger ON "notifications";
DROP TRIGGER IF EXISTS check_document_renewal_trigger ON "documents";
DROP TRIGGER IF EXISTS check_document_expiry_trigger ON "documents";
DROP TRIGGER IF EXISTS update_notifications_updated_at ON "notifications";
DROP TRIGGER IF EXISTS update_documents_updated_at ON "documents";

-- Drop functions
DROP FUNCTION IF EXISTS check_notification_expiry();
DROP FUNCTION IF EXISTS check_document_renewal();
DROP FUNCTION IF EXISTS check_document_expiry();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop check constraints
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_category_check";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_priority_check";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_status_check";
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_category_check";
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_priority_check";
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_status_check";

-- Drop unique constraints
DROP INDEX IF EXISTS "IDX_documents_number_tenant";

-- Drop indexes
DROP INDEX IF EXISTS "IDX_notifications_deleted_at";
DROP INDEX IF EXISTS "IDX_notifications_updated_at";
DROP INDEX IF EXISTS "IDX_notifications_created_at";
DROP INDEX IF EXISTS "IDX_notifications_expires";
DROP INDEX IF EXISTS "IDX_notifications_scheduled";
DROP INDEX IF EXISTS "IDX_notifications_status_priority";
DROP INDEX IF EXISTS "IDX_notifications_type_category";
DROP INDEX IF EXISTS "IDX_notifications_entity";
DROP INDEX IF EXISTS "IDX_notifications_tenant_recipient";

DROP INDEX IF EXISTS "IDX_documents_deleted_at";
DROP INDEX IF EXISTS "IDX_documents_updated_at";
DROP INDEX IF EXISTS "IDX_documents_created_at";
DROP INDEX IF EXISTS "IDX_documents_requires_renewal";
DROP INDEX IF EXISTS "IDX_documents_expiry";
DROP INDEX IF EXISTS "IDX_documents_status_priority";
DROP INDEX IF EXISTS "IDX_documents_type_category";
DROP INDEX IF EXISTS "IDX_documents_tenant_entity";

-- Drop tables
DROP TABLE IF EXISTS "notifications";
DROP TABLE IF EXISTS "documents";
*/

-- Migration completed successfully!
-- The unified document and notification management system schema is now ready for use.
