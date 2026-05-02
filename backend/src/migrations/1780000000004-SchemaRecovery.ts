import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaRecovery1780000000004 implements MigrationInterface {
    name = 'SchemaRecovery1780000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- ENUMS ---
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_sender_role_enum') THEN
                    CREATE TYPE "public"."message_sender_role_enum" AS ENUM('DRIVER', 'SHIPPER', 'CARGO_OWNER', 'TRUCK_OWNER', 'DISPATCH', 'SYSTEM');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_service_enum') THEN
                    CREATE TYPE "public"."system_health_logs_service_enum" AS ENUM('DATABASE', 'API', 'CACHE', 'EMAIL', 'STORAGE', 'PAYMENT', 'SERVER');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_status_enum') THEN
                    CREATE TYPE "public"."system_health_logs_status_enum" AS ENUM('HEALTHY', 'DEGRADED', 'DOWN', 'CRITICAL', 'UNHEALTHY');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_severity_enum') THEN
                    CREATE TYPE "public"."system_health_logs_severity_enum" AS ENUM('critical', 'high', 'low', 'medium');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profiles_kyc_requirement_level_enum') THEN
                    CREATE TYPE "public"."user_profiles_kyc_requirement_level_enum" AS ENUM('BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM');
                END IF;
            END $$;
        `);

        // --- TABLES ---

        // 1. Roles & Permissions
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL UNIQUE,
                "description" text,
                "is_system" boolean DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "resource" character varying(100) NOT NULL,
                "action" character varying(50) NOT NULL,
                "description" text,
                "category" character varying(50),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "role_permissions" (
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
                CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
            )
        `);

        // 2. User Sessions & Activity
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_sessions" (
                "session_id" character varying(255) NOT NULL,
                "user_id" uuid NOT NULL,
                "ip_address" inet,
                "user_agent" text,
                "device_info" jsonb,
                "location" jsonb,
                "last_activity" timestamp DEFAULT CURRENT_TIMESTAMP,
                "expires_at" timestamp NOT NULL,
                "started_at" timestamp DEFAULT CURRENT_TIMESTAMP,
                "tenant_id" uuid NOT NULL,
                CONSTRAINT "PK_user_sessions_id" PRIMARY KEY ("session_id")
            )
        `);

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
                "is_suspicious" boolean DEFAULT false,
                "session_id" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_activity_logs_id" PRIMARY KEY ("id")
            )
        `);

        // 3. System Config & Health
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "system_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "category" character varying(50) NOT NULL,
                "key" character varying(100) NOT NULL,
                "value" jsonb NOT NULL,
                "data_type" character varying(20) NOT NULL,
                "description" text,
                "is_public" boolean DEFAULT false,
                "updated_by" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_system_settings_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "system_health_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "service" "public"."system_health_logs_service_enum" NOT NULL,
                "status" "public"."system_health_logs_status_enum" NOT NULL,
                "metric_type" character varying,
                "metric_name" character varying,
                "metric_value" numeric,
                "threshold_value" numeric,
                "severity" "public"."system_health_logs_severity_enum",
                "response_time" integer,
                "error_message" text,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "timestamp" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_system_health_logs_id" PRIMARY KEY ("id")
            )
        `);

        // 4. Financial (Credit System)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "credit_accounts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "balance" numeric(15,2) DEFAULT 0,
                "bonus_balance" numeric(15,2) DEFAULT 0,
                "currency" character varying(10) DEFAULT 'RWF',
                "revenue_from_partner_sales" numeric(15,2) DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_credit_accounts_id" PRIMARY KEY ("id")
            )
        `);

        // --- MISSING COLUMNS PATCH ---
        const columnsToAdd = [
            ['user_profiles', 'kyc_requirement_level', 'public.user_profiles_kyc_requirement_level_enum', "'BASIC'"],
            ['user_profiles', 'kyc_submitted_at', 'timestamp', 'NULL'],
            ['user_profiles', 'identity_verified', 'boolean', 'false'],
            ['user_profiles', 'address_verified', 'boolean', 'false'],
            ['user_profiles', 'business_verified', 'boolean', 'false'],
            ['user_profiles', 'compliance_score', 'numeric', '0']
        ];

        for (const [table, column, type, def] of columnsToAdd) {
            await queryRunner.query(`
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${table}') THEN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}') THEN
                            ALTER TABLE "${table}" ADD COLUMN "${column}" ${type} DEFAULT ${def};
                        END IF;
                    END IF;
                END $$;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
