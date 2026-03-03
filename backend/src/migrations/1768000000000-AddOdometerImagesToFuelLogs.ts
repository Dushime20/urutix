import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOdometerImagesToFuelLogs1768000000000 implements MigrationInterface {
    name = 'AddOdometerImagesToFuelLogs1768000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add receipt_url column if it doesn't exist
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fuel_logs' AND column_name='receipt_url') THEN 
                    ALTER TABLE "fuel_logs" ADD COLUMN "receipt_url" varchar(500); 
                END IF; 
            END $$;
        `);

        // Add odometer_image_url column if it doesn't exist
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fuel_logs' AND column_name='odometer_image_url') THEN 
                    ALTER TABLE "fuel_logs" ADD COLUMN "odometer_image_url" varchar(500); 
                END IF; 
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fuel_logs" DROP COLUMN IF EXISTS "odometer_image_url"`);
        await queryRunner.query(`ALTER TABLE "fuel_logs" DROP COLUMN IF EXISTS "receipt_url"`);
    }
}
