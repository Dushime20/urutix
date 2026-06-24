#!/usr/bin/env node
/**
 * Seed contact settings into the database
 * Run with: node seed-contact-settings.js
 * Or in Docker: docker-compose exec backend node seed-contact-settings.js
 */

const { Client } = require('pg');

// Database configuration from environment or defaults
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

console.log('🔌 Connecting to database:', config.database);

const client = new Client(config);

// Contact settings to seed
const contactSettings = [
  {
    category: 'contact',
    key: 'phone',
    value: '+250788309463',
    dataType: 'string',
    description: 'Primary contact phone number displayed on website',
    isPublic: true,
  },
  {
    category: 'contact',
    key: 'email',
    value: 'hello@urutix.com',
    dataType: 'string',
    description: 'Primary contact email displayed on website',
    isPublic: true,
  },
  {
    category: 'contact',
    key: 'address',
    value: 'Kigali, Rwanda · Nairobi, Kenya',
    dataType: 'string',
    description: 'Business address displayed on website',
    isPublic: true,
  },
];

async function seedContactSettings() {
  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n📞 Seeding contact settings...');
    
    for (const setting of contactSettings) {
      // Check if setting already exists
      const existing = await client.query(
        'SELECT id FROM system_settings WHERE category = $1 AND key = $2',
        [setting.category, setting.key]
      );

      if (existing.rows.length > 0) {
        // Update existing setting
        await client.query(
          `UPDATE system_settings 
           SET value = $1, description = $2, is_public = $3, updated_at = NOW() 
           WHERE category = $4 AND key = $5`,
          [JSON.stringify(setting.value), setting.description, setting.isPublic, setting.category, setting.key]
        );
        console.log(`   ✓ Updated: ${setting.category}.${setting.key} = ${setting.value}`);
      } else {
        // Insert new setting
        await client.query(
          `INSERT INTO system_settings (category, key, value, data_type, description, is_public, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [setting.category, setting.key, JSON.stringify(setting.value), setting.dataType, setting.description, setting.isPublic]
        );
        console.log(`   ✓ Created: ${setting.category}.${setting.key} = ${setting.value}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Contact settings seeded successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Settings seeded:');
    console.log('   • Phone: +250788309463');
    console.log('   • Email: hello@urutix.com');
    console.log('   • Address: Kigali, Rwanda · Nairobi, Kenya');
    console.log('\n💡 You can update these from the Admin Settings panel\n');

  } catch (error) {
    console.error('❌ Error seeding contact settings:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seed
seedContactSettings()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
