const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function checkAndRunPermissionsMigration() {
    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5433,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'urutix',
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check if permissions table exists
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'permissions'
            );
        `;

        const result = await client.query(checkTableQuery);
        const tableExists = result.rows[0].exists;

        if (tableExists) {
            console.log('✅ Permissions table already exists');
            
            // Check if it has data
            const countResult = await client.query('SELECT COUNT(*) FROM permissions');
            const count = parseInt(countResult.rows[0].count);
            console.log(`📊 Found ${count} permissions in the database`);
            
            if (count === 0) {
                console.log('⚠️  Permissions table is empty. Running migration...');
                await runMigration(client);
            }
        } else {
            console.log('⚠️  Permissions table does not exist. Running migration...');
            await runMigration(client);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

async function runMigration(client) {
    try {
        const migrationPath = path.join(__dirname, 'migrations', '003_rbac_permissions_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('🚀 Running RBAC permissions migration...');
        await client.query(migrationSQL);
        console.log('✅ Migration completed successfully!');

        // Verify
        const countResult = await client.query('SELECT COUNT(*) FROM permissions');
        const count = parseInt(countResult.rows[0].count);
        console.log(`✅ Created ${count} permissions`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
}

checkAndRunPermissionsMigration();
