import { DataSource } from 'typeorm';
import { CreateAllTables1762849950556 } from './migrations/1762849950556-CreateAllTables';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    'src/entities/**/*.entity.ts',
    'src/modules/**/entities/*.entity.ts',
    'src/entities/*.ts',
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
