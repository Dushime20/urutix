import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddPayeeIdToPayments1777673845130 implements MigrationInterface {
  name = 'AddPayeeIdToPayments1777673845130';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add payeeId column to payments table
    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'payeeId',
        type: 'uuid',
        isNullable: true,
        comment: 'ID of the user who receives the payment (e.g., truck owner receiving payment from cargo owner)',
      }),
    );

    // Add index for payeeId for better query performance
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_payee_id',
        columnNames: ['payeeId'],
      }),
    );

    // Add composite index for payerId + payeeId combination queries
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_payer_payee',
        columnNames: ['payerId', 'payeeId'],
      }),
    );

    // Add index for tenantId + payeeId for tenant-scoped queries
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'IDX_payments_tenant_payee',
        columnNames: ['tenantId', 'payeeId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('payments', 'IDX_payments_tenant_payee');
    await queryRunner.dropIndex('payments', 'IDX_payments_payer_payee');
    await queryRunner.dropIndex('payments', 'IDX_payments_payee_id');

    // Drop the payeeId column
    await queryRunner.dropColumn('payments', 'payeeId');
  }
}