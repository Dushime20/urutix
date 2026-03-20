import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

/**
 * DataSource configuration for TypeORM migrations.
 * 
 * This is used by the TypeORM CLI for running migrations.
 * Configuration should match database.config.ts for consistency.
 * 
 * Required environment variables:
 * - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    'src/**/*.entity.ts',
    'src/**/entities/*.entity.ts',
    'src/*.ts',
  ],
  migrations: [
    'src/database/migrations/*.ts',
    'src/migrations/*.ts',
  ],
  subscribers: [],
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
