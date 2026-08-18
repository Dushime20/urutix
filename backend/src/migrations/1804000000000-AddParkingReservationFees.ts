import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class AddParkingReservationFees1804000000000 implements MigrationInterface {
  name = 'AddParkingReservationFees1804000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = path.join(__dirname, '../../migrations/077_parking_reservation_fees.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_parking_reservations_payment_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_parking_reservations_invoice`);
    await queryRunner.query(`
      ALTER TABLE parking_reservations
        DROP COLUMN IF EXISTS "feeSnapshot",
        DROP COLUMN IF EXISTS "paymentNotes",
        DROP COLUMN IF EXISTS "paymentReference",
        DROP COLUMN IF EXISTS "paymentMethod",
        DROP COLUMN IF EXISTS "paidAmount",
        DROP COLUMN IF EXISTS "paidAt",
        DROP COLUMN IF EXISTS "paymentDueAt",
        DROP COLUMN IF EXISTS "invoiceNumber",
        DROP COLUMN IF EXISTS "totalAmountDue",
        DROP COLUMN IF EXISTS "taxAmount",
        DROP COLUMN IF EXISTS "taxPercent",
        DROP COLUMN IF EXISTS "subtotalAmount",
        DROP COLUMN IF EXISTS "reservationFeeAmount",
        DROP COLUMN IF EXISTS "occupancyAmount",
        DROP COLUMN IF EXISTS currency,
        DROP COLUMN IF EXISTS "paymentStatus"
    `);
    await queryRunner.query(`
      ALTER TABLE parking_facility_config
        DROP COLUMN IF EXISTS "paymentInstructions",
        DROP COLUMN IF EXISTS "feeNotes",
        DROP COLUMN IF EXISTS "paymentDueDays",
        DROP COLUMN IF EXISTS "taxPercent",
        DROP COLUMN IF EXISTS "reservationFee",
        DROP COLUMN IF EXISTS "monthlyRatePerSpace",
        DROP COLUMN IF EXISTS currency
    `);
  }
}
