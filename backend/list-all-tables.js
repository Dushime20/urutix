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

async function listAllTables() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Query all tables in the public schema
    const result = await AppDataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('📋 All tables in database:\n');
    result.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.tablename}`);
    });
    console.log(`\n   Total: ${result.length} tables\n`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllTables();
