const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
});

async function resetDatabaseComplete() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    console.log('⚠️  WARNING: This will delete ALL data from ALL tables in the database!');
    console.log('');

    // Get all tables
    const result = await AppDataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename != 'migrations'
        AND tablename != 'spatial_ref_sys'
      ORDER BY tablename;
    `);

    const tables = result.map(row => row.tablename);

    console.log(`🗑️  Deleting data from ${tables.length} tables...\n`);

    // Disable foreign key checks temporarily
    await AppDataSource.query('SET session_replication_role = replica;');

    let successCount = 0;
    let skipCount = 0;

    for (const table of tables) {
      try {
        await AppDataSource.query(`DELETE FROM ${table}`);
        console.log(`   ✓ Cleared ${table}`);
        successCount++;
      } catch (error) {
        console.log(`   ⚠️  Skipped ${table} (${error.message})`);
        skipCount++;
      }
    }

    // Re-enable foreign key checks
    await AppDataSource.query('SET session_replication_role = DEFAULT;');

    console.log('');
    console.log('═'.repeat(70));
    console.log(`✅ Database reset complete!`);
    console.log(`   Tables cleared: ${successCount}`);
    console.log(`   Tables skipped: ${skipCount}`);
    console.log('═'.repeat(70));
    console.log('');
    console.log('Next step: Run the seed script');
    console.log('   node seed-users-only.js');
    console.log('');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetDatabaseComplete();
