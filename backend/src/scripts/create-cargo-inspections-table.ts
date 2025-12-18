import { AppDataSource } from '../data-source';

async function createCargoInspectionsTable() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Data Source has been initialized!');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('🔧 Creating cargo_inspections table...');

    // Create enum type if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cargo_inspections_status_enum') THEN
              CREATE TYPE "public"."cargo_inspections_status_enum" AS ENUM(
                  'PENDING',
                  'IN_PROGRESS',
                  'COMPLETED',
                  'DISPUTED'
              );
          END IF;
      END $$;
    `);

    // Create table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cargo_inspections" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "loadId" uuid NOT NULL,
          "receiverId" uuid NOT NULL,
          "status" "public"."cargo_inspections_status_enum" NOT NULL DEFAULT 'PENDING',
          "checklist" jsonb NOT NULL DEFAULT '[]',
          "overallNotes" text,
          "allItemsVerified" boolean NOT NULL DEFAULT false,
          "verifiedCount" integer NOT NULL DEFAULT 0,
          "totalItems" integer NOT NULL DEFAULT 0,
          "discrepancyCount" integer NOT NULL DEFAULT 0,
          "discrepancies" jsonb,
          "completedAt" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_cargo_inspections_id" PRIMARY KEY ("id")
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_loadId_receiverId" 
      ON "cargo_inspections" ("loadId", "receiverId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_status_createdAt" 
      ON "cargo_inspections" ("status", "createdAt");
    `);

    // Create foreign keys
    await queryRunner.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'FK_cargo_inspections_loadId'
          ) THEN
              ALTER TABLE "cargo_inspections"
              ADD CONSTRAINT "FK_cargo_inspections_loadId"
              FOREIGN KEY ("loadId")
              REFERENCES "loads"("id")
              ON DELETE CASCADE
              ON UPDATE NO ACTION;
          END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'FK_cargo_inspections_receiverId'
          ) THEN
              ALTER TABLE "cargo_inspections"
              ADD CONSTRAINT "FK_cargo_inspections_receiverId"
              FOREIGN KEY ("receiverId")
              REFERENCES "users"("id")
              ON DELETE CASCADE
              ON UPDATE NO ACTION;
          END IF;
      END $$;
    `);

    console.log('✅ cargo_inspections table created successfully!');

    // Verify the table was created
    const result = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'cargo_inspections';
    `);

    if (result.length > 0) {
      console.log('✅ Table verification: Table exists');
    } else {
      console.warn('⚠️  Table not found after creation');
    }

    await queryRunner.release();
    await AppDataSource.destroy();

    console.log('✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating cargo_inspections table:', error);
    process.exit(1);
  }
}

createCargoInspectionsTable();

