const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

async function diagnoseBulkEmailIssue() {
  console.log('='.repeat(60));
  console.log('BULK EMAIL SYSTEM DIAGNOSTIC');
  console.log('='.repeat(60));
  console.log();

  // 1. Check database connection and tables
  console.log('1. DATABASE CHECK');
  console.log('-'.repeat(60));
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Check email_templates table
    const templatesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_templates'
      );
    `);
    console.log(`✓ email_templates table exists: ${templatesCheck.rows[0].exists}`);

    // Check bulk_email_logs table
    const logsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_email_logs'
      );
    `);
    console.log(`✓ bulk_email_logs table exists: ${logsCheck.rows[0].exists}`);

    // Count records
    const templateCount = await pool.query('SELECT COUNT(*) FROM email_templates');
    console.log(`✓ Templates in database: ${templateCount.rows[0].count}`);

    const logsCount = await pool.query('SELECT COUNT(*) FROM bulk_email_logs');
    console.log(`✓ Logs in database: ${logsCount.rows[0].count}`);

    // Check column names in email_templates
    console.log('\nEmail Templates Columns:');
    const templateColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'email_templates'
      ORDER BY ordinal_position;
    `);
    templateColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

    // Check column names in bulk_email_logs
    console.log('\nBulk Email Logs Columns:');
    const logsColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'bulk_email_logs'
      ORDER BY ordinal_position;
    `);
    logsColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }

  console.log();
  console.log('2. BACKEND API CHECK');
  console.log('-'.repeat(60));

  try {
    // Check if backend is running
    console.log('Checking if backend is running...');
    const healthCheck = await axios.get('http://localhost:3000/api/health').catch(() => null);
    
    if (!healthCheck) {
      console.log('❌ Backend is NOT running on http://localhost:3000');
      console.log('\nTo start the backend:');
      console.log('  cd backend');
      console.log('  npm run start:dev');
      return;
    }
    
    console.log('✓ Backend is running');

    // Test templates endpoint without auth
    console.log('\nTesting /admin/bulk-email/templates endpoint...');
    try {
      await axios.get('http://localhost:3000/api/admin/bulk-email/templates');
      console.log('✓ Endpoint accessible (unexpected - should require auth)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Endpoint requires authentication (expected)');
      } else if (error.response?.status === 500) {
        console.log('❌ 500 ERROR - Backend has an issue!');
        console.log('Error details:', error.response?.data);
      } else {
        console.log(`Status: ${error.response?.status}`);
        console.log('Response:', error.response?.data);
      }
    }

    // Test logs endpoint without auth
    console.log('\nTesting /admin/bulk-email/logs endpoint...');
    try {
      await axios.get('http://localhost:3000/api/admin/bulk-email/logs');
      console.log('✓ Endpoint accessible (unexpected - should require auth)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Endpoint requires authentication (expected)');
      } else if (error.response?.status === 500) {
        console.log('❌ 500 ERROR - Backend has an issue!');
        console.log('Error details:', error.response?.data);
      } else {
        console.log(`Status: ${error.response?.status}`);
        console.log('Response:', error.response?.data);
      }
    }

  } catch (error) {
    console.error('❌ API check error:', error.message);
  }

  console.log();
  console.log('3. ENTITY CONFIGURATION CHECK');
  console.log('-'.repeat(60));
  console.log('Expected entity property mappings:');
  console.log('  htmlBody → html_body');
  console.log('  textBody → text_body');
  console.log('  variables → template_variables');
  console.log('  isActive → is_active');
  console.log('  createdBy → created_by');
  console.log('  updatedBy → updated_by');
  console.log('  createdAt → created_at');
  console.log('  updatedAt → updated_at');

  console.log();
  console.log('='.repeat(60));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(60));
  console.log();
  console.log('NEXT STEPS:');
  console.log('1. If backend is not running, start it with: npm run start:dev');
  console.log('2. If you see 500 errors, the backend needs to be restarted');
  console.log('3. Check backend console for detailed error messages');
  console.log('4. Verify entity column mappings match database schema');
}

diagnoseBulkEmailIssue();
