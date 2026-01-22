import { MigrationInterface, QueryRunner } from 'typeorm';

export class ForceBrokerRoleEnum1738300000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Force add BROKER to enum if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'BROKER' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')
        ) THEN
          ALTER TYPE users_role_enum ADD VALUE 'BROKER';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cannot remove enum values in PostgreSQL
    console.log('Cannot remove BROKER enum value');
  }
}