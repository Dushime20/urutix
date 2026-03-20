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

async function addColumns() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Check if columns already exist
    const advancePaymentColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bids' 
      AND column_name = 'advancePaymentPercentage'
    `);

    const requireAdvanceColumn = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bids' 
      AND column_name = 'requireAdvancePayment'
    `);

    if (advancePaymentColumn.length === 0) {
      console.log('Adding advancePaymentPercentage column...');
      await queryRunner.query(`
        ALTER TABLE bids 
        ADD COLUMN "advancePaymentPercentage" decimal(5,2)
      `);
      await queryRunner.query(`
        COMMENT ON COLUMN bids."advancePaymentPercentage" IS 
        'Percentage of transportation fee to be paid before trip starts (0-100)'
      `);
      console.log('✅ advancePaymentPercentage column added');
    } else {
      console.log('✅ advancePaymentPercentage column already exists');
    }

    if (requireAdvanceColumn.length === 0) {
      console.log('Adding requireAdvancePayment column...');
      await queryRunner.query(`
        ALTER TABLE bids 
        ADD COLUMN "requireAdvancePayment" boolean NOT NULL DEFAULT true
      `);
      await queryRunner.query(`
        COMMENT ON COLUMN bids."requireAdvancePayment" IS 
        'Whether advance payment is required before trip starts. If false, trip can start without advance payment.'
      `);
      console.log('✅ requireAdvancePayment column added');
    } else {
      console.log('✅ requireAdvancePayment column already exists');
    }

    // Record migration in migrations table
    const migrationExists = await queryRunner.query(`
      SELECT * FROM migrations 
      WHERE name = 'AddAdvancePaymentFieldsToBids1736000000000'
    `);

    if (migrationExists.length === 0) {
      await queryRunner.query(`
        INSERT INTO migrations (timestamp, name) 
        VALUES (1736000000000, 'AddAdvancePaymentFieldsToBids1736000000000')
      `);
      console.log('✅ Migration recorded');
    }

    await queryRunner.release();
    await AppDataSource.destroy();
    console.log('✅ Done! Columns added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addColumns();

