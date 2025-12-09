import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeTripIdNullableInPayments1736100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make tripId nullable in payments table
    await queryRunner.changeColumn(
      'payments',
      'tripId',
      new TableColumn({
        name: 'tripId',
        type: 'uuid',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Make tripId NOT NULL again
    // Note: This will fail if there are any NULL values
    await queryRunner.changeColumn(
      'payments',
      'tripId',
      new TableColumn({
        name: 'tripId',
        type: 'uuid',
        isNullable: false,
      }),
    );
  }
}

