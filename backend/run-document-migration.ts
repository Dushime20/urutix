import { DataSource } from 'typeorm';
import { CreateDocumentsTable1739000000000 } from './src/database/migrations/1739000000000-CreateDocumentsTable';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'smartcargo',
  synchronize: false,
  logging: true,
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/database/migrations/**/*.ts'],
});

async function runDocumentMigration() {
  try {
    console.log('🚀 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('📦 Running CreateDocumentsTable migration...');
    const migration = new CreateDocumentsTable1739000000000();
    
    try {
      await migration.up(queryRunner);
      console.log('✅ Documents table created successfully!');
      
      // Insert migration record
      await queryRunner.query(
        `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
        [1739000000000, 'CreateDocumentsTable1739000000000']
      );
      console.log('✅ Migration record inserted');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️  Documents table already exists, skipping...');
      } else {
        throw error;
      }
    }

    await queryRunner.release();
    await AppDataSource.destroy();
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runDocumentMigration();
