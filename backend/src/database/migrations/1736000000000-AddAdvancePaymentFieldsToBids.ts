import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdvancePaymentFieldsToBids1736000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add advancePaymentPercentage column
    await queryRunner.addColumn(
      'bids',
      new TableColumn({
        name: 'advancePaymentPercentage',
        type: 'decimal',
        precision: 5,
        scale: 2,
        isNullable: true,
        comment: 'Percentage of transportation fee to be paid before trip starts (0-100)',
      }),
    );

    // Add requireAdvancePayment column
    await queryRunner.addColumn(
      'bids',
      new TableColumn({
        name: 'requireAdvancePayment',
        type: 'boolean',
        default: true,
        comment: 'Whether advance payment is required before trip starts. If false, trip can start without advance payment.',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the columns in reverse order
    await queryRunner.dropColumn('bids', 'requireAdvancePayment');
    await queryRunner.dropColumn('bids', 'advancePaymentPercentage');
  }
}

