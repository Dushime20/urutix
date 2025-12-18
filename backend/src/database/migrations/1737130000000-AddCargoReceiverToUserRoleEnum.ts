import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCargoReceiverToUserRoleEnum1737130000000 implements MigrationInterface {
  name = 'AddCargoReceiverToUserRoleEnum1737130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add CARGO_RECEIVER to the users_role_enum
    // Note: ALTER TYPE ... ADD VALUE must be run in a separate transaction in PostgreSQL
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'CARGO_RECEIVER'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type, which is complex
    // For now, we'll leave a comment that manual intervention may be needed
    // In production, you might need to:
    // 1. Create a new enum without CARGO_RECEIVER
    // 2. Update all columns to use the new enum
    // 3. Drop the old enum
    // 4. Rename the new enum
    
    // For safety, we'll just log a warning
    console.warn(
      'Cannot automatically remove CARGO_RECEIVER from enum. Manual database intervention required if needed.',
    );
  }
}

