// Load environment variables
require('dotenv').config();

const { DataSource } = require('typeorm');

// Database configuration
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

async function checkTrucks() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Check total trucks
    const totalResult = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM trucks`
    );
    console.log(`📊 Total trucks in database: ${totalResult[0].count}`);

    // Check trucks with deleted_at
    const deletedResult = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM trucks WHERE deleted_at IS NOT NULL`
    );
    console.log(`🗑️  Soft-deleted trucks: ${deletedResult[0].count}`);

    // Check active trucks
    const activeResult = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM trucks WHERE deleted_at IS NULL`
    );
    console.log(`✅ Active trucks (not deleted): ${activeResult[0].count}`);

    // Check isActive field
    const isActiveResult = await AppDataSource.query(
      `SELECT COUNT(*) as count FROM trucks WHERE "isActive" = true AND deleted_at IS NULL`
    );
    console.log(`🟢 Trucks with isActive=true: ${isActiveResult[0].count}\n`);

    // Get sample trucks
    const sampleTrucks = await AppDataSource.query(
      `SELECT id, "plateNumber", make, model, "tenantId", "ownerId", "isActive", deleted_at, "createdAt" 
       FROM trucks 
       ORDER BY "createdAt" DESC 
       LIMIT 5`
    );

    console.log('📋 Sample trucks (latest 5):');
    console.log('='.repeat(120));
    sampleTrucks.forEach((truck, index) => {
      console.log(`${index + 1}. ${truck.plateNumber} - ${truck.make} ${truck.model}`);
      console.log(`   ID: ${truck.id}`);
      console.log(`   Tenant: ${truck.tenantId || 'None'}`);
      console.log(`   Owner: ${truck.ownerId || 'None'}`);
      console.log(`   Active: ${truck.isActive}`);
      console.log(`   Deleted: ${truck.deleted_at ? 'Yes' : 'No'}`);
      console.log(`   Created: ${truck.createdAt}`);
      console.log('');
    });

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error checking trucks:', error);
    process.exit(1);
  }
}

// Run the check
checkTrucks();
