/**
 * Production Data Source Configuration (JavaScript)
 * 
 * This file is used for running migrations in production where TypeScript files are not available.
 * It uses the compiled entities and migrations from the dist folder.
 */

require('dotenv').config();
const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [
    'dist/**/*.entity.js',
  ],
  migrations: [
    'dist/database/migrations/*.js',
    'dist/migrations/*.js',
  ],
  subscribers: [],
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

module.exports = { AppDataSource };
