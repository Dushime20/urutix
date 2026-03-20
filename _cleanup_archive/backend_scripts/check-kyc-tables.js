const { Client } = require('pg');
require('dotenv').config();

async function checkKycTables() {
    const client = new Client({
        host: '127.0.0.1',
        port: 5433,
        user: 'postgres',
        password: '123',
        database: 'urutix',
    });

    try {
        await client.connect();
        
        // Check if user_kyc_documents table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_kyc_documents'
            )
        `);
        console.log('user_kyc_documents table exists:', tableCheck.rows[0].exists);
        
        if (tableCheck.rows[0].exists) {
            const result = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'user_kyc_documents' 
                ORDER BY ordinal_position
            `);
            console.log('user_kyc_documents table columns:');
            result.rows.forEach(row => {
                console.log(`  ${row.column_name}: ${row.data_type}`);
            });
        }
        
        // Check if user_kyc_audit_log table exists
        const auditTableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_kyc_audit_log'
            )
        `);
        console.log('\\nuser_kyc_audit_log table exists:', auditTableCheck.rows[0].exists);
        
        if (auditTableCheck.rows[0].exists) {
            const auditResult = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'user_kyc_audit_log' 
                ORDER BY ordinal_position
            `);
            console.log('user_kyc_audit_log table columns:');
            auditResult.rows.forEach(row => {
                console.log(`  ${row.column_name}: ${row.data_type}`);
            });
        }
        
        await client.end();
    } catch (error) {
        console.error('Error:', error.message);
        await client.end();
    }
}

checkKycTables();