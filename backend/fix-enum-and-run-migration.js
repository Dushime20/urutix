const { Client } = require('pg');
require('dotenv').config();

async function fixEnumsAndRunMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check and create enum types if they don't exist
    const enumTypes = [
      {
        name: 'insurance_policies_policytype_enum',
        values: ['liability', 'collision', 'comprehensive', 'cargo', 'uninsured_motorist', 'roadside', 'medical']
      },
      {
        name: 'insurance_policies_status_enum',
        values: ['active', 'pending', 'expired', 'cancelled', 'suspended']
      },
      {
        name: 'insurance_policies_paymentmethod_enum',
        values: ['monthly', 'quarterly', 'semi_annual', 'annual']
      }
    ];

    for (const enumType of enumTypes) {
      const checkQuery = `
        SELECT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_namespace n ON n.oid = t.typnamespace
          WHERE t.typname = $1 AND n.nspname = 'public'
        );
      `;
      
      const result = await client.query(checkQuery, [enumType.name]);
      
      if (result.rows[0].exists) {
        console.log(`✓ Enum type "${enumType.name}" already exists`);
      } else {
        const createQuery = `CREATE TYPE "public"."${enumType.name}" AS ENUM(${enumType.values.map(v => `'${v}'`).join(', ')})`;
        await client.query(createQuery);
        console.log(`✅ Created enum type "${enumType.name}"`);
      }
    }

    console.log('\n✅ All enum types are ready!');
    console.log('\nNow run: npm run migration:run');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixEnumsAndRunMigration();
