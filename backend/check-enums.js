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

async function checkEnums() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();

    console.log('\n=== Checking problematic enums ===');
    const enums = [
      'insurance_claims_claimtype_enum',
      'insurance_claims_status_enum', 
      'insurance_claims_priority_enum',
      'insurance_policies_policytype_enum',
      'insurance_policies_status_enum',
      'insurance_policies_paymentmethod_enum'
    ];

    for (const enumName of enums) {
      try {
        const result = await dataSource.query(`SELECT COUNT(*) FROM pg_type WHERE typname = '${enumName}'`);
        const exists = result[0].count > 0;
        console.log(`- ${enumName}: ${exists ? 'EXISTS' : 'MISSING'}`);
        
        if (exists) {
          const enumValues = await dataSource.query(`
            SELECT enumlabel 
            FROM pg_enum e 
            JOIN pg_type t ON e.enumtypid = t.oid 
            WHERE t.typname = '${enumName}'
            ORDER BY enumsortorder
          `);
          const values = enumValues.map(v => v.enumlabel).join(', ');
          console.log(`  Values: ${values}`);
        }
      } catch (error) {
        console.log(`- ${enumName}: ERROR - ${error.message}`);
      }
    }

    await dataSource.destroy();
    console.log('\nEnum check completed!');
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

checkEnums();