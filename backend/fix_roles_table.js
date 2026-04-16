const { Client } = require('pg');
require('dotenv').config();

async function fixRolesTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix'
  });

  await client.connect();
  try {
    console.log('Creating roles table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('roles table created.');

    const defaultRoles = [
      'SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'CARGO_OWNER', 
      'TRUCK_OWNER', 'DRIVER', 'AGENT', 'LENDER'
    ];

    for (const roleName of defaultRoles) {
      await client.query(`
        INSERT INTO roles (name, description, is_system)
        VALUES ($1, $2, true)
        ON CONFLICT (name) DO NOTHING
      `, [roleName, `Default system role: ${roleName}`]);
    }
    console.log('roles inserted.');

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

fixRolesTable();
