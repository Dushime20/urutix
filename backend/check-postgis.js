const { Client } = require('pg');
require('dotenv').config();

async function checkPostGIS() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    // Check if PostGIS is available
    console.log('📦 Checking PostGIS extension...');
    const result = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'postgis'
      ) as available
    `);
    
    if (result.rows[0].available) {
      console.log('✅ PostGIS extension is available\n');
      
      // Try to create it
      console.log('🔄 Attempting to create PostGIS extension...');
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
        console.log('✅ PostGIS extension created successfully\n');
      } catch (err) {
        console.log('⚠️  Could not create extension:', err.message);
        console.log('   This might require superuser privileges\n');
      }
    } else {
      console.log('❌ PostGIS extension is NOT available');
      console.log('   You need to install PostGIS on your PostgreSQL server\n');
    }

    // Check installed extensions
    const installed = await client.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('postgis', 'uuid-ossp')
      ORDER BY extname
    `);
    
    console.log('📋 Installed extensions:');
    if (installed.rows.length === 0) {
      console.log('   None found');
    } else {
      installed.rows.forEach(ext => {
        console.log(`   ✅ ${ext.extname} (version ${ext.extversion})`);
      });
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkPostGIS();

