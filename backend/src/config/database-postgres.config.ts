import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const PostgresDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    'src/entities/**/*.entity.ts',
    'src/modules/**/entities/*.entity.ts',
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
