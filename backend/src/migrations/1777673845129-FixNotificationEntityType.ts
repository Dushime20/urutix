import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixNotificationEntityType1777673845129 implements MigrationInterface {
  name = 'FixNotificationEntityType1777673845129';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, let's check if there are any notifications with null entityType
    const nullEntityTypeCount = await queryRunner.query(`
      SELECT COUNT(*) as count FROM notifications WHERE "entityType" IS NULL
    `);

    console.log(`Found ${nullEntityTypeCount[0]?.count || 0} notifications with null entityType`);

    // Update existing notifications with null entityType to have a default value
    // We'll set them to 'SYSTEM' as a safe default
    await queryRunner.query(`
      UPDATE notifications 
      SET "entityType" = 'SYSTEM' 
      WHERE "entityType" IS NULL
    `);

    // Update notifications based on their notification type to have more appropriate entityType
    const entityTypeUpdates = [
      // Trip-related notifications
      {
        types: ['TRIP_CREATED', 'TRIP_STARTED', 'TRIP_COMPLETED', 'TRIP_CANCELLED', 'TRIP_DELAY', 'TRIP_ROUTE_CHANGE', 'TRIP_UPDATE', 'TRIP_STATUS'],
        entityType: 'TRIP'
      },
      // Driver-related notifications
      {
        types: ['DRIVER_ASSIGNMENT', 'DRIVER_TRIP_START', 'DRIVER_TRIP_END', 'DRIVER_ALERT', 'DRIVER_DOCUMENT_EXPIRY', 'DRIVER_SAFETY_ALERT', 'DRIVER_FATIGUE_WARNING'],
        entityType: 'DRIVER'
      },
      // Vehicle/Truck-related notifications
      {
        types: ['VEHICLE_MAINTENANCE_DUE', 'VEHICLE_INSPECTION_DUE', 'VEHICLE_INSURANCE_EXPIRY', 'VEHICLE_REGISTRATION_EXPIRY', 'VEHICLE_BREAKDOWN'],
        entityType: 'TRUCK'
      },
      // Cargo-related notifications
      {
        types: ['CARGO_PICKUP_REMINDER', 'CARGO_DELIVERY_UPDATE', 'CARGO_DELAY', 'CARGO_DAMAGE', 'CARGO_CUSTOMS_UPDATE'],
        entityType: 'CARGO'
      },
      // Payment-related notifications
      {
        types: ['PAYMENT_RECEIVED', 'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'INVOICE_GENERATED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'PAYMENT', 'PAYMENT_REMINDER', 'TRUCK_OWNER_PAYMENT_RECEIVED'],
        entityType: 'PAYMENT'
      },
      // Document-related notifications
      {
        types: ['DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED'],
        entityType: 'DOCUMENT'
      },
      // User-related notifications
      {
        types: ['USER_WELCOME', 'USER_VERIFICATION', 'USER_PASSWORD_RESET', 'USER_ACCOUNT_LOCKED'],
        entityType: 'USER'
      },
      // Auction-related notifications
      {
        types: ['AUCTION_BID_RECEIVED', 'AUCTION_WON', 'AUCTION_LOST', 'SMART_MATCH_SELECTED'],
        entityType: 'AUCTION'
      },
      // Loan-related notifications
      {
        types: ['LOAN_REQUESTED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_DISBURSED', 'LOAN_REPAYMENT_RECEIVED', 'LOAN_OVERDUE', 'LENDER_PAID_ON_BEHALF'],
        entityType: 'LOAN'
      }
    ];

    // Apply the updates
    for (const update of entityTypeUpdates) {
      const typesList = update.types.map(type => `'${type}'`).join(', ');
      await queryRunner.query(`
        UPDATE notifications 
        SET "entityType" = '${update.entityType}' 
        WHERE "notificationType" IN (${typesList})
        AND "entityType" = 'SYSTEM'
      `);
    }

    // Ensure the NOT NULL constraint is properly enforced
    // (This should already be in place, but let's make sure)
    await queryRunner.query(`
      ALTER TABLE notifications 
      ALTER COLUMN "entityType" SET NOT NULL
    `);

    console.log('✅ Fixed notification entityType values');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // In rollback, we can't really restore the original null values safely
    // since we don't know which ones were originally null
    // So we'll just log that this migration was rolled back
    console.log('⚠️  Rolling back FixNotificationEntityType migration');
    console.log('⚠️  Note: Original null entityType values cannot be restored');
    
    // We could make the column nullable again if needed, but it's not recommended
    // await queryRunner.query(`
    //   ALTER TABLE notifications 
    //   ALTER COLUMN "entityType" DROP NOT NULL
    // `);
  }
}