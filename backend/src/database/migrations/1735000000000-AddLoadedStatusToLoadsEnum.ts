import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoadedStatusToLoadsEnum1735000000000 implements MigrationInterface {
  name = 'AddLoadedStatusToLoadsEnum1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add LOADED to the loads_status_enum
    // Check if the enum exists first (it may be created by InitMigration)
    const enumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'loads_status_enum'
      )
    `);
    
    if (enumExists[0].exists) {
      // Note: ALTER TYPE ... ADD VALUE must be run in a separate transaction in PostgreSQL
      // Check if LOADED value already exists
      const hasLoaded = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'LOADED' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'loads_status_enum')
        )
      `);
      
      if (!hasLoaded[0].exists) {
        await queryRunner.query(
          `ALTER TYPE "public"."loads_status_enum" ADD VALUE IF NOT EXISTS 'LOADED'`,
        );
      }
    }
    // If enum doesn't exist, it will be created by InitMigration with LOADED included
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

