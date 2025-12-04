/**
 * SQLite test database configuration.
 * 
 * NOTE: This file is currently unused. The application uses PostgreSQL for testing.
 * This configuration may be kept for reference or future SQLite test support.
 */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Load } from '../entities/load.entity';
import { Location } from '../entities/location.entity';
import { User } from '../entities/user.entity';
// Exclude UserProfile and other entities with jsonb fields for SQLite testing

export const databaseSqliteTestConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'database-test.sqlite',
  entities: [
    Load,
    Location,
    User,
    // Exclude UserProfile, Trip, and other entities with jsonb fields
  ],
  synchronize: true, // Only for testing
  autoLoadEntities: false,
  logging: process.env.NODE_ENV === 'development',
};
