#!/usr/bin/env node

/**
 * 🏢 COMPANY/TENANT DATABASE SEEDER
 * 
 * This script seeds the database with company/tenant data including:
 * - Multiple companies (tenants)
 * - Users associated with each company (cargo owners, truck owners)
 * - User profiles with company names
 * 
 * Run with: npm run seed:companies
 */

const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

const pool = new Pool(dbConfig);

// Helper function to generate UUID
function generateUUID() {
  return uuidv4();
}

// Company/Tenant data
const companies = [
  {
    name: 'Uruti-X Default',
    subdomain: 'default',
    type: 'ENTERPRISE',
    status: 'ACTIVE',
    description: 'Default system tenant for Uruti-X platform',
    contactEmail: 'admin@uruti-x.com',
    contactPhone: '+254-700-000-000',
    address: 'Tech Hub, Nairobi',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
  },
  {
    name: 'Kenya Transport Solutions',
    subdomain: 'kts',
    type: 'ENTERPRISE',
    status: 'ACTIVE',
    description: 'Leading logistics and transport company in East Africa',
    contactEmail: 'info@kts.co.ke',
    contactPhone: '+254-720-111-222',
    address: 'Mombasa Road, Industrial Area',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
  },
  {
    name: 'SafariLink Cargo',
    subdomain: 'safarilink',
    type: 'SMALL_BUSINESS',
    status: 'ACTIVE',
    description: 'Reliable cargo transport across Kenya and Tanzania',
    contactEmail: 'contact@safarilink.com',
    contactPhone: '+254-733-444-555',
    address: 'Airport North Road',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
  },
  {
    name: 'East Africa Freight Services',
    subdomain: 'eafs',
    type: 'PARTNER',
    status: 'ACTIVE',
    description: 'Cross-border freight and logistics solutions',
    contactEmail: 'support@eafs.co.ke',
    contactPhone: '+254-744-666-777',
    address: 'Port Road',
    city: 'Mombasa',
    state: 'Mombasa County',
    country: 'Kenya',
  },
  {
    name: 'Highland Transport Co',
    subdomain: 'highland',
    type: 'SMALL_BUSINESS',
    status: 'ACTIVE',
    description: 'Specialized in agricultural product transport',
    contactEmail: 'info@highland.co.ke',
    contactPhone: '+254-755-888-999',
    address: 'Nakuru-Eldoret Highway',
    city: 'Nakuru',
    state: 'Nakuru County',
    country: 'Kenya',
  },
];

// Users for each company
const companyUsers = [
  // Users for Uruti-X Default
  {
    companyIndex: 0,
    email: 'admin@uruti-x.com',
    phone: '+254700000001',
    role: 'CARGO_OWNER',
    firstName: 'Admin',
    lastName: 'User',
    companyName: 'Uruti-X Default',
  },
  // Users for Kenya Transport Solutions
  {
    companyIndex: 1,
    email: 'john.mwangi@kts.co.ke',
    phone: '+254720111223',
    role: 'CARGO_OWNER',
    firstName: 'John',
    lastName: 'Mwangi',
    companyName: 'Kenya Transport Solutions',
  },
  {
    companyIndex: 1,
    email: 'peter.ochieng@kts.co.ke',
    phone: '+254720111224',
    role: 'TRUCK_OWNER',
    firstName: 'Peter',
    lastName: 'Ochieng',
    companyName: 'Kenya Transport Solutions',
  },
  // Users for SafariLink Cargo
  {
    companyIndex: 2,
    email: 'mary.wanjiku@safarilink.com',
    phone: '+254733444556',
    role: 'CARGO_OWNER',
    firstName: 'Mary',
    lastName: 'Wanjiku',
    companyName: 'SafariLink Cargo',
  },
  {
    companyIndex: 2,
    email: 'james.kamau@safarilink.com',
    phone: '+254733444557',
    role: 'TRUCK_OWNER',
    firstName: 'James',
    lastName: 'Kamau',
    companyName: 'SafariLink Cargo',
  },
  // Users for East Africa Freight Services
  {
    companyIndex: 3,
    email: 'sarah.njeri@eafs.co.ke',
    phone: '+254744666778',
    role: 'CARGO_OWNER',
    firstName: 'Sarah',
    lastName: 'Njeri',
    companyName: 'East Africa Freight Services',
  },
  {
    companyIndex: 3,
    email: 'david.otieno@eafs.co.ke',
    phone: '+254744666779',
    role: 'TRUCK_OWNER',
    firstName: 'David',
    lastName: 'Otieno',
    companyName: 'East Africa Freight Services',
  },
  // Users for Highland Transport Co
  {
    companyIndex: 4,
    email: 'grace.akinyi@highland.co.ke',
    phone: '+254755889000',
    role: 'CARGO_OWNER',
    firstName: 'Grace',
    lastName: 'Akinyi',
    companyName: 'Highland Transport Co',
  },
  {
    companyIndex: 4,
    email: 'patrick.kipchoge@highland.co.ke',
    phone: '+254755889001',
    role: 'TRUCK_OWNER',
    firstName: 'Patrick',
    lastName: 'Kipchoge',
    companyName: 'Highland Transport Co',
  },
];

