import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRateLimits1710000000001 implements MigrationInterface {
  name = 'CreateRateLimits1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rate_limits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" varchar(255) NOT NULL,
        "endpoint" varchar(100) NOT NULL,
        "userId" varchar(50),
        "ipAddress" varchar(50),
        "userAgent" varchar(100),
        "requestCount" integer NOT NULL DEFAULT 1,
        "status" varchar(20) NOT NULL DEFAULT 'SUCCESS',
        "metadata" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "expiresAt" TIMESTAMP,
        "isBlocked" boolean NOT NULL DEFAULT false,
        "blockedUntil" TIMESTAMP,
        "reason" varchar(255),
        CONSTRAINT "PK_rate_limits_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rate_limits_tenant_endpoint_createdAt" ON "rate_limits" ("tenantId", "endpoint", "createdAt");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rate_limits_tenant_createdAt" ON "rate_limits" ("tenantId", "createdAt");`,
    );

    // Ensure uuid extension exists for uuid_generate_v4
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_rate_limits_tenant_createdAt";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_rate_limits_tenant_endpoint_createdAt";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "rate_limits";`);
  }
}
