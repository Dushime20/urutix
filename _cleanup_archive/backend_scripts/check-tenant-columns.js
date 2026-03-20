/**
 * Check Tenant Table Columns
 * Verify what columns exist in the tenants table
 */

const { Pool } = require('pg');

async function checkTenantColumns() {
    console.log('🔍 Checking tenant table columns...\n');

    const pool = new Pool({
        host: '127.0.0.1',
        port: 5433,
        database: 'urutix',
        user: 'postgres',
        password: '123',
    });

    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'tenants' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Columns in tenants table:');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name} (${row.data_type}) - nullable: ${row.is_nullable}`);
        });
        
        // Check for specific KYC columns
        const kycColumns = ['kycReviewedBy', 'kycStatus', 'kycData', 'kycSubmittedAt', 'kycVerifiedAt', 'kycNotes'];
        console.log('\n🔍 KYC column status:');
        kycColumns.forEach(col => {
            const exists = result.rows.some(row => row.column_name === col);
            console.log(`  ${col}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkTenantColumns();