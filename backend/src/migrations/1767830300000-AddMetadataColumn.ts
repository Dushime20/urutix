import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMetadataColumn1767830300000 implements MigrationInterface {
    name = 'AddMetadataColumn1767830300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add metadata column (JSONB)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'metadata'
                ) THEN
                    ALTER TABLE "loads" ADD "metadata" jsonb DEFAULT '{}';
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop column
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "metadata"`);
    }
}
