import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKycStatusToTenants1781000000000 implements MigrationInterface {
    name = 'AddKycStatusToTenants1781000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'kycStatus') THEN 
                        ALTER TABLE "tenants" ADD COLUMN "kycStatus" character varying DEFAULT 'PENDING';
                    END IF; 
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "kycStatus"`);
    }
}
