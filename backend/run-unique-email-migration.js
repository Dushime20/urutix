const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log('🚀 Running unique email constraint migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '017_add_unique_constraint_tenant_email.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Run the migration
    console.log('📝 Executing migration...');
    await pool.query(migrationSQL);
    
    console.log('\n✅ Migration completed successfully!');
    
    // Check for any remaining duplicates (should be marked now)
    const checkQuery = `
      SELECT "contactEmail", COUNT(*) as count
      FROM tenants
      WHERE "contactEmail" LIKE '%_duplicate_%'
      GROUP BY "contactEmail"
      ORDER BY count DESC;
    `;
    
    const result = await pool.query(checkQuery);
    
    if (result.rows.length > 0) {
      console.log('\n⚠️  Marked duplicate emails (need manual review):');
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.contactEmail} (${row.count} tenant(s))`);
      });
      console.log('\n💡 These tenants have been marked with _duplicate_<id> suffix');
      console.log('   Please review and update them with correct emails');
    } else {
      console.log('\n✅ No duplicate emails found');
    }

    // Verify the constraint was added
    const constraintCheck = `
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'tenants'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'unique_tenant_contact_email';
    `;
    
    const constraintResult = await pool.query(constraintCheck);
    
    if (constraintResult.rows.length > 0) {
      console.log('\n✅ Unique constraint successfully added to tenants.contactEmail');
    } else {
      console.log('\n❌ Warning: Unique constraint was not added');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
