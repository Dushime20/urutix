const { Client } = require('pg');
require('dotenv').config();

async function checkKycRequirementsSchema() {
    const client = new Client({
        host: '127.0.0.1',
        port: 5433,
        user: 'postgres',
        password: '123',
        database: 'urutix',
    });

    try {
        await client.connect();
        
        // Check if table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'kyc_role_requirements'
            )
        `);
        console.log('kyc_role_requirements table exists:', tableCheck.rows[0].exists);
        
        if (tableCheck.rows[0].exists) {
            const result = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'kyc_role_requirements' 
                ORDER BY ordinal_position
            `);
            console.log('kyc_role_requirements table columns:');
            result.rows.forEach(row => {
                console.log(`  ${row.column_name}: ${row.data_type}`);
            });
        }
        
        await client.end();
    } catch (error) {
        console.error('Error:', error.message);
        await client.end();
    }
}

checkKycRequirementsSchema();