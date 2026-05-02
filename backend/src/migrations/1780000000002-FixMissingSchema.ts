import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMissingSchema1780000000002 implements MigrationInterface {
    name = 'FixMissingSchema1780000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user_profiles_kyc_requirement_level_enum if it doesn't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profiles_kyc_requirement_level_enum') THEN
                    CREATE TYPE "public"."user_profiles_kyc_requirement_level_enum" AS ENUM('BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM');
                END IF;
            END$$;
        `);

        // Add kyc_requirement_level to user_profiles if it doesn't exist
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'kyc_requirement_level') THEN 
                    ALTER TABLE "user_profiles" ADD COLUMN "kyc_requirement_level" "public"."user_profiles_kyc_requirement_level_enum" NOT NULL DEFAULT 'BASIC';
                END IF; 
            END $$;
        `);

        // Create system_health_logs table if it doesn't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_service_enum') THEN
                    CREATE TYPE "public"."system_health_logs_service_enum" AS ENUM('DATABASE', 'API', 'CACHE', 'EMAIL', 'STORAGE', 'PAYMENT', 'SERVER');
                END IF;
            END$$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_status_enum') THEN
                    CREATE TYPE "public"."system_health_logs_status_enum" AS ENUM('HEALTHY', 'DEGRADED', 'DOWN', 'CRITICAL', 'UNHEALTHY');
                END IF;
            END$$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_severity_enum') THEN
                    CREATE TYPE "public"."system_health_logs_severity_enum" AS ENUM('critical', 'high', 'low', 'medium');
                END IF;
            END$$;
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
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "timestamp" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_system_health_logs_id" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "kyc_requirement_level"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "system_health_logs"`);
    }
}
