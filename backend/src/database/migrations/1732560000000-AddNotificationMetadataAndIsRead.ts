import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationMetadataAndIsRead1732560000000
  implements MigrationInterface
{
  name = 'AddNotificationMetadataAndIsRead1732560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding them
    const notificationsTable = await queryRunner.getTable('notifications');

    if (notificationsTable) {
      const hasMetadata = notificationsTable.findColumnByName('metadata');
      const hasIsRead = notificationsTable.findColumnByName('isRead');

      if (!hasMetadata) {
        await queryRunner.query(`
          ALTER TABLE "notifications" 
          ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}'
        `);
        console.log('✅ Added metadata column to notifications table');
      }

      if (!hasIsRead) {
        await queryRunner.query(`
          ALTER TABLE "notifications" 
          ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false
        `);
        console.log('✅ Added isRead column to notifications table');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const notificationsTable = await queryRunner.getTable('notifications');

    if (notificationsTable) {
      const hasMetadata = notificationsTable.findColumnByName('metadata');
      const hasIsRead = notificationsTable.findColumnByName('isRead');

      if (hasMetadata) {
        await queryRunner.query(`
          ALTER TABLE "notifications" 
          DROP COLUMN "metadata"
        `);
      }

      if (hasIsRead) {
        await queryRunner.query(`
          ALTER TABLE "notifications" 
          DROP COLUMN "isRead"
        `);
      }
    }
  }
}

