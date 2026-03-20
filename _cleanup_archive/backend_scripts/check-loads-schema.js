/**
 * Check Loads Table Schema
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkLoadsSchema() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check loads table schema
    console.log('\n📋 Loads Table Schema:');
    console.log('======================');
    
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'loads' 
      ORDER BY ordinal_position
    `);

    if (schemaResult.rows.length === 0) {
      console.log('❌ Loads table not found');
      return;
    }

    schemaResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check if we have any loads
    console.log('\n📦 Sample Loads Data:');
    console.log('====================');
    
    const loadsResult = await client.query(`
      SELECT id, "tenantId", "cargoOwnerId", "createdAt", status
      FROM loads 
      LIMIT 5
    `);

    if (loadsResult.rows.length === 0) {
      console.log('❌ No loads found in database');
    } else {
      console.log(`✅ Found ${loadsResult.rows.length} sample loads:`);
      loadsResult.rows.forEach(load => {
        console.log(`- ID: ${load.id}, Tenant: ${load.tenantId}, Status: ${load.status}`);
      });
    }

    // Check users table for cargo owners
    console.log('\n👤 Cargo Owner Users:');
    console.log('====================');
    
    const usersResult = await client.query(`
      SELECT id, "tenantId", email, role
      FROM users 
      WHERE role = 'CARGO_OWNER'
      LIMIT 5
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ No cargo owner users found');
    } else {
      console.log(`✅ Found ${usersResult.rows.length} cargo owner users:`);
      usersResult.rows.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Tenant: ${user.tenantId}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkLoadsSchema();