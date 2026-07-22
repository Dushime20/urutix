import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreTripNotificationTypes1793000000000
  implements MigrationInterface
{
  name = 'AddPreTripNotificationTypes1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = [
      'PRE_TRIP_SUBMITTED',
      'PRE_TRIP_APPROVED',
      'PRE_TRIP_FAILED',
      'PRE_TRIP_READY_FOR_RE_INSPECTION',
    ];

    for (const value of values) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TYPE "public"."notifications_notificationtype_enum"
            ADD VALUE IF NOT EXISTS '${value}';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
    }
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot easily remove enum values
  }
}
