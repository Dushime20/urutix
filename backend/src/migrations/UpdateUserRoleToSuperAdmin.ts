import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserRoleToSuperAdmin1716982800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update user e705fb93-ae73-4522-b9e0-43ea9ce46de4 from ADMIN to SUPER_ADMIN
    await queryRunner.query(`
      UPDATE users 
      SET role = 'SUPER_ADMIN', 
          updated_at = NOW()
      WHERE id = 'e705fb93-ae73-4522-b9e0-43ea9ce46de4'
        AND tenant_id = '47a581e7-9234-4fdb-879c-656983090af6'
        AND email = 'admin@urutix.com'
    `);

    console.log('✅ User role updated to SUPER_ADMIN successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to ADMIN if needed
    await queryRunner.query(`
      UPDATE users 
      SET role = 'ADMIN', 
          updated_at = NOW()
      WHERE id = 'e705fb93-ae73-4522-b9e0-43ea9ce46de4'
        AND tenant_id = '47a581e7-9234-4fdb-879c-656983090af6'
    `);

    console.log('✅ User role reverted to ADMIN');
  }
}
