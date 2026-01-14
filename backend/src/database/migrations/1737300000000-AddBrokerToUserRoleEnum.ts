import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrokerToUserRoleEnum1737300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE users_role_enum ADD VALUE IF NOT EXISTS 'BROKER';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type
    console.log('Cannot remove enum value BROKER - manual intervention required');
  }
}
