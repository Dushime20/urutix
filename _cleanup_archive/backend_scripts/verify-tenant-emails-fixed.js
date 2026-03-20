const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyFix() {
  console.log('✅ Verifying Tenant Email Fix\n');

  try {
    // Check for any remaining duplicates
    const duplicateCheck = `
      SELECT "contactEmail", COUNT(*) as count
      FROM tenants
      WHERE "contactEmail" IS NOT NULL 
      AND "contactEmail" != ''
      AND "contactEmail" NOT LIKE '%_duplicate_%'
      GROUP BY "contactEmail"
      HAVING COUNT(*) > 1;
    `;

    const duplicates = await pool.query(duplicateCheck);

    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicate emails found (excluding marked duplicates)');
    } else {
      console.log('❌ Still have duplicates:');
      duplicates.rows.forEach(row => {
        console.log(`   - ${row.contactEmail}: ${row.count} tenants`);
      });
    }

    // Check constraint exists
    const constraintCheck = `
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'tenants'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'unique_tenant_contact_email';
    `;

    const constraint = await pool.query(constraintCheck);

    if (constraint.rows.length > 0) {
      console.log('✅ Unique constraint is in place');
    } else {
      console.log('❌ Unique constraint not found');
    }

    // Count active tenants
    const activeCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM tenants
      WHERE status = 'ACTIVE'
      AND ("contactEmail" IS NULL OR "contactEmail" NOT LIKE '%_duplicate_%');
    `);

    console.log(`\n📊 Active tenants (excluding duplicates): ${activeCount.rows[0].count}`);

    // Count marked duplicates
    const markedCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM tenants
      WHERE "contactEmail" LIKE '%_duplicate_%';
    `);

    console.log(`⚠️  Marked duplicates (need review): ${markedCount.rows[0].count}`);

    // Show clean tenants
    const cleanTenants = await pool.query(`
      SELECT id, name, "contactEmail", status
      FROM tenants
      WHERE "contactEmail" IS NOT NULL
      AND "contactEmail" NOT LIKE '%_duplicate_%'
      ORDER BY name;
    `);

    console.log('\n📋 Clean Tenants:');
    cleanTenants.rows.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} - ${tenant.contactEmail} [${tenant.status}]`);
    });

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyFix();
