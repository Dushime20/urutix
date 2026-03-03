require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'urutix',
});

async function checkEmailTemplates() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Email Templates Setup\n');
    console.log('='.repeat(60));
    
    // Check if table exists
    console.log('\n1. Checking if email_templates table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_templates'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ email_templates table does NOT exist');
      console.log('\n📝 Table schema needed:');
      console.log(`
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  html_body TEXT NOT NULL,
  text_body TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
      `);
      return;
    }
    
    console.log('✅ email_templates table exists');
    
    // Check table structure
    console.log('\n2. Checking table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'email_templates'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nColumns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Count templates
    console.log('\n3. Counting templates...');
    const count = await client.query('SELECT COUNT(*) FROM email_templates');
    console.log(`   Total templates: ${count.rows[0].count}`);
    
    // List all templates
    if (parseInt(count.rows[0].count) > 0) {
      console.log('\n4. Listing all templates:');
      const templates = await client.query(`
        SELECT id, name, category, is_active, created_at
        FROM email_templates
        ORDER BY category, name
      `);
      
      templates.rows.forEach((t, i) => {
        console.log(`\n   ${i + 1}. ${t.name}`);
        console.log(`      ID: ${t.id}`);
        console.log(`      Category: ${t.category || 'N/A'}`);
        console.log(`      Active: ${t.is_active ? 'Yes' : 'No'}`);
        console.log(`      Created: ${t.created_at}`);
      });
    } else {
      console.log('\n❌ No templates found in database');
      console.log('\n💡 Solution: Run the seed script:');
      console.log('   node seed-email-templates.js');
    }
    
    // Check by category
    console.log('\n5. Templates by category:');
    const byCategory = await client.query(`
      SELECT category, COUNT(*) as count
      FROM email_templates
      GROUP BY category
      ORDER BY category
    `);
    
    if (byCategory.rows.length > 0) {
      byCategory.rows.forEach(cat => {
        console.log(`   - ${cat.category || 'Uncategorized'}: ${cat.count}`);
      });
    } else {
      console.log('   No templates to categorize');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Check complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkEmailTemplates();
