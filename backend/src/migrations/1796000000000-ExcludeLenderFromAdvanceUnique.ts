import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Defence-in-depth for loan disbursement retries.
 *
 * Lender disbursement payments were historically stored as paymentType='advance'
 * (createPayment hardcoded ADVANCE), which collided with
 * uq_payment_trip_payer_advance_active on retry.
 *
 * 1. Reclassify existing lender ADVANCE rows to trip_payment (when safe)
 * 2. Exclude metadata.isLenderPayment from the ADVANCE unique index
 */
export class ExcludeLenderFromAdvanceUnique1796000000000
  implements MigrationInterface
{
  name = 'ExcludeLenderFromAdvanceUnique1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Cancel lender ADVANCE rows that would collide with an existing trip_payment
    await queryRunner.query(`
      UPDATE payments p
      SET
        status = 'cancelled',
        "failureReason" = 'Superseded: mis-typed lender advance conflicted with trip_payment',
        metadata = COALESCE(p.metadata, '{}'::jsonb) || jsonb_build_object(
          'cancelledReason', 'Mis-typed lender ADVANCE cancelled during migration 1796000000000',
          'cancelledAt', NOW()::text
        )
      WHERE p."paymentType" = 'advance'
        AND (p.metadata->>'isLenderPayment') = 'true'
        AND p."deleted_at" IS NULL
        AND p.status IN ('pending', 'processing', 'completed')
        AND EXISTS (
          SELECT 1 FROM payments x
          WHERE x."tripId" = p."tripId"
            AND x."payerId" = p."payerId"
            AND x."paymentType" = 'trip_payment'
            AND x.status IN ('pending', 'processing', 'completed')
            AND x."deleted_at" IS NULL
            AND x.id <> p.id
        )
    `);

    // Reclassify remaining mis-typed lender ADVANCE rows
    await queryRunner.query(`
      UPDATE payments
      SET "paymentType" = 'trip_payment'
      WHERE "paymentType" = 'advance'
        AND (metadata->>'isLenderPayment') = 'true'
        AND "deleted_at" IS NULL
        AND status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS uq_payment_trip_payer_advance_active`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_trip_payer_advance_active
        ON payments ("tripId", "payerId")
        WHERE "paymentType" = 'advance'
          AND status IN ('pending', 'processing', 'completed')
          AND COALESCE(metadata->>'isLenderPayment', 'false') <> 'true'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS uq_payment_trip_payer_advance_active`,
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_trip_payer_advance_active
        ON payments ("tripId", "payerId")
        WHERE "paymentType" = 'advance'
          AND status IN ('pending', 'processing', 'completed')
    `);
  }
}
