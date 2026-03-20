const { Client } = require('pg');
require('dotenv').config();

async function checkPermissionsSchema() {
    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5433,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'urutix',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Check permissions table schema
        const schemaQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'permissions'
            ORDER BY ordinal_position;
        `;

        const result = await client.query(schemaQuery);
        
        if (result.rows.length > 0) {
            console.log('📋 Permissions table schema:');
            console.table(result.rows);
        } else {
            console.log('⚠️  Permissions table not found or has no columns');
        }

        // Check role_permissions table
        const rolePermsQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'role_permissions'
            ORDER BY ordinal_position;
        `;

        const rolePermsResult = await client.query(rolePermsQuery);
        
        if (rolePermsResult.rows.length > 0) {
            console.log('\n📋 Role_permissions table schema:');
            console.table(rolePermsResult.rows);
        } else {
            console.log('\n⚠️  Role_permissions table not found');
        }

        // Check user_permissions table
        const userPermsQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'user_permissions'
            ORDER BY ordinal_position;
        `;

        const userPermsResult = await client.query(userPermsQuery);
        
        if (userPermsResult.rows.length > 0) {
            console.log('\n📋 User_permissions table schema:');
            console.table(userPermsResult.rows);
        } else {
            console.log('\n⚠️  User_permissions table not found');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkPermissionsSchema();
