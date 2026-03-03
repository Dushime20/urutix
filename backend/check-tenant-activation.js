const { DataSource } = require('typeorm');
require('dotenv').config();

async function checkTenantActivation() {
  const tenantId = 'f3276ef3-068b-4875-81bb-de53e26cc0fe';
  
  console.log('🔍 Checking tenant activation requirements...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'urutix',
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    // Check tenant details
    const tenant = await dataSource.query(
      'SELECT id, name, subdomain, domain, "contactEmail", status, "isActive", "activatedAt" FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenant.length === 0) {
      console.log('❌ Tenant not found!');
      return;
    }

    console.log('📋 Tenant Details:');
    console.log(JSON.stringify(tenant[0], null, 2));
    console.log('');

    // Check validation requirements
    const validationErrors = [];
    const t = tenant[0];

    if (!t.name || t.name.trim().length === 0) {
      validationErrors.push('❌ Tenant name is missing or empty');
    } else {
      console.log('✅ Tenant name:', t.name);
    }

    if (!t.subdomain || t.subdomain.trim().length === 0) {
      validationErrors.push('❌ Tenant subdomain is missing or empty');
    } else {
      console.log('✅ Tenant subdomain:', t.subdomain);
    }

    if (!t.contactEmail || t.contactEmail.trim().length === 0) {
      validationErrors.push('❌ Contact email is missing or empty');
    } else {
      console.log('✅ Contact email:', t.contactEmail);
    }

    if (!t.domain || t.domain.trim().length === 0) {
      validationErrors.push('❌ Tenant domain is missing or empty');
    } else {
      console.log('✅ Tenant domain:', t.domain);
    }

    if (t.status === 'DEACTIVATED') {
      validationErrors.push('❌ Tenant is deactivated');
    } else {
      console.log('✅ Tenant status:', t.status);
    }

    console.log('');

    // Check admin users
    const adminUsers = await dataSource.query(
      `SELECT id, email, role, status FROM users WHERE "tenantId" = $1 AND role = 'TENANT_ADMIN'`,
      [tenantId]
    );

    if (adminUsers.length === 0) {
      validationErrors.push('❌ No admin users found for this tenant');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role}, ${user.status})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    
    if (validationErrors.length > 0) {
      console.log('\n❌ VALIDATION FAILED - Cannot activate tenant:');
      validationErrors.forEach(error => console.log(`   ${error}`));
      console.log('\n💡 Fix these issues before activating the tenant.');
    } else {
      console.log('\n✅ ALL VALIDATION CHECKS PASSED');
      console.log('   Tenant can be activated successfully.');
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

checkTenantActivation();
