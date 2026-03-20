import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: true,
});

async function makeTripIdNullable() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Check current constraint
    const columnInfo = await queryRunner.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'payments' 
      AND column_name = 'tripId'
    `);

    console.log('Current tripId column info:', columnInfo[0]);

    if (columnInfo[0]?.is_nullable === 'NO') {
      console.log('Making tripId nullable...');
      
      // First, drop any foreign key constraints if they exist
      const foreignKeys = await queryRunner.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'payments'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%tripId%'
      `);

      for (const fk of foreignKeys) {
        console.log(`Dropping foreign key: ${fk.constraint_name}`);
        await queryRunner.query(`
          ALTER TABLE payments 
          DROP CONSTRAINT IF EXISTS "${fk.constraint_name}"
        `);
      }

      // Make the column nullable
      await queryRunner.query(`
        ALTER TABLE payments 
        ALTER COLUMN "tripId" DROP NOT NULL
      `);

      console.log('✅ tripId is now nullable');
    } else {
      console.log('✅ tripId is already nullable');
    }

    // Record migration
    const migrationExists = await queryRunner.query(`
      SELECT * FROM migrations 
      WHERE name = 'MakeTripIdNullableInPayments1736100000000'
    `);

    if (migrationExists.length === 0) {
      await queryRunner.query(`
        INSERT INTO migrations (timestamp, name) 
        VALUES (1736100000000, 'MakeTripIdNullableInPayments1736100000000')
      `);
      console.log('✅ Migration recorded');
    }

    await queryRunner.release();
    await AppDataSource.destroy();
    console.log('✅ Done! tripId is now nullable.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

makeTripIdNullable();

