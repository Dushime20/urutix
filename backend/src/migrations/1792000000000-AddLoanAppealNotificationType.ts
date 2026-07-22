import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoanAppealNotificationType1792000000000 implements MigrationInterface {
  name = 'AddLoanAppealNotificationType1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "public"."notifications_notificationtype_enum"
          ADD VALUE IF NOT EXISTS 'LOAN_APPEAL_SUBMITTED';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL cannot easily remove enum values
  }
}
