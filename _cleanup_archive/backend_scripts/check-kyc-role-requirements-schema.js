/**
 * Check KYC Role Requirements Table Schema
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
    console.log('🔍 Checking kyc_role_requirements table schema...\n');

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

        // Check if kyc_role_requirements table exists
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'kyc_role_requirements'
            );
        `);
        console.log('kyc_role_requirements table exists:', tableExists.rows[0].exists);

        if (tableExists.rows[0].exists) {
            // Get all columns in kyc_role_requirements table
            const columns = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = 'kyc_role_requirements'
                ORDER BY ordinal_position;
            `);

            console.log('\n📋 kyc_role_requirements table columns:');
            columns.rows.forEach(col => {
                console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });

            // Check for timestamp columns
            const timestampColumns = columns.rows.filter(col => 
                col.column_name.includes('created') || col.column_name.includes('updated')
            );

            console.log('\n🕒 Timestamp columns:');
            if (timestampColumns.length > 0) {
                timestampColumns.forEach(col => {
                    console.log(`✅ ${col.column_name}: ${col.data_type}`);
                });
            } else {
                console.log('❌ No timestamp columns found');
            }
        }

        await client.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkSchema();