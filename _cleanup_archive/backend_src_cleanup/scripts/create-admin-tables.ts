import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createTables() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        console.log('Creating uuid-ossp extension...');
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        console.log('Creating system_settings table...');
        try {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "system_settings" (
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

            // Seed defaults if empty
            const count = await queryRunner.query(`SELECT count(*) FROM "system_settings"`);
            if (parseInt(count[0].count) === 0) {
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
                console.log('Seeded system settings');
            }
        } catch (e) {
            console.error('Error creating system_settings:', e);
        }

        console.log('Creating activity_logs table...');
        try {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "activity_logs" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "user_id" uuid,
                    "action" character varying(100) NOT NULL,
                    "resource" character varying(100),
                    "resource_id" character varying(255),
                    "details" jsonb,
                    "ip_address" inet,
                    "user_agent" text,
                    "location" jsonb,
                    "is_suspicious" boolean NOT NULL DEFAULT false,
                    "session_id" character varying(255),
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_activity_logs" PRIMARY KEY ("id")
                )
            `);
        } catch (e) {
            console.error('Error creating activity_logs:', e);
        }

        console.log('Creating user_sessions table...');
        try {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "user_sessions" (
                    "id" character varying(255) NOT NULL,
                    "user_id" uuid NOT NULL,
                    "ip_address" inet,
                    "user_agent" text,
                    "device_info" jsonb,
                    "location" jsonb,
                    "last_activity" TIMESTAMP NOT NULL DEFAULT now(),
                    "expires_at" TIMESTAMP NOT NULL,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_user_sessions" PRIMARY KEY ("id")
                )
            `);
        } catch (e) {
            console.error('Error creating user_sessions:', e);
        }

        // Permissions tables omitted for brevity but should be added if needed
        console.log('Creating permissions tables...');
        try {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "permissions" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "resource" character varying(100) NOT NULL,
                    "action" character varying(50) NOT NULL,
                    "description" text,
                    "category" character varying(50),
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_permissions_resource_action" UNIQUE ("resource", "action")
                )
            `);

            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "roles" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying(100) NOT NULL,
                    "description" text,
                    "is_system" boolean NOT NULL DEFAULT false,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_roles_name" UNIQUE ("name")
                )
            `);

            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "user_permission_overrides" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "user_id" uuid NOT NULL,
                    "permission_id" uuid NOT NULL,
                    "granted" boolean NOT NULL,
                    "reason" text,
                    "granted_by" uuid,
                    "expires_at" TIMESTAMP,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_user_permission_overrides" PRIMARY KEY ("id"),
                    CONSTRAINT "UQ_user_permission_overrides" UNIQUE ("user_id", "permission_id")
                )
            `);
        } catch (e) {
            console.error('Error creating permission tables:', e);
        }

        await queryRunner.release();
        await AppDataSource.destroy();
        console.log('Done');
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

createTables();
