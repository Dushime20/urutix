/**
 * Detailed Debug for Tenant Management 500 Error
 * This will help us identify the exact cause of the 500 error
 */

const axios = require('axios');
const { Pool } = require('pg');

async function debugTenantManagement() {
    console.log('🔍 Detailed debugging of tenant management 500 error...\n');

    // Database connection
    const pool = new Pool({
        host: '127.0.0.1',
        port: 5433,
        database: 'urutix',
        user: 'postgres',
        password: '123',
    });

    try {
        // 1. Test database connection
        console.log('1️⃣ Testing database connection...');
        const client = await pool.connect();
        console.log('✅ Database connected');
        client.release();

        // 2. Check if required tables exist
        console.log('\n2️⃣ Checking required tables...');
        const tableCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('tenants', 'users', 'tenant_subscriptions', 'credit_accounts', 'activity_logs', 'credit_transactions')
            ORDER BY table_name
        `);
        
        console.log('📋 Found tables:', tableCheck.rows.map(r => r.table_name));

        // 3. Check tenant data
        console.log('\n3️⃣ Checking tenant data...');
        const tenantCount = await pool.query('SELECT COUNT(*) as count FROM tenants');
        console.log(`📊 Total tenants: ${tenantCount.rows[0].count}`);

        // 4. Test login
        console.log('\n4️⃣ Testing login...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@urutix.com',
            password: 'Admin@123'
        });
        
        const token = loginResponse.data.accessToken;
        console.log('✅ Login successful');

        // 5. Test tenant management with detailed error handling
        console.log('\n5️⃣ Testing tenant management endpoint...');
        try {
            const response = await axios.get('http://localhost:3001/api/admin/tenant-management', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 second timeout
            });
            
            console.log('✅ Success! Response:', response.data);
            
        } catch (error) {
            console.log('❌ Tenant management failed');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Status Text: ${error.response?.statusText}`);
            console.log(`   Data:`, error.response?.data);
            
            // Check if it's a timeout
            if (error.code === 'ECONNABORTED') {
                console.log('⏰ Request timed out - likely a database query issue');
            }
            
            // Try to get more details from headers
            if (error.response?.headers) {
                console.log(`   Headers:`, error.response.headers);
            }
        }

        // 6. Test individual database queries that the service uses
        console.log('\n6️⃣ Testing individual database queries...');
        
        try {
            // Test basic tenant query
            console.log('   Testing basic tenant query...');
            const basicTenants = await pool.query('SELECT id, name, subdomain, status FROM tenants LIMIT 1');
            console.log(`   ✅ Basic tenant query: ${basicTenants.rows.length} rows`);
            
            if (basicTenants.rows.length > 0) {
                const tenantId = basicTenants.rows[0].id;
                console.log(`   Using tenant ID: ${tenantId}`);
                
                // Test subscription query
                console.log('   Testing subscription query...');
                const subQuery = await pool.query(`
                    SELECT ts.*, sp.name as plan_name, sp.id as plan_id
                    FROM tenant_subscriptions ts
                    LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
                    WHERE ts.tenant_id = $1
                    ORDER BY ts.created_at DESC
                    LIMIT 1
                `, [tenantId]);
                console.log(`   ✅ Subscription query: ${subQuery.rows.length} rows`);
                
                // Test credit account query
                console.log('   Testing credit account query...');
                const creditQuery = await pool.query(`
                    SELECT * FROM credit_accounts
                    WHERE tenant_id = $1
                    LIMIT 1
                `, [tenantId]);
                console.log(`   ✅ Credit account query: ${creditQuery.rows.length} rows`);
                
                // Test user count query
                console.log('   Testing user count query...');
                const userCount = await pool.query(`
                    SELECT COUNT(*) as total FROM users WHERE "tenantId" = $1
                `, [tenantId]);
                console.log(`   ✅ User count query: ${userCount.rows[0].total} users`);
            }
            
        } catch (dbError) {
            console.log('❌ Database query failed:', dbError.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Response data:', error.response.data);
        }
    } finally {
        await pool.end();
    }
}

debugTenantManagement();