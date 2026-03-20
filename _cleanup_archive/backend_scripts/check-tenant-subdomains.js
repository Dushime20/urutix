const { Pool } = require('pg');
require('dotenv').config();

async function checkTenantSubdomains() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('='.repeat(60));
    console.log('TENANT SUBDOMAIN CONFIGURATION CHECK');
    console.log('='.repeat(60));
    console.log();

    // Check all tenants
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        subdomain, 
        status,
        type,
        "createdAt"
      FROM tenants 
      WHERE deleted_at IS NULL
      ORDER BY "createdAt" DESC
    `);

    console.log(`Found ${result.rows.length} tenants:\n`);

    const withSubdomain = [];
    const withoutSubdomain = [];

    result.rows.forEach(tenant => {
      if (tenant.subdomain) {
        withSubdomain.push(tenant);
      } else {
        withoutSubdomain.push(tenant);
      }
    });

    // Show tenants with subdomains
    if (withSubdomain.length > 0) {
      console.log('✅ Tenants WITH subdomains configured:');
      console.log('-'.repeat(60));
      withSubdomain.forEach(tenant => {
        console.log(`  ${tenant.name}`);
        console.log(`    Subdomain: ${tenant.subdomain}`);
        console.log(`    Status: ${tenant.status}`);
        console.log(`    Type: ${tenant.type}`);
        console.log(`    URL: http://${tenant.subdomain}.localhost:5173`);
        console.log();
      });
    }

    // Show tenants without subdomains
    if (withoutSubdomain.length > 0) {
      console.log('⚠️  Tenants WITHOUT subdomains:');
      console.log('-'.repeat(60));
      withoutSubdomain.forEach(tenant => {
        console.log(`  ${tenant.name} (ID: ${tenant.id})`);
        console.log(`    Status: ${tenant.status}`);
        console.log(`    Type: ${tenant.type}`);
        
        // Suggest subdomain based on name
        const suggestedSubdomain = tenant.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        console.log(`    Suggested subdomain: ${suggestedSubdomain}`);
        console.log();
      });

      console.log('\nTo add subdomains, run:');
      console.log('node add-tenant-subdomains.js');
    }

    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tenants: ${result.rows.length}`);
    console.log(`With subdomains: ${withSubdomain.length}`);
    console.log(`Without subdomains: ${withoutSubdomain.length}`);
    console.log();

    if (withSubdomain.length > 0) {
      console.log('LOCAL TESTING SETUP:');
      console.log('-'.repeat(60));
      console.log('Add these lines to your hosts file:');
      console.log('Windows: C:\\Windows\\System32\\drivers\\etc\\hosts');
      console.log('Mac/Linux: /etc/hosts');
      console.log();
      withSubdomain.forEach(tenant => {
        console.log(`127.0.0.1 ${tenant.subdomain}.localhost`);
      });
      console.log();
      console.log('Then access:');
      withSubdomain.forEach(tenant => {
        console.log(`http://${tenant.subdomain}.localhost:5173`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTenantSubdomains();
