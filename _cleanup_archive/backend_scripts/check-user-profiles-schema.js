/**
 * Check user_profiles table schema
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkUserProfilesSchema() {
    console.log('🔍 Checking user_profiles table schema...\n');

    const client = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 5433,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '123',
        database: process.env.DB_NAME || 'urutix',
    });

    try {
        await client.connect();
        console.log('✅ Database connected');

        // Get table schema
        const schemaResult = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 user_profiles table columns:');
        schemaResult.rows.forEach(col => {
            console.log(`   ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });

        await client.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

checkUserProfilesSchema();