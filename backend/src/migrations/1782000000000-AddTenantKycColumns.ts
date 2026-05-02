import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantKycColumns1782000000000 implements MigrationInterface {
    name = 'AddTenantKycColumns1782000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'kycSubmittedAt') THEN 
                        ALTER TABLE "tenants" ADD COLUMN "kycSubmittedAt" TIMESTAMP;
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'kycVerifiedAt') THEN 
                        ALTER TABLE "tenants" ADD COLUMN "kycVerifiedAt" TIMESTAMP;
                    END IF; 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'kycNotes') THEN 
                        ALTER TABLE "tenants" ADD COLUMN "kycNotes" character varying;
                    END IF; 
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "tenants" 
            DROP COLUMN IF EXISTS "kycSubmittedAt",
            DROP COLUMN IF EXISTS "kycVerifiedAt",
            DROP COLUMN IF EXISTS "kycNotes";
        `);
    }
}
