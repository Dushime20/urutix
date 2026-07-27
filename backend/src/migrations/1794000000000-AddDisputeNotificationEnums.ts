import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDisputeNotificationEnums1794000000000
  implements MigrationInterface
{
  name = 'AddDisputeNotificationEnums1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const typeValues = [
      'DISPUTE_REPORTED',
      'DISPUTE_UPDATED',
      'DISPUTE_ESCALATED',
      'DISPUTE_RESOLVED',
      'DISPUTE_SLA_BREACHED',
    ];

    for (const value of typeValues) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TYPE "public"."notifications_notificationtype_enum"
            ADD VALUE IF NOT EXISTS '${value}';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
    }

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "public"."notifications_category_enum"
          ADD VALUE IF NOT EXISTS 'DISPUTE';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "public"."notifications_entitytype_enum"
          ADD VALUE IF NOT EXISTS 'DISPUTE';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot easily remove enum values
  }
}
