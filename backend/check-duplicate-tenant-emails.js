const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDuplicateEmails() {
  console.log('🔍 Checking for duplicate tenant emails...\n');

  try {
    // Check for duplicate emails in tenants table
    const duplicateEmailsQuery = `
      SELECT 
        "contactEmail",
        COUNT(*) as count,
        array_agg(id) as tenant_ids,
        array_agg(name) as tenant_names,
        array_agg(status) as statuses
      FROM tenants
      WHERE "contactEmail" IS NOT NULL AND "contactEmail" != ''
      GROUP BY "contactEmail"
      HAVING COUNT(*) > 1
      ORDER BY count DESC;
    `;

    const result = await pool.query(duplicateEmailsQuery);

    if (result.rows.length === 0) {
      console.log('✅ No duplicate emails found in tenants table');
    } else {
      console.log(`❌ Found ${result.rows.length} duplicate emails:\n`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. Email: ${row.contactEmail}`);
        console.log(`   Count: ${row.count}`);
        console.log(`   Tenant IDs: ${JSON.stringify(row.tenant_ids)}`);
        console.log(`   Tenant Names: ${JSON.stringify(row.tenant_names)}`);
        console.log(`   Statuses: ${JSON.stringify(row.statuses)}`);
        console.log('');
      });
    }

    // Check total tenants
    const totalQuery = 'SELECT COUNT(*) as total FROM tenants';
    const totalResult = await pool.query(totalQuery);
    console.log(`\n📊 Total tenants in database: ${totalResult.rows[0].total}`);

    // Check tenants with same email
    const allTenantsQuery = `
      SELECT id, name, subdomain, "contactEmail", status, created_at
      FROM tenants
      ORDER BY "contactEmail", created_at;
    `;
    const allTenants = await pool.query(allTenantsQuery);
    
    console.log('\n📋 All tenants grouped by email:');
    let currentEmail = null;
    allTenants.rows.forEach(tenant => {
      if (tenant.contactEmail !== currentEmail) {
        currentEmail = tenant.contactEmail;
        console.log(`\n📧 ${currentEmail || 'NO EMAIL'}:`);
      }
      console.log(`   - ${tenant.name} (${tenant.subdomain}) [${tenant.status}] - ${tenant.id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDuplicateEmails();
