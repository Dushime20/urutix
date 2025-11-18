#!/usr/bin/env node

/**
 * 🏢 TENANT DATABASE SEEDER
 * 
 * This script populates the database with comprehensive tenant data
 * for testing multi-tenant functionality in the Uruti-X platform.
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

// Tenant seed data
const tenantData = [
  {
    name: 'Uruti-X Default',
    subdomain: 'default',
    domain: null,
    type: 'ENTERPRISE',
    status: 'ACTIVE',
    description: 'Default system tenant for Uruti-X platform',
    logoUrl: null,
    websiteUrl: 'https://uruti-x.com',
    contactEmail: 'admin@uruti-x.com',
    contactPhone: '+254-700-000-000',
    address: 'Tech Hub, Nairobi',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    postalCode: '00100',
    taxId: 'KRA-001-DEFAULT',
    businessLicense: 'BL-DEFAULT-001',
    settings: {
      timezone: 'Africa/Nairobi',
      currency: 'KES',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    },
    features: {
      loads: true,
      tracking: true,
      payments: true,
      analytics: true,
      api_access: true,
      multi_user: true,
      fleet_management: true,
      document_management: true,
      insurance_management: true,
      loan_management: true
    },
    billingInfo: {
      plan: 'enterprise',
      billing_cycle: 'annual',
      payment_method: 'bank_transfer'
    },
    maxUsers: null, // unlimited
    maxTrucks: null, // unlimited
    maxDrivers: null, // unlimited
    maxLoadsPerMonth: null, // unlimited
    subscriptionPlan: 'ENTERPRISE',
    subscriptionExpiresAt: new Date('2025-12-31'),
    trialEndsAt: null,
    isActive: true,
    activatedAt: new Date('2024-01-01')
  },
  {
    name: 'Kenya Transport Solutions',
    subdomain: 'kts',
    domain: 'transport.kts.co.ke',
    type: 'ENTERPRISE',
    status: 'ACTIVE',
    description: 'Leading logistics and transport company in East Africa',
    logoUrl: 'https://storage.uruti-x.com/logos/kts-logo.png',
    websiteUrl: 'https://kts.co.ke',
    contactEmail: 'operations@kts.co.ke',
    contactPhone: '+254-722-123-456',
    address: 'Industrial Area, Mombasa Road',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    postalCode: '00100',
    taxId: 'KRA-P051234567A',
    businessLicense: 'BL-NAI-2023-001',
    settings: {
      timezone: 'Africa/Nairobi',
      currency: 'KES',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      branding: {
        primary_color: '#1E40AF',
        secondary_color: '#F59E0B'
      }
    },
    features: {
      loads: true,
      tracking: true,
      payments: true,
      analytics: true,
      api_access: true,
      multi_user: true,
      fleet_management: true,
      document_management: true,
      insurance_management: true,
      loan_management: false
    },
    billingInfo: {
      plan: 'enterprise',
      billing_cycle: 'monthly',
      payment_method: 'mpesa'
    },
    maxUsers: 100,
    maxTrucks: 50,
    maxDrivers: 75,
    maxLoadsPerMonth: 1000,
    subscriptionPlan: 'ENTERPRISE',
    subscriptionExpiresAt: new Date('2024-12-31'),
    trialEndsAt: null,
    isActive: true,
    activatedAt: new Date('2024-02-15')
  },
  {
    name: 'Mombasa Freight Services',
    subdomain: 'mfs',
    domain: null,
    type: 'SMALL_BUSINESS',
    status: 'ACTIVE',
    description: 'Coastal freight and cargo handling specialists',
    logoUrl: null,
    websiteUrl: 'https://mfs-freight.com',
    contactEmail: 'info@mfs-freight.com',
    contactPhone: '+254-733-987-654',
    address: 'Port Reitz, Mombasa',
    city: 'Mombasa',
    state: 'Mombasa County',
    country: 'Kenya',
    postalCode: '80100',
    taxId: 'KRA-P051987654B',
    businessLicense: 'BL-MSA-2023-045',
    settings: {
      timezone: 'Africa/Nairobi',
      currency: 'KES',
      language: 'sw', // Swahili
      dateFormat: 'DD/MM/YYYY',
      notifications: {
        email: true,
        sms: true,
        push: false
      }
    },
    features: {
      loads: true,
      tracking: true,
      payments: true,
      analytics: false,
      api_access: false,
      multi_user: true,
      fleet_management: true,
      document_management: false,
      insurance_management: false,
      loan_management: false
    },
    billingInfo: {
      plan: 'business',
      billing_cycle: 'monthly',
      payment_method: 'bank_transfer'
    },
    maxUsers: 25,
    maxTrucks: 15,
    maxDrivers: 20,
    maxLoadsPerMonth: 200,
    subscriptionPlan: 'BUSINESS',
    subscriptionExpiresAt: new Date('2024-11-30'),
    trialEndsAt: null,
    isActive: true,
    activatedAt: new Date('2024-03-01')
  },
  {
    name: 'Kampala Express Logistics',
    subdomain: 'kel',
    domain: 'logistics.kel.ug',
    type: 'SMALL_BUSINESS',
    status: 'ACTIVE',
    description: 'Cross-border transport between Kenya and Uganda',
    logoUrl: 'https://storage.uruti-x.com/logos/kel-logo.png',
    websiteUrl: 'https://kel.ug',
    contactEmail: 'dispatch@kel.ug',
    contactPhone: '+256-700-123-789',
    address: 'Nakawa Industrial Area',
    city: 'Kampala',
    state: 'Central Region',
    country: 'Uganda',
    postalCode: 'P.O. Box 12345',
    taxId: 'URA-TIN-123456789',
    businessLicense: 'BL-KLA-2023-089',
    settings: {
      timezone: 'Africa/Kampala',
      currency: 'UGX',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    },
    features: {
      loads: true,
      tracking: true,
      payments: true,
      analytics: true,
      api_access: false,
      multi_user: true,
      fleet_management: true,
      document_management: true,
      insurance_management: false,
      loan_management: false
    },
    billingInfo: {
      plan: 'business',
      billing_cycle: 'quarterly',
      payment_method: 'mobile_money'
    },
    maxUsers: 30,
    maxTrucks: 20,
    maxDrivers: 25,
    maxLoadsPerMonth: 300,
    subscriptionPlan: 'BUSINESS',
    subscriptionExpiresAt: new Date('2024-09-30'),
    trialEndsAt: null,
    isActive: true,
    activatedAt: new Date('2024-01-15')
  },
  {
    name: 'StartUp Logistics',
    subdomain: 'startup',
    domain: null,
    type: 'INDIVIDUAL',
    status: 'ACTIVE',
    description: 'Individual entrepreneur starting logistics business',
    logoUrl: null,
    websiteUrl: null,
    contactEmail: 'owner@startup-logistics.com',
    contactPhone: '+254-712-345-678',
    address: 'Kasarani, Nairobi',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    postalCode: '00618',
    taxId: null,
    businessLicense: null,
    settings: {
      timezone: 'Africa/Nairobi',
      currency: 'KES',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    },
    features: {
      loads: true,
      tracking: true,
      payments: false,
      analytics: false,
      api_access: false,
      multi_user: false,
      fleet_management: true,
      document_management: false,
      insurance_management: false,
      loan_management: false
    },
    billingInfo: {
      plan: 'starter',
      billing_cycle: 'monthly',
      payment_method: 'mpesa'
    },
    maxUsers: 5,
    maxTrucks: 3,
    maxDrivers: 3,
    maxLoadsPerMonth: 50,
    subscriptionPlan: 'STARTER',
    subscriptionExpiresAt: new Date('2024-08-15'),
    trialEndsAt: new Date('2024-07-15'),
    isActive: true,
    activatedAt: new Date('2024-06-15')
  },
  {
    name: 'Demo Company',
    subdomain: 'demo',
    domain: null,
    type: 'SMALL_BUSINESS',
    status: 'PENDING_ACTIVATION',
    description: 'Demo tenant for testing and demonstrations',
    logoUrl: null,
    websiteUrl: null,
    contactEmail: 'demo@uruti-x.com',
    contactPhone: '+254-700-000-001',
    address: 'Demo Address',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    postalCode: '00100',
    taxId: null,
    businessLicense: null,
    settings: {
      timezone: 'Africa/Nairobi',
      currency: 'KES',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    },
    features: {
      loads: true,
      tracking: true,
      payments: true,
      analytics: true,
      api_access: false,
      multi_user: true,
      fleet_management: true,
      document_management: true,
      insurance_management: true,
      loan_management: true
    },
    billingInfo: {
      plan: 'trial',
      billing_cycle: 'monthly',
      payment_method: null
    },
    maxUsers: 10,
    maxTrucks: 5,
    maxDrivers: 8,
    maxLoadsPerMonth: 100,
    subscriptionPlan: 'TRIAL',
    subscriptionExpiresAt: null,
    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: false,
    activatedAt: null
  }
];

async function seedTenants() {
  console.log('🏢 Starting Tenant Database Seeding...\n');
  
  const pool = new Pool(dbConfig);
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');
    
    // Check if tenants table exists
    console.log('🔍 Checking tenants table...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tenants'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      throw new Error('Tenants table does not exist. Please run migrations first.');
    }
    console.log('✅ Tenants table found!\n');
    
    // Clear existing demo data (optional)
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      console.log('🗑️  Clearing existing tenant data...');
      await pool.query('DELETE FROM tenants WHERE subdomain IN ($1, $2, $3, $4, $5, $6)', 
        ['default', 'kts', 'mfs', 'kel', 'startup', 'demo']);
      console.log('✅ Existing data cleared!\n');
    }
    
    // Insert tenants
    console.log('🏢 Creating tenants...');
    const createdTenants = [];
    
    for (const tenant of tenantData) {
      try {
        // First check if tenant exists
        const existingTenant = await pool.query(`
          SELECT id, name, subdomain, status FROM tenants WHERE subdomain = $1
        `, [tenant.subdomain]);
        
        let result;
        if (existingTenant.rows.length > 0) {
          // Update existing tenant
          result = await pool.query(`
            UPDATE tenants SET
              name = $1,
              domain = $2,
              type = $3,
              status = $4,
              description = $5,
              "logoUrl" = $6,
              "websiteUrl" = $7,
              "contactEmail" = $8,
              "contactPhone" = $9,
              address = $10,
              city = $11,
              state = $12,
              country = $13,
              "postalCode" = $14,
              "taxId" = $15,
              "businessLicense" = $16,
              settings = $17,
              features = $18,
              "billingInfo" = $19,
              "maxUsers" = $20,
              "maxTrucks" = $21,
              "maxDrivers" = $22,
              "maxLoadsPerMonth" = $23,
              "subscriptionPlan" = $24,
              "subscriptionExpiresAt" = $25,
              "trialEndsAt" = $26,
              "isActive" = $27,
              "activatedAt" = $28,
              "updatedAt" = NOW()
            WHERE subdomain = $29
            RETURNING id, name, subdomain, status
          `, [
            tenant.name, tenant.domain, tenant.type, tenant.status, tenant.description,
            tenant.logoUrl, tenant.websiteUrl, tenant.contactEmail, tenant.contactPhone,
            tenant.address, tenant.city, tenant.state, tenant.country, tenant.postalCode, tenant.taxId, tenant.businessLicense,
            JSON.stringify(tenant.settings), JSON.stringify(tenant.features), JSON.stringify(tenant.billingInfo),
            tenant.maxUsers, tenant.maxTrucks, tenant.maxDrivers, tenant.maxLoadsPerMonth,
            tenant.subscriptionPlan, tenant.subscriptionExpiresAt, tenant.trialEndsAt,
            tenant.isActive, tenant.activatedAt, tenant.subdomain
          ]);
        } else {
          // Insert new tenant
          result = await pool.query(`
            INSERT INTO tenants (
              id, name, subdomain, domain, type, status, description,
              "logoUrl", "websiteUrl", "contactEmail", "contactPhone",
              address, city, state, country, "postalCode", "taxId", "businessLicense",
              settings, features, "billingInfo",
              "maxUsers", "maxTrucks", "maxDrivers", "maxLoadsPerMonth",
              "subscriptionPlan", "subscriptionExpiresAt", "trialEndsAt",
              "isActive", "activatedAt", "suspendedAt", "suspendedReason",
              "createdAt", "updatedAt"
            )
            VALUES (
              gen_random_uuid(), $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10,
              $11, $12, $13, $14, $15, $16, $17,
              $18, $19, $20,
              $21, $22, $23, $24,
              $25, $26, $27,
              $28, $29, $30, $31,
              NOW(), NOW()
            )
            RETURNING id, name, subdomain, status
          `, [
            tenant.name, tenant.subdomain, tenant.domain, tenant.type, tenant.status, tenant.description,
            tenant.logoUrl, tenant.websiteUrl, tenant.contactEmail, tenant.contactPhone,
            tenant.address, tenant.city, tenant.state, tenant.country, tenant.postalCode, tenant.taxId, tenant.businessLicense,
            JSON.stringify(tenant.settings), JSON.stringify(tenant.features), JSON.stringify(tenant.billingInfo),
            tenant.maxUsers, tenant.maxTrucks, tenant.maxDrivers, tenant.maxLoadsPerMonth,
            tenant.subscriptionPlan, tenant.subscriptionExpiresAt, tenant.trialEndsAt,
            tenant.isActive, tenant.activatedAt, tenant.suspendedAt, tenant.suspendedReason
          ]);
        }
        
        if (result.rows.length > 0) {
          const created = result.rows[0];
          createdTenants.push(created);
          console.log(`✅ Created/Updated tenant: ${created.name} (${created.subdomain}) - ${created.status}`);
        }
        
      } catch (error) {
        console.error(`❌ Error creating tenant ${tenant.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully processed ${createdTenants.length} tenants!\n`);
    
    // Display summary
    console.log('📊 Tenant Summary:');
    console.log('==================');
    
    const statusCounts = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM tenants 
      WHERE deleted_at IS NULL
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    statusCounts.rows.forEach(row => {
      console.log(`${row.status}: ${row.count} tenants`);
    });
    
    console.log('\n🔗 Access URLs:');
    console.log('===============');
    
    for (const tenant of createdTenants) {
      if (tenant.subdomain && tenant.status === 'ACTIVE') {
        console.log(`• ${tenant.name}: https://${tenant.subdomain}.uruti-x.com`);
      }
    }
    
    console.log('\n✅ Tenant seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during tenant seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeder
if (require.main === module) {
  seedTenants().catch(console.error);
}

module.exports = { seedTenants, tenantData };
