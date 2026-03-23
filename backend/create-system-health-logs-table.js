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

async function createSystemHealthLogsTable() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();

    console.log('Creating system_health_logs table...');
    
    // Create enum types first
    await dataSource.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_status_enum') THEN
          CREATE TYPE "public"."system_health_logs_status_enum" AS ENUM('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'CRITICAL');
        END IF;
      END $$;
    `);

    await dataSource.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'system_health_logs_severity_enum') THEN
          CREATE TYPE "public"."system_health_logs_severity_enum" AS ENUM('low', 'medium', 'high', 'critical');
        END IF;
      END $$;
    `);

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "system_health_logs" (
        "id" SERIAL PRIMARY KEY,
        "service" character varying(50) NOT NULL,
        "status" "public"."system_health_logs_status_enum" NOT NULL,
        "response_time" integer DEFAULT NULL,
        "error_message" text DEFAULT NULL,
        "metric_type" character varying(50) DEFAULT NULL,
        "metric_name" character varying(100) DEFAULT NULL,
        "metric_value" numeric(10,2) DEFAULT NULL,
        "threshold_value" numeric(10,2) DEFAULT NULL,
        "severity" "public"."system_health_logs_severity_enum" DEFAULT NULL,
        "metadata" jsonb DEFAULT '{}',
        "timestamp" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    console.log('Creating indexes...');
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_system_health_logs_service" ON "system_health_logs" ("service")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_system_health_logs_timestamp" ON "system_health_logs" ("timestamp")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_system_health_logs_status" ON "system_health_logs" ("status")`);
    await dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_system_health_logs_service_timestamp" ON "system_health_logs" ("service", "timestamp")`);

    await dataSource.destroy();
    console.log('System health logs table created successfully!');
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createSystemHealthLogsTable();