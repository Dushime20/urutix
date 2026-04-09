const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addHoursOfServiceColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: Add hoursOfService column to drivers table...');
    
    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' 
      AND column_name = 'hoursOfService'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('Column hoursOfService already exists. Skipping...');
      return;
    }
    
    // Add hoursOfService column with default value
    await client.query(`
      ALTER TABLE drivers 
      ADD COLUMN "hoursOfService" jsonb DEFAULT '{"breaks": [], "drivingHours": 0, "onDutyHours": 0, "offDutyHours": 0}'::jsonb
    `);
    
    console.log('✓ Added hoursOfService column to drivers table');
    
    // Update existing rows to have the default structure
    await client.query(`
      UPDATE drivers 
      SET "hoursOfService" = '{"breaks": [], "drivingHours": 0, "onDutyHours": 0, "offDutyHours": 0}'::jsonb
      WHERE "hoursOfService" IS NULL
    `);
    
    console.log('✓ Updated existing drivers with default hoursOfService structure');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addHoursOfServiceColumn()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
