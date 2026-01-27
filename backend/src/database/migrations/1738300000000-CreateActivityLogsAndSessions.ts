import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActivityLogsAndSessions1738300000000 implements MigrationInterface {
    name = 'CreateActivityLogsAndSessions1738300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure uuid-ossp extension is enabled
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create activity_logs table
        await queryRunner.query(`
            CREATE TABLE "activity_logs" (
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

        // Create indexes for activity_logs
        await queryRunner.query(`
            CREATE INDEX "IDX_activity_logs_user_id" ON "activity_logs" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_activity_logs_action" ON "activity_logs" ("action")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_activity_logs_resource" ON "activity_logs" ("resource", "resource_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_activity_logs_created_at" ON "activity_logs" ("created_at" DESC)
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_activity_logs_suspicious" ON "activity_logs" ("is_suspicious") WHERE "is_suspicious" = true
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "activity_logs" 
            ADD CONSTRAINT "FK_activity_logs_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create user_sessions table
        await queryRunner.query(`
            CREATE TABLE "user_sessions" (
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

        // Create indexes for user_sessions
        await queryRunner.query(`
            CREATE INDEX "IDX_user_sessions_user_id" ON "user_sessions" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_user_sessions_expires_at" ON "user_sessions" ("expires_at")
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "user_sessions" 
            ADD CONSTRAINT "FK_user_sessions_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`
            ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_user_sessions_user"
        `);
        await queryRunner.query(`
            ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_activity_logs_user"
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_user_sessions_expires_at"`);
        await queryRunner.query(`DROP INDEX "IDX_user_sessions_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_activity_logs_suspicious"`);
        await queryRunner.query(`DROP INDEX "IDX_activity_logs_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_activity_logs_resource"`);
        await queryRunner.query(`DROP INDEX "IDX_activity_logs_action"`);
        await queryRunner.query(`DROP INDEX "IDX_activity_logs_user_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`DROP TABLE "activity_logs"`);
    }
}
