const { Pool } = require('pg');
require('dotenv').config();

async function checkBulkEmailLogsTable() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('Checking bulk_email_logs table...\n');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_email_logs'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table bulk_email_logs does NOT exist!');
      console.log('\nYou need to run the migration:');
      console.log('node run-bulk-email-logs-migration.js');
      process.exit(1);
    }

    console.log('✓ Table bulk_email_logs exists\n');

    // Check table structure
    console.log('Table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bulk_email_logs'
      ORDER BY ordinal_position;
    `);

    console.table(columns.rows);

    // Check if there are any records
    const countResult = await pool.query('SELECT COUNT(*) FROM bulk_email_logs');
    console.log(`\nTotal records: ${countResult.rows[0].count}`);

    // Show sample records if any
    if (parseInt(countResult.rows[0].count) > 0) {
      const sample = await pool.query('SELECT * FROM bulk_email_logs LIMIT 3');
      console.log('\nSample records:');
      console.table(sample.rows);
    }

    // Check for foreign key constraints
    console.log('\nForeign key constraints:');
    const fkCheck = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'bulk_email_logs';
    `);

    if (fkCheck.rows.length > 0) {
      console.table(fkCheck.rows);
    } else {
      console.log('No foreign key constraints found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkBulkEmailLogsTable();
