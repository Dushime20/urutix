-- Migration: Fix Notification EntityType Constraint Issue
-- Date: 2026-05-10
-- Description: Fix null entityType values in notifications table

-- First, check if there are any notifications with null entityType
DO $$ 
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM notifications WHERE "entityType" IS NULL;
    RAISE NOTICE 'Found % notifications with null entityType', null_count;
END $$;

-- Update existing notifications with null entityType to have a default value
-- We'll set them to 'SYSTEM' as a safe default
UPDATE notifications 
SET "entityType" = 'SYSTEM' 
WHERE "entityType" IS NULL;

-- Update notifications based on their notification type to have more appropriate entityType
-- Trip-related notifications
UPDATE notifications 
SET "entityType" = 'TRIP' 
WHERE "notificationType" IN (
  'TRIP_CREATED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 
  'TRIP_DELAY', 'TRIP_ROUTE_CHANGE', 'TRIP_UPDATE', 'TRIP_STATUS'
) AND "entityType" = 'SYSTEM';

-- Driver-related notifications
UPDATE notifications 
SET "entityType" = 'DRIVER' 
WHERE "notificationType" IN (
  'DRIVER_ASSIGNMENT', 'DRIVER_TRIP_START', 'DRIVER_TRIP_END', 'DRIVER_ALERT', 
  'DRIVER_DOCUMENT_EXPIRY', 'DRIVER_SAFETY_ALERT', 'DRIVER_FATIGUE_WARNING'
) AND "entityType" = 'SYSTEM';

-- Vehicle/Truck-related notifications
UPDATE notifications 
SET "entityType" = 'TRUCK' 
WHERE "notificationType" IN (
  'VEHICLE_MAINTENANCE_DUE', 'VEHICLE_INSPECTION_DUE', 'VEHICLE_INSURANCE_EXPIRY', 
  'VEHICLE_REGISTRATION_EXPIRY', 'VEHICLE_BREAKDOWN'
) AND "entityType" = 'SYSTEM';

-- Cargo-related notifications
UPDATE notifications 
SET "entityType" = 'CARGO' 
WHERE "notificationType" IN (
  'CARGO_PICKUP_REMINDER', 'CARGO_DELIVERY_UPDATE', 'CARGO_DELAY', 
  'CARGO_DAMAGE', 'CARGO_CUSTOMS_UPDATE'
) AND "entityType" = 'SYSTEM';

-- Payment-related notifications
UPDATE notifications 
SET "entityType" = 'PAYMENT' 
WHERE "notificationType" IN (
  'PAYMENT_RECEIVED', 'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'INVOICE_GENERATED', 
  'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'PAYMENT', 'PAYMENT_REMINDER', 
  'TRUCK_OWNER_PAYMENT_RECEIVED'
) AND "entityType" = 'SYSTEM';

-- Document-related notifications
UPDATE notifications 
SET "entityType" = 'DOCUMENT' 
WHERE "notificationType" IN (
  'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED'
) AND "entityType" = 'SYSTEM';

-- User-related notifications
UPDATE notifications 
SET "entityType" = 'USER' 
WHERE "notificationType" IN (
  'USER_WELCOME', 'USER_VERIFICATION', 'USER_PASSWORD_RESET', 'USER_ACCOUNT_LOCKED'
) AND "entityType" = 'SYSTEM';

-- Auction-related notifications
UPDATE notifications 
SET "entityType" = 'AUCTION' 
WHERE "notificationType" IN (
  'AUCTION_BID_RECEIVED', 'AUCTION_WON', 'AUCTION_LOST', 'SMART_MATCH_SELECTED'
) AND "entityType" = 'SYSTEM';

-- Loan-related notifications
UPDATE notifications 
SET "entityType" = 'LOAN' 
WHERE "notificationType" IN (
  'LOAN_REQUESTED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED', 
  'LOAN_REPAYMENT_RECEIVED', 'LOAN_OVERDUE', 'LENDER_PAID_ON_BEHALF'
) AND "entityType" = 'SYSTEM';

-- Ensure the NOT NULL constraint is properly enforced
ALTER TABLE notifications 
ALTER COLUMN "entityType" SET NOT NULL;

-- Add a check constraint to ensure entityType is always one of the valid enum values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_notification_entity_type' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications 
        ADD CONSTRAINT chk_notification_entity_type 
        CHECK ("entityType" IN (
          'USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP', 
          'COMPANY', 'TENANT', 'SYSTEM', 'DOCUMENT', 
          'PAYMENT', 'EXPENSE', 'LOAN', 'AUCTION'
        ));
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_entity_type_id 
  ON notifications ("entityType", "entityId");

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_entity 
  ON notifications ("tenantId", "entityType", "createdAt");

-- Final verification
DO $$ 
DECLARE
    remaining_null INTEGER;
    total_notifications INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_null FROM notifications WHERE "entityType" IS NULL;
    SELECT COUNT(*) INTO total_notifications FROM notifications;
    
    RAISE NOTICE 'Migration completed successfully';
    RAISE NOTICE 'Total notifications: %', total_notifications;
    RAISE NOTICE 'Remaining null entityType: %', remaining_null;
    
    IF remaining_null > 0 THEN
        RAISE WARNING 'Still have % notifications with null entityType!', remaining_null;
    ELSE
        RAISE NOTICE 'All notifications now have valid entityType values';
    END IF;
END $$;