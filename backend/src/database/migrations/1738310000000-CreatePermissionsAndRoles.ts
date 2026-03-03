import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionsAndRoles1738310000000 implements MigrationInterface {
    name = 'CreatePermissionsAndRoles1738310000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create permissions table
        await queryRunner.query(`
            CREATE TABLE "permissions" (
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

        // Create roles table
        await queryRunner.query(`
            CREATE TABLE "roles" (
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

        // Create role_permissions junction table
        await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id")
            )
        `);

        // Create role_inheritance table
        await queryRunner.query(`
            CREATE TABLE "role_inheritance" (
                "role_id" uuid NOT NULL,
                "inherits_from_role_id" uuid NOT NULL,
                CONSTRAINT "PK_role_inheritance" PRIMARY KEY ("role_id", "inherits_from_role_id")
            )
        `);

        // Create user_permission_overrides table
        await queryRunner.query(`
            CREATE TABLE "user_permission_overrides" (
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

        // Add foreign keys for role_permissions
        await queryRunner.query(`
            ALTER TABLE "role_permissions" 
            ADD CONSTRAINT "FK_role_permissions_role" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "role_permissions" 
            ADD CONSTRAINT "FK_role_permissions_permission" 
            FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add foreign keys for role_inheritance
        await queryRunner.query(`
            ALTER TABLE "role_inheritance" 
            ADD CONSTRAINT "FK_role_inheritance_role" 
            FOREIGN KEY ("role_id") REFERENCES "roles"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "role_inheritance" 
            ADD CONSTRAINT "FK_role_inheritance_inherits_from" 
            FOREIGN KEY ("inherits_from_role_id") REFERENCES "roles"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add foreign keys for user_permission_overrides
        await queryRunner.query(`
            ALTER TABLE "user_permission_overrides" 
            ADD CONSTRAINT "FK_user_permission_overrides_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permission_overrides" 
            ADD CONSTRAINT "FK_user_permission_overrides_permission" 
            FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "user_permission_overrides" 
            ADD CONSTRAINT "FK_user_permission_overrides_granted_by" 
            FOREIGN KEY ("granted_by") REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_permissions_category" ON "permissions" ("category")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_user_permission_overrides_user" ON "user_permission_overrides" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_user_permission_overrides_expires" ON "user_permission_overrides" ("expires_at") WHERE "expires_at" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_user_permission_overrides_expires"`);
        await queryRunner.query(`DROP INDEX "IDX_user_permission_overrides_user"`);
        await queryRunner.query(`DROP INDEX "IDX_permissions_category"`);

        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP CONSTRAINT "FK_user_permission_overrides_granted_by"`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP CONSTRAINT "FK_user_permission_overrides_permission"`);
        await queryRunner.query(`ALTER TABLE "user_permission_overrides" DROP CONSTRAINT "FK_user_permission_overrides_user"`);
        await queryRunner.query(`ALTER TABLE "role_inheritance" DROP CONSTRAINT "FK_role_inheritance_inherits_from"`);
        await queryRunner.query(`ALTER TABLE "role_inheritance" DROP CONSTRAINT "FK_role_inheritance_role"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permission"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "user_permission_overrides"`);
        await queryRunner.query(`DROP TABLE "role_inheritance"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }
}
