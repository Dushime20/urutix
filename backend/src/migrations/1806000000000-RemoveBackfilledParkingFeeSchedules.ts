import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveBackfilledParkingFeeSchedules1806000000000 implements MigrationInterface {
  name = 'RemoveBackfilledParkingFeeSchedules1806000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE parking_reservations
      SET "feeScheduleId" = NULL
      WHERE "feeScheduleId" IN (
        SELECT id FROM parking_fee_schedules
        WHERE description = 'Backfilled from facility fee configuration'
      )
    `);
    await queryRunner.query(`
      DELETE FROM parking_fee_schedules
      WHERE description = 'Backfilled from facility fee configuration'
    `);
  }

  public async down(): Promise<void> {
    // Intentionally empty: seeded fee schedules should not be restored.
  }
}
