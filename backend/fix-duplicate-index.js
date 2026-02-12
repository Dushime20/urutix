const { Client } = require('pg');
require('dotenv').config();

async function fixDuplicateIndex() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔍 Checking for duplicate index...');
    const checkIndex = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE indexname = 'IDX_143edd01c2f285d77e22f36a31'
    `);

    if (checkIndex.rows.length > 0) {
      console.log('⚠️  Found duplicate index, dropping it...');
      await client.query('DROP INDEX IF EXISTS "IDX_143edd01c2f285d77e22f36a31"');
      console.log('✅ Index dropped successfully!\n');
    } else {
      console.log('✅ No duplicate index found.\n');
    }

    console.log('🎉 Ready to run sync script again!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

fixDuplicateIndex()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
