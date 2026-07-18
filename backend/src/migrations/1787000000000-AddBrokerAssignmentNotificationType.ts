import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrokerAssignmentNotificationType1787000000000
  implements MigrationInterface
{
  name = 'AddBrokerAssignmentNotificationType1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "public"."notifications_notificationtype_enum"
          ADD VALUE IF NOT EXISTS 'BROKER_ASSIGNMENT';
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "public"."notifications_notificationtype_enum"
          ADD VALUE IF NOT EXISTS 'AUCTION_CREATED';
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL cannot remove a single enum value safely; leave as no-op.
  }
}
