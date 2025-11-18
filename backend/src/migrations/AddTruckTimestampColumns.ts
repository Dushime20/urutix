import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTruckTimestampColumns1734522359000 implements MigrationInterface {
  name = 'AddTruckTimestampColumns1734522359000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist before adding them
    const trucksTable = await queryRunner.getTable('trucks');
    
    if (trucksTable) {
      const hasCreatedAt = trucksTable.findColumnByName('createdAt');
      const hasUpdatedAt = trucksTable.findColumnByName('updatedAt');

      if (!hasCreatedAt) {
        await queryRunner.query(`
          ALTER TABLE "trucks" 
          ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now()
        `);
        console.log('✅ Added createdAt column to trucks table');
      }

      if (!hasUpdatedAt) {
        await queryRunner.query(`
          ALTER TABLE "trucks" 
          ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        `);
        console.log('✅ Added updatedAt column to trucks table');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const trucksTable = await queryRunner.getTable('trucks');
    
    if (trucksTable) {
      const hasCreatedAt = trucksTable.findColumnByName('createdAt');
      const hasUpdatedAt = trucksTable.findColumnByName('updatedAt');

      if (hasCreatedAt) {
        await queryRunner.query(`
          ALTER TABLE "trucks" 
          DROP COLUMN "createdAt"
        `);
      }

      if (hasUpdatedAt) {
        await queryRunner.query(`
          ALTER TABLE "trucks" 
          DROP COLUMN "updatedAt"
        `);
      }
    }
  }
}

