/**
 * Debug Tenant Enrichment Issues
 * Testing each part of the enrichTenantData method
 */

const { Client } = require('pg');
require('dotenv').config();

async function debugTenantEnrichment() {
    console.log('🔍 Debugging tenant enrichment issues...\n');

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

        // Get a sample tenant
        console.log('\n1️⃣ Getting sample tenant...');
        const tenantResult = await client.query(`
            SELECT id, name, subdomain, status, "contactEmail", "createdAt"
            FROM tenants 
            ORDER BY "createdAt" DESC
            LIMIT 1
        `);
        
        if (tenantResult.rows.length === 0) {
            console.log('❌ No tenants found');
            return;
        }

        const tenant = tenantResult.rows[0];
        console.log(`✅ Testing with tenant: ${tenant.name} (${tenant.id})`);

        // Test subscription query
        console.log('\n2️⃣ Testing subscription query...');
        try {
            const subscriptionResult = await client.query(`
                SELECT ts.*, sp.name as plan_name
                FROM tenant_subscriptions ts
                LEFT JOIN subscription_plans sp ON ts."planId" = sp.id
                WHERE ts."tenantId" = $1
                ORDER BY ts."createdAt" DESC
                LIMIT 1
            `, [tenant.id]);
            console.log(`✅ Subscription query OK - found ${subscriptionResult.rows.length} records`);
        } catch (err) {
            console.log(`❌ Subscription query failed: ${err.message}`);
        }

        // Test credit account query
        console.log('\n3️⃣ Testing credit account query...');
        try {
            const creditResult = await client.query(`
                SELECT * FROM credit_accounts
                WHERE "tenantId" = $1
                LIMIT 1
            `, [tenant.id]);
            console.log(`✅ Credit account query OK - found ${creditResult.rows.length} records`);
        } catch (err) {
            console.log(`❌ Credit account query failed: ${err.message}`);
        }

        // Test credit transaction query
        console.log('\n4️⃣ Testing credit transaction query...');
        try {
            const transactionResult = await client.query(`
                SELECT * FROM credit_transactions
                WHERE "tenantId" = $1 AND type IN ('PURCHASE', 'SUBSCRIPTION_GRANT')
                ORDER BY "createdAt" DESC
                LIMIT 1
            `, [tenant.id]);
            console.log(`✅ Credit transaction query OK - found ${transactionResult.rows.length} records`);
        } catch (err) {
            console.log(`❌ Credit transaction query failed: ${err.message}`);
        }

        // Test user count queries
        console.log('\n5️⃣ Testing user count queries...');
        try {
            const totalUsersResult = await client.query(`
                SELECT COUNT(*) as count FROM users
                WHERE "tenantId" = $1
            `, [tenant.id]);
            console.log(`✅ Total users query OK - found ${totalUsersResult.rows[0].count} users`);

            const activeUsersResult = await client.query(`
                SELECT COUNT(*) as count FROM users
                WHERE "tenantId" = $1 AND status = 'ACTIVE'
            `, [tenant.id]);
            console.log(`✅ Active users query OK - found ${activeUsersResult.rows[0].count} active users`);
        } catch (err) {
            console.log(`❌ User count queries failed: ${err.message}`);
        }

        // Test activity log query - this is likely the problem
        console.log('\n6️⃣ Testing activity log query...');
        try {
            // First check if activity_logs table exists
            const tableExistsResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'activity_logs'
                );
            `);
            
            if (!tableExistsResult.rows[0].exists) {
                console.log('❌ activity_logs table does not exist');
            } else {
                console.log('✅ activity_logs table exists');
                
                // Check table structure
                const structureResult = await client.query(`
                    SELECT column_name, data_type
                    FROM information_schema.columns 
                    WHERE table_name = 'activity_logs'
                    ORDER BY ordinal_position
                `);
                
                console.log('📋 Activity logs table columns:');
                structureResult.rows.forEach(col => {
                    console.log(`   ${col.column_name}: ${col.data_type}`);
                });

                // Try the actual query
                const activityResult = await client.query(`
                    SELECT al.* FROM activity_logs al
                    JOIN users u ON al."userId" = u.id
                    WHERE u."tenantId" = $1
                    ORDER BY al."createdAt" DESC
                    LIMIT 1
                `, [tenant.id]);
                console.log(`✅ Activity log query OK - found ${activityResult.rows.length} records`);
            }
        } catch (err) {
            console.log(`❌ Activity log query failed: ${err.message}`);
        }

        await client.end();
        console.log('\n✅ Debug analysis complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        await client.end();
    }
}

debugTenantEnrichment();