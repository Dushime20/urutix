const { Pool } = require('pg');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addTenantSubdomains() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('='.repeat(60));
    console.log('ADD TENANT SUBDOMAINS');
    console.log('='.repeat(60));
    console.log();

    // Get tenants without subdomains
    const result = await pool.query(`
      SELECT id, name, subdomain, status
      FROM tenants 
      WHERE deleted_at IS NULL AND (subdomain IS NULL OR subdomain = '')
      ORDER BY name
    `);

    if (result.rows.length === 0) {
      console.log('✅ All tenants already have subdomains configured!');
      rl.close();
      await pool.end();
      return;
    }

    console.log(`Found ${result.rows.length} tenants without subdomains:\n`);

    for (const tenant of result.rows) {
      console.log(`\nTenant: ${tenant.name} (${tenant.status})`);
      
      // Suggest subdomain
      const suggestedSubdomain = tenant.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const answer = await question(`  Enter subdomain [${suggestedSubdomain}]: `);
      const subdomain = answer.trim() || suggestedSubdomain;
      
      // Validate subdomain
      if (!/^[a-z0-9-]+$/.test(subdomain)) {
        console.log('  ❌ Invalid subdomain. Must contain only lowercase letters, numbers, and hyphens.');
        continue;
      }

      // Check if subdomain already exists
      const existingCheck = await pool.query(
        'SELECT id, name FROM tenants WHERE subdomain = $1 AND id != $2',
        [subdomain, tenant.id]
      );

      if (existingCheck.rows.length > 0) {
        console.log(`  ❌ Subdomain "${subdomain}" is already used by ${existingCheck.rows[0].name}`);
        continue;
      }

      // Update tenant
      await pool.query(
        'UPDATE tenants SET subdomain = $1, updated_at = NOW() WHERE id = $2',
        [subdomain, tenant.id]
      );

      console.log(`  ✅ Set subdomain: ${subdomain}`);
      console.log(`     Access at: http://${subdomain}.localhost:5173`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nRun this to see all configured subdomains:');
    console.log('node check-tenant-subdomains.js');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

addTenantSubdomains();
