import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParkingReservations1802000000000 implements MigrationInterface {
  name = 'CreateParkingReservations1802000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_MANAGER';
        END IF;
      END $$;
    `);
  }

  public async down(): Promise<void> {
    // Enum values are not removed.
  }
}
