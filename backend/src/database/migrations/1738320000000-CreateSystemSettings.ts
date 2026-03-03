import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSystemSettings1738320000000 implements MigrationInterface {
    name = 'CreateSystemSettings1738320000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create system_settings table
        await queryRunner.query(`
            CREATE TABLE "system_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "category" character varying(50) NOT NULL,
                "key" character varying(100) NOT NULL,
                "value" jsonb NOT NULL,
                "data_type" character varying(20) NOT NULL,
                "description" text,
                "is_public" boolean NOT NULL DEFAULT false,
                "updated_by" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_system_settings" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_system_settings_category_key" UNIQUE ("category", "key")
            )
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_system_settings_category" ON "system_settings" ("category")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_system_settings_public" ON "system_settings" ("is_public") WHERE "is_public" = true
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "system_settings" 
            ADD CONSTRAINT "FK_system_settings_updated_by" 
            FOREIGN KEY ("updated_by") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Insert default settings
        await queryRunner.query(`
            INSERT INTO "system_settings" ("category", "key", "value", "data_type", "description", "is_public") VALUES
            ('general', 'platform_name', '"Urutix"', 'string', 'Platform name', true),
            ('general', 'default_timezone', '"Africa/Nairobi"', 'string', 'Default timezone', true),
            ('general', 'default_currency', '"KES"', 'string', 'Default currency', true),
            ('general', 'default_language', '"en"', 'string', 'Default language', true),
            ('notifications', 'email_enabled', 'true', 'boolean', 'Enable email notifications', false),
            ('notifications', 'sms_enabled', 'true', 'boolean', 'Enable SMS notifications', false),
            ('notifications', 'push_enabled', 'true', 'boolean', 'Enable push notifications', false),
            ('features', 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', false),
            ('features', 'user_registration', 'true', 'boolean', 'Allow user registration', false),
            ('features', 'bidding_enabled', 'true', 'boolean', 'Enable bidding feature', false),
            ('api', 'rate_limit_per_minute', '60', 'number', 'API rate limit per minute', false),
            ('api', 'max_upload_size_mb', '10', 'number', 'Maximum upload size in MB', false)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key
        await queryRunner.query(`
            ALTER TABLE "system_settings" DROP CONSTRAINT "FK_system_settings_updated_by"
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_system_settings_public"`);
        await queryRunner.query(`DROP INDEX "IDX_system_settings_category"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "system_settings"`);
    }
}
