
const { DataSource } = require('typeorm');
const { User } = require('../entities/user.entity');
const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../../.env') });
require('reflect-metadata');

// Mock User entity to avoid importing the complex entity file if possible?
// No, TypeORM needs the real entity with decorators.
// But importing TS entity in JS file might fail if not compiled.
// We should use `ts-node` but fix the config.

// Alternative: Use raw pg client.
const { Client } = require('pg');

async function debugUsers() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USERNAME || 'dev',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'urutix_database',
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected.');

        const res = await client.query(`
      SELECT email, role, "tenantId", status 
      FROM users 
      WHERE email = $1 OR email = $2
    `, ['urutixv@gmail.com', 'admin@urutix.com']);

        console.log('Found users:');
        res.rows.forEach(user => {
            console.log(`- Email: ${user.email}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  TenantId: ${user.tenantId}`);
            console.log(`  Status: ${user.status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

debugUsers();
