#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
});

async function addBrokerEnum() {
  try {
    console.log('Adding BROKER to users_role_enum...');
    await pool.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'BROKER'`
    );
    console.log('✅ BROKER role added to enum successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addBrokerEnum()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

