const { Client } = require('pg');
require('dotenv').config();

const companies = [
  {
    name: 'Swift Logistics Ltd',
    subdomain: 'swiftlogistics',
    type: 'ENTERPRISE',
    description: 'Leading logistics and freight forwarding company in East Africa',
    contactEmail: 'info@swiftlogistics.co.ke',
    contactPhone: '+254-722-100-200',
    address: 'Mombasa Road, Industrial Area',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    postalCode: '00100',
    websiteUrl: 'https://swiftlogistics.co.ke',
    adminUser: {
      email: 'admin@swiftlogistics.co.ke',
      phone: '+254722100200',
      firstName: 'John',
      lastName: 'Kamau',
      password: 'Swift@2024'
    }
  },
  {
    name: 'TransAfrica Cargo Services',
    subdomain: 'transafrica',
    type: 'ENTERPRISE',
    description: 'Pan-African cargo and transportation solutions provider',
    contactEmail: 'contact@transafrica.com',
    contactPhone: '+254-733-200-300',
    address: 'Uhuru Highway, Westlands',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    postalCode: '00100',
    websiteUrl: 'https://transafrica.com',
    adminUser: {
      email: 'admin@transafrica.com',
      phone: '+254733200300',
      firstName: 'Sarah',
      lastName: 'Mwangi',
      password: 'Trans@2024'
    }
  },
  {
    name: 'EastLink Transport Co.',
    subdomain: 'eastlink',
    type: 'SMALL_BUSINESS',
    description: 'Reliable regional transport and delivery services',
    contactEmail: 'info@eastlink.co.ke',
    contactPhone: '+254-711-300-400',
    address: 'Jogoo Road, Makadara',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    postalCode: '00100',
    websiteUrl: 'https://eastlink.co.ke',
    adminUser: {
      email: 'admin@eastlink.co.ke',
      phone: '+254711300400',
      firstName: 'David',
      lastName: 'Ochieng',
      password: 'East@2024'
    }
  }
];

async function seedCompanies() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log(`📊 Database: ${process.env.DB_NAME || 'urutix'} on port ${process.env.DB_PORT || 5432}`);
    console.log('');

    for (const company of companies) {
      console.log(`\n🏢 Processing: ${company.name}`);
      console.log('─'.repeat(60));

      // Check if tenant already exists
      const tenantCheck = await client.query(
        'SELECT id FROM tenants WHERE subdomain = $1',
        [company.subdomain]
      );

      let tenantId;

      if (tenantCheck.rows.length > 0) {
        tenantId = tenantCheck.rows[0].id;
        console.log(`⚠️  Tenant already exists with ID: ${tenantId}`);
      } else {
        // Create tenant
        const tenantResult = await client.query(
          `INSERT INTO tenants (
            id, name, subdomain, type, status, description,
            "contactEmail", "contactPhone", address, city, state, country,
            "postalCode", "websiteUrl", "isActive", "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, 'ACTIVE', $4,
            $5, $6, $7, $8, $9, $10,
            $11, $12, true, NOW(), NOW()
          ) RETURNING id`,
          [
            company.name,
            company.subdomain,
            company.type,
            company.description,
            company.contactEmail,
            company.contactPhone,
            company.address,
            company.city,
            company.state,
            company.country,
            company.postalCode,
            company.websiteUrl
          ]
        );

        tenantId = tenantResult.rows[0].id;
        console.log(`✅ Created tenant with ID: ${tenantId}`);
      }

      // Check if admin user already exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [company.adminUser.email]
      );

      let userId;

      if (userCheck.rows.length > 0) {
        userId = userCheck.rows[0].id;
        console.log(`⚠️  Admin user already exists with ID: ${userId}`);
      } else {
        // Create admin user
        const userResult = await client.query(
          `INSERT INTO users (
            id, email, phone, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2,
            crypt($3, gen_salt('bf')), 'TENANT_ADMIN', 'ACTIVE',
            $4, NOW(), NOW()
          ) RETURNING id`,
          [
            company.adminUser.email,
            company.adminUser.phone,
            company.adminUser.password,
            tenantId
          ]
        );

        userId = userResult.rows[0].id;
        console.log(`✅ Created admin user with ID: ${userId}`);

        // Create user profile
        await client.query(
          `INSERT INTO user_profiles (
            id, "userId", "tenantId", "firstName", "lastName", "companyName", "createdAt", "updatedAt"
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), NOW()
          )`,
          [
            userId,
            tenantId,
            company.adminUser.firstName,
            company.adminUser.lastName,
            company.name
          ]
        );

        console.log(`✅ Created user profile`);
      }

      console.log('');
      console.log(`📧 Email: ${company.adminUser.email}`);
      console.log(`🔑 Password: ${company.adminUser.password}`);
      console.log(`🌐 Subdomain: ${company.subdomain}`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ All companies seeded successfully!');
    console.log('═'.repeat(60));
    console.log('\n📋 Summary of Companies:\n');

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   Subdomain: ${company.subdomain}`);
      console.log(`   Type: ${company.type}`);
      console.log(`   Email: ${company.adminUser.email}`);
      console.log(`   Password: ${company.adminUser.password}`);
      console.log('');
    });

    console.log('💡 Users can now register as cargo owners or truck owners');
    console.log('   and select one of these companies during registration.');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding companies:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

// Run the seed function
seedCompanies();
