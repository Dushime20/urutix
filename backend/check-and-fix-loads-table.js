const { Client } = require('pg');
require('dotenv').config();

async function checkAndFixLoadsTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log(`📊 Database: ${process.env.DB_NAME || 'urutix'} on port ${process.env.DB_PORT || 5432}`);
    console.log('');

    // Check if loadType column exists
    const loadTypeCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loads' AND column_name = 'loadType'
    `);

    // Check if equipmentType column exists
    const equipmentTypeCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loads' AND column_name = 'equipmentType'
    `);

    console.log('🔍 Checking loads table columns...');
    console.log(`   loadType column exists: ${loadTypeCheck.rows.length > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`   equipmentType column exists: ${equipmentTypeCheck.rows.length > 0 ? '✅ YES' : '❌ NO'}`);
    console.log('');

    if (loadTypeCheck.rows.length === 0 || equipmentTypeCheck.rows.length === 0) {
      console.log('⚠️  Missing columns detected!');
      console.log('');
      console.log('📝 SOLUTION: You need to run the migrations on this database.');
      console.log('');
      console.log('Run this command:');
      console.log('   npm run migration:run');
      console.log('');
      console.log('This will add all missing columns including:');
      console.log('   - loadType');
      console.log('   - equipmentType');
      console.log('   - cargoType');
      console.log('   - and many other columns');
      console.log('');
      
      // Show which migrations have been run
      const migrationsCheck = await client.query(`
        SELECT name, timestamp 
        FROM migrations 
        ORDER BY timestamp DESC 
        LIMIT 5
      `);
      
      console.log('📋 Last 5 migrations run on this database:');
      if (migrationsCheck.rows.length === 0) {
        console.log('   ⚠️  No migrations have been run yet!');
      } else {
        migrationsCheck.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. ${row.name} (${new Date(parseInt(row.timestamp)).toISOString()})`);
        });
      }
      console.log('');
      
      process.exit(1);
    } else {
      console.log('✅ All required columns exist!');
      console.log('');
      console.log('The database schema is up to date.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('relation "loads" does not exist')) {
      console.log('');
      console.log('⚠️  The loads table does not exist!');
      console.log('');
      console.log('📝 SOLUTION: Run migrations to create all tables:');
      console.log('   npm run migration:run');
      console.log('');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkAndFixLoadsTable();
