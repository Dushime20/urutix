/**
 * Check Role Permissions Table Structure
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkRolePermissionsStructure() {
    console.log('🔍 Checking role_permissions table structure...\n');

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

        // Check table structure
        console.log('\n1️⃣ Checking role_permissions table structure...');
        const structureResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'role_permissions'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Role permissions table columns:');
        structureResult.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

        // Check sample data
        console.log('\n2️⃣ Sample role_permissions data...');
        const sampleResult = await client.query(`
            SELECT * FROM role_permissions LIMIT 3
        `);
        
        console.log('📋 Sample records:');
        sampleResult.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. Role: ${row.role}, Permission ID: ${row.permission_id}`);
            Object.keys(row).forEach(key => {
                if (key !== 'role' && key !== 'permission_id') {
                    console.log(`      ${key}: ${row[key]}`);
                }
            });
        });

        await client.end();
        console.log('\n✅ Structure check complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
    }
}

checkRolePermissionsStructure();