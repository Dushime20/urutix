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

async function createSystemSettingsTable() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();

    console.log('Creating system_settings table...');
    
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "category" character varying(50) NOT NULL,
        "key" character varying(100) NOT NULL,
        "value" jsonb NOT NULL,
        "data_type" character varying(20) NOT NULL,
        "description" text,
        "is_public" boolean NOT NULL DEFAULT false,
        "updated_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_system_settings_category_key" UNIQUE ("category", "key")
      )
    `);

    console.log('Creating indexes...');
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_system_settings_category" ON "system_settings" ("category")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_system_settings_is_public" ON "system_settings" ("is_public") WHERE is_public = true`);

    console.log('Adding foreign key constraint...');
    await dataSource.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_system_settings_updated_by'
        ) THEN
          ALTER TABLE "system_settings" 
          ADD CONSTRAINT "FK_system_settings_updated_by" 
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    console.log('Inserting default settings...');
    await dataSource.query(`
      INSERT INTO "system_settings" ("category", "key", "value", "data_type", "description", "is_public") VALUES
      ('general', 'platform_name', '"Urutix Logistics"', 'string', 'Platform name', true),
      ('general', 'default_timezone', '"UTC"', 'string', 'Default timezone', true),
      ('general', 'default_currency', '"USD"', 'string', 'Default currency', true),
      ('general', 'default_language', '"en"', 'string', 'Default language', true),
      ('features', 'maintenance_mode', 'false', 'boolean', 'Maintenance mode enabled', true),
      ('features', 'user_registration', 'true', 'boolean', 'User registration enabled', true),
      ('features', 'bidding_enabled', 'true', 'boolean', 'Bidding system enabled', true),
      ('notifications', 'email_enabled', 'true', 'boolean', 'Email notifications enabled', false),
      ('notifications', 'sms_enabled', 'false', 'boolean', 'SMS notifications enabled', false),
      ('notifications', 'push_enabled', 'true', 'boolean', 'Push notifications enabled', false),
      ('api', 'rate_limit_per_minute', '100', 'number', 'API rate limit per minute', false),
      ('api', 'max_upload_size_mb', '10', 'number', 'Maximum upload size in MB', false)
      ON CONFLICT ("category", "key") DO NOTHING
    `);

    await dataSource.destroy();
    console.log('System settings table created successfully!');
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createSystemSettingsTable();