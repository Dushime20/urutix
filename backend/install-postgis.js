const { Client } = require('pg');
require('dotenv').config();

async function installPostGIS() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📦 Installing PostGIS extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✅ PostGIS extension installed successfully!\n');

    console.log('🔍 Verifying PostGIS installation...');
    const result = await client.query("SELECT PostGIS_Version();");
    console.log(`✅ PostGIS version: ${result.rows[0].postgis_version}\n`);

    console.log('🎉 PostGIS is ready to use!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

installPostGIS()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
