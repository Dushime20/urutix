import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

/**
 * PostgreSQL DataSource configuration for migrations.
 * 
 * NOTE: This file is currently unused. The main application uses:
 * - database.config.ts for TypeORM module configuration
 * - data-source.ts (AppDataSource) for migration CLI
 * 
 * This file may be kept for reference or future use.
 */
export const PostgresDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    'src/entities/**/*.entity.ts',
    'src/modules/**/entities/*.entity.ts',
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