async function getOrCreateTenant(company) {
  // Check if tenant already exists
  const existing = await pool.query(
    'SELECT id FROM tenants WHERE subdomain = $1',
    [company.subdomain]
  );
  
  if (existing.rows.length > 0) {
    console.log(`  ℹ️  Company "${company.name}" already exists, skipping...`);
    return existing.rows[0].id;
  }
  
  const tenantId = generateUUID();
  
  await pool.query(`
    INSERT INTO tenants (
      id, name, subdomain, type, status, description,
      "contactEmail", "contactPhone", address, city, state, country,
      "isActive", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
  `, [
    tenantId,
    company.name,
    company.subdomain,
    company.type,
    company.status,
    company.description,
    company.contactEmail,
    company.contactPhone,
    company.address,
    company.city,
    company.state,
    company.country,
    true
  ]);
  
  console.log(`  ✅ Created company: ${company.name}`);
  return tenantId;
}

async function getOrCreateUser(email, phone, role, tenantId, firstName, lastName, companyName) {
  // Check if user already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  
  if (existing.rows.length > 0) {
    console.log(`    ℹ️  User ${email} already exists, skipping...`);
    return existing.rows[0].id;
  }
  
  const userId = generateUUID();
  const passwordHash = await bcrypt.hash('test123', 10);
  
  await pool.query(`
    INSERT INTO users (
      id, email, phone, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
  `, [userId, email, phone, passwordHash, role, 'ACTIVE', tenantId]);
  
  // Create profile
  const profileId = generateUUID();
  await pool.query(`
    INSERT INTO user_profiles (
      id, "userId", "tenantId", "firstName", "lastName", "companyName", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
  `, [profileId, userId, tenantId, firstName, lastName, companyName]);
  
  console.log(`    ✅ Created user: ${firstName} ${lastName} (${role}) - ${companyName}`);
  return userId;
}

async function seedCompanies() {
  console.log('🏢 Starting Company/Tenant Database Seeding...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    const tenantIds = [];
    
    // Step 1: Create Companies (Tenants)
    console.log('🏢 Creating companies/tenants...\n');
    
    for (const company of companies) {
      const tenantId = await getOrCreateTenant(company);
      tenantIds.push(tenantId);
    }
    
    console.log(`\n✅ Total companies processed: ${companies.length}\n`);
    
    // Step 2: Create Users for each company
    console.log('👥 Creating users for companies...\n');
    
    let userCount = 0;
    for (const user of companyUsers) {
      const tenantId = tenantIds[user.companyIndex];
      
      if (tenantId) {
        await getOrCreateUser(
          user.email,
          user.phone,
          user.role,
          tenantId,
          user.firstName,
          user.lastName,
          user.companyName
        );
        userCount++;
      }
    }
    
    console.log(`\n✅ Total users processed: ${userCount}\n`);
    
    // Summary
    console.log('\n✅ Company seeding finished successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Companies/Tenants: ${companies.length}`);
    console.log(`   - Users: ${userCount}`);
    console.log('\n🔑 All users have password: test123');
    console.log('\n🎉 All company data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  seedCompanies()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCompanies };

