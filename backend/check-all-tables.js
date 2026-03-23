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

async function checkAllTables() {
  try {
    console.log('Connecting to database...');
    await dataSource.initialize();

    // List of tables that should exist based on the CreateAllTables migration
    const expectedTables = [
      'user_profiles',
      'tenants', 
      'loads',
      'bids',
      'auction_watches',
      'auctions',
      'auction_views',
      'users',
      'user_scores',
      'user_ratings', 
      'user_rewards',
      'trucks',
      'locations',
      'drivers',
      'trips',
      'tracking_events',
      'route_trucks',
      'routes',
      'refresh_tokens',
      'price_suggestions',
      'payments',
      'password_reset_tokens',
      'notifications',
      'load_templates',
      'insurance_claims',
      'insurance_policies',
      'insurance_renewals'
    ];

    console.log('\n=== Checking all expected tables ===');
    const missingTables = [];
    const existingTables = [];

    for (const table of expectedTables) {
      try {
        const result = await dataSource.query(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '${table}'`);
        const exists = result[0].count > 0;
        if (exists) {
          existingTables.push(table);
          console.log(`✓ ${table}: EXISTS`);
        } else {
          missingTables.push(table);
          console.log(`✗ ${table}: MISSING`);
        }
      } catch (error) {
        missingTables.push(table);
        console.log(`✗ ${table}: ERROR - ${error.message}`);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Existing tables: ${existingTables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log(`\nMissing tables:`);
      missingTables.forEach(table => console.log(`- ${table}`));
    }

    await dataSource.destroy();
    console.log('\nTable check completed!');
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

checkAllTables();