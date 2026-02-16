import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReferenceToLoads1767718165510 implements MigrationInterface {
    name = 'AddReferenceToLoads1767718165510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loads" ADD COLUMN IF NOT EXISTS "reference" character varying`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_loads_reference" ON "loads" ("reference")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_loads_reference"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "reference"`);
    }
}
