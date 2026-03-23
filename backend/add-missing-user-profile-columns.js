const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: true,
});

async function addMissingUserProfileColumns() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();

    console.log('Adding missing user_profiles columns...');
    
    // Create enum type for kyc_requirement_level if it doesn't exist
    await dataSource.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_profiles_kycrequirementlevel_enum') THEN
          CREATE TYPE "public"."user_profiles_kycrequirementlevel_enum" AS ENUM('BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM');
        END IF;
      END $$;
    `);

    // Add all missing columns
    const columnsToAdd = [
      {
        name: 'kyc_submitted_at',
        definition: 'TIMESTAMP DEFAULT NULL'
      },
      {
        name: 'kyc_reviewed_by',
        definition: 'character varying DEFAULT NULL'
      },
      {
        name: 'kyc_notes',
        definition: 'character varying DEFAULT NULL'
      },
      {
        name: 'kyc_data',
        definition: 'jsonb DEFAULT \'{}\''
      },
      {
        name: 'identity_verified',
        definition: 'boolean DEFAULT false'
      },
      {
        name: 'address_verified',
        definition: 'boolean DEFAULT false'
      },
      {
        name: 'financial_verified',
        definition: 'boolean DEFAULT false'
      },
      {
        name: 'business_verified',
        definition: 'boolean DEFAULT false'
      },
      {
        name: 'background_check_completed',
        definition: 'boolean DEFAULT false'
      },
      {
        name: 'compliance_score',
        definition: 'integer DEFAULT 0'
      }
    ];

    for (const column of columnsToAdd) {
      console.log(`Adding column: ${column.name}`);
      await dataSource.query(`
        ALTER TABLE "user_profiles" 
        ADD COLUMN IF NOT EXISTS "${column.name}" ${column.definition}
      `);
    }

    // Update the kyc_requirement_level column to use the proper enum type
    console.log('Updating kyc_requirement_level column type...');
    await dataSource.query(`
      DO $$ 
      BEGIN
        -- First check if the column exists and update its type
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_profiles' AND column_name = 'kyc_requirement_level'
        ) THEN
          -- Drop the column and recreate it with proper enum type
          ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "kyc_requirement_level";
          ALTER TABLE "user_profiles" ADD COLUMN "kyc_requirement_level" "public"."user_profiles_kycrequirementlevel_enum" DEFAULT 'BASIC';
        END IF;
      END $$;
    `);

    // Create index for kyc_requirement_level
    await dataSource.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_profiles_kyc_requirement_level" 
      ON "user_profiles" ("kyc_requirement_level")
    `);

    await dataSource.destroy();
    console.log('✅ All missing user_profiles columns added successfully!');
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

addMissingUserProfileColumns();