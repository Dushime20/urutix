import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBrokerCommissionColumns1738300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist
    const usersTable = await queryRunner.getTable('users');
    const hasTotalCommission = usersTable?.findColumnByName('totalCommissionEarned');
    const hasDefaultRate = usersTable?.findColumnByName('defaultCommissionRate');

    // Add totalCommissionEarned column if it doesn't exist
    if (!hasTotalCommission) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'totalCommissionEarned',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
          default: 0,
        })
      );
    }

    // Add defaultCommissionRate column if it doesn't exist
    if (!hasDefaultRate) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'defaultCommissionRate',
          type: 'decimal',
          precision: 5,
          scale: 2,
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'totalCommissionEarned');
    await queryRunner.dropColumn('users', 'defaultCommissionRate');
  }
}
