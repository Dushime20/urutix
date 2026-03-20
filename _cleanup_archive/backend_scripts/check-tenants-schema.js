const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
  synchronize: false,
  logging: false,
});

async function checkTenantsSchema() {
  try {
    await AppDataSource.initialize();
    
    const columns = await AppDataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position
    `);
    
    console.log('Tenants table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Also get a sample tenant
    const sample = await AppDataSource.query(`
      SELECT * FROM tenants LIMIT 1
    `);
    
    if (sample.length > 0) {
      console.log('\nSample tenant columns:', Object.keys(sample[0]));
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

checkTenantsSchema();
