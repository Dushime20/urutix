import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoadedStatusToLoadsEnum1735000000000 implements MigrationInterface {
  name = 'AddLoadedStatusToLoadsEnum1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add LOADED to the loads_status_enum
    // Note: ALTER TYPE ... ADD VALUE must be run in a separate transaction in PostgreSQL
    await queryRunner.query(
      `ALTER TYPE "public"."loads_status_enum" ADD VALUE IF NOT EXISTS 'LOADED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type, which is complex
    // For now, we'll leave a comment that manual intervention may be needed
    // In production, you might need to:
    // 1. Create a new enum without LOADED
    // 2. Update all columns to use the new enum
    // 3. Drop the old enum
    // 4. Rename the new enum
    
    // For safety, we'll just log a warning
    console.warn(
      'Cannot automatically remove LOADED from enum. Manual database intervention required if needed.',
    );
  }
}

