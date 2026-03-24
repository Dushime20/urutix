const { Client } = require('pg');
require('dotenv').config();

async function addExperienceColumn() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if experience column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' AND column_name = 'experience'
    `);

    if (checkColumn.rows.length === 0) {
      console.log('Adding experience column to drivers table...');
      await client.query(`
        ALTER TABLE "drivers" 
        ADD COLUMN "experience" integer
      `);
      console.log('✅ Experience column added successfully');
    } else {
      console.log('✅ Experience column already exists');
    }

    // Check if driverNotes column exists
    const checkNotesColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' AND column_name = 'driverNotes'
    `);

    if (checkNotesColumn.rows.length === 0) {
      console.log('Adding driverNotes column to drivers table...');
      await client.query(`
        ALTER TABLE "drivers" 
        ADD COLUMN "driverNotes" text
      `);
      console.log('✅ DriverNotes column added successfully');
    } else {
      console.log('✅ DriverNotes column already exists');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

addExperienceColumn();