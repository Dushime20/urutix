import { AppDataSource } from '../data-source';

async function addCargoAlignmentColumns() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('Adding cargo alignment columns...');

    // Add columns
    await queryRunner.query(`
      ALTER TABLE "trucks" 
      ADD COLUMN IF NOT EXISTS "cargoCapabilities" JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "loadingCapabilities" JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "securityFeatures" JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "certifications" JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "routeCapabilities" JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "costStructure" JSONB DEFAULT '{}'
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_trucks_cargo_capabilities" ON "trucks" USING GIN ("cargoCapabilities");
      CREATE INDEX IF NOT EXISTS "IDX_trucks_loading_capabilities" ON "trucks" USING GIN ("loadingCapabilities");
      CREATE INDEX IF NOT EXISTS "IDX_trucks_security_features" ON "trucks" USING GIN ("securityFeatures");
      CREATE INDEX IF NOT EXISTS "IDX_trucks_certifications" ON "trucks" USING GIN ("certifications");
      CREATE INDEX IF NOT EXISTS "IDX_trucks_route_capabilities" ON "trucks" USING GIN ("routeCapabilities");
      CREATE INDEX IF NOT EXISTS "IDX_trucks_cost_structure" ON "trucks" USING GIN ("costStructure");
    `);

    console.log('Cargo alignment columns added successfully!');
    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error adding cargo alignment columns:', error);
    process.exit(1);
  }
}

addCargoAlignmentColumns();
