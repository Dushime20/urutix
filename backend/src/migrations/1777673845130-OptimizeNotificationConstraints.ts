import { MigrationInterface, QueryRunner } from 'typeorm';

export class OptimizeNotificationConstraints1777673845130 implements MigrationInterface {
  name = 'OptimizeNotificationConstraints1777673845130';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add a check constraint to ensure entityType is always one of the valid enum values
    // This provides additional safety beyond just the enum type
    await queryRunner.query(`
      ALTER TABLE notifications 
      ADD CONSTRAINT chk_notification_entity_type 
      CHECK ("entityType" IN (
        'USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP', 
        'COMPANY', 'TENANT', 'SYSTEM', 'DOCUMENT', 
        'PAYMENT', 'EXPENSE', 'LOAN', 'AUCTION'
      ))
    `);

    // Add a partial index for better performance on active notifications
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_active_entity
      ON notifications ("entityType", "entityId", "status")
      WHERE "deletedAt" IS NULL AND "status" IN ('PENDING', 'SENT', 'DELIVERED')
    `);

    // Add an index for notification cleanup queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_cleanup
      ON notifications ("createdAt", "status")
      WHERE "deletedAt" IS NULL
    `);

    // Add a composite index for tenant-specific entity queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_tenant_entity
      ON notifications ("tenantId", "entityType", "entityId", "createdAt")
      WHERE "deletedAt" IS NULL
    `);

    console.log('✅ Added notification constraints and indexes');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the check constraint
    await queryRunner.query(`
      ALTER TABLE notifications 
      DROP CONSTRAINT IF EXISTS chk_notification_entity_type
    `);

    // Remove the indexes
    await queryRunner.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_active_entity
    `);

    await queryRunner.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_cleanup
    `);

    await queryRunner.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_tenant_entity
    `);

    console.log('✅ Removed notification constraints and indexes');
  }
}