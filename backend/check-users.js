const { DataSource } = require('typeorm');
require('dotenv').config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
});

async function checkUsers() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();

    console.log('\n=== Checking Users ===');
    
    // Get all users
    const users = await dataSource.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u."tenantId",
        u."emailVerifiedAt",
        u."createdAt",
        t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON u."tenantId" = t.id
      ORDER BY u."createdAt" DESC
    `);

    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      console.log(`Found ${users.length} users:`);
      console.log('');
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Tenant: ${user.tenant_name || 'No tenant'}`);
        console.log(`   Email Verified: ${user.emailVerifiedAt ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // Check tenants
    console.log('\n=== Checking Tenants ===');
    const tenants = await dataSource.query(`
      SELECT 
        id,
        name,
        subdomain,
        type,
        status,
        "isActive",
        "createdAt"
      FROM tenants
      ORDER BY "createdAt" DESC
    `);

    if (tenants.length === 0) {
      console.log('No tenants found in database');
    } else {
      console.log(`Found ${tenants.length} tenants:`);
      console.log('');
      
      tenants.forEach((tenant, index) => {
        console.log(`${index + 1}. Name: ${tenant.name}`);
        console.log(`   Subdomain: ${tenant.subdomain || 'None'}`);
        console.log(`   Type: ${tenant.type}`);
        console.log(`   Status: ${tenant.status}`);
        console.log(`   Active: ${tenant.isActive}`);
        console.log(`   Created: ${tenant.createdAt}`);
        console.log('');
      });
    }

    await dataSource.destroy();
    console.log('User check completed!');
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

checkUsers();