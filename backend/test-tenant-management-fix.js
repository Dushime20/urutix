/**
 * Test Tenant Management API Fix
 * Testing the /api/admin/tenant-management endpoint
 */

const axios = require('axios');

async function testTenantManagementFix() {
    console.log('🧪 Testing tenant management API fix...\n');

    try {
        // First login as super admin to get token
        console.log('1️⃣ Logging in as super admin...');
        const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
            email: 'admin@urutix.com',
            password: 'Admin@123'
        });

        const token = loginResponse.data.accessToken;
        console.log('✅ Login successful');

        // Test the tenant management endpoint
        console.log('\n2️⃣ Testing tenant management endpoint...');
        const tenantResponse = await axios.get('http://localhost:3001/api/admin/tenant-management', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Tenant management endpoint working!');
        console.log(`📊 Found ${tenantResponse.data.length} tenants`);
        
        // Show first tenant as sample
        if (tenantResponse.data.length > 0) {
            const firstTenant = tenantResponse.data[0];
            console.log('\n📋 Sample tenant data:');
            console.log(`   Name: ${firstTenant.name}`);
            console.log(`   Status: ${firstTenant.status}`);
            console.log(`   Subdomain: ${firstTenant.subdomain}`);
            console.log(`   Users: ${firstTenant.users.total} total, ${firstTenant.users.active} active`);
            console.log(`   Credits: ${firstTenant.credits.balance}`);
            console.log(`   Subscription: ${firstTenant.subscription.planName} (${firstTenant.subscription.status})`);
            console.log(`   Health Score: ${firstTenant.healthScore}`);
            console.log(`   Contact Email: ${firstTenant.contactEmail}`);
        }

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error(`   Status: ${error.response.status}`);
        }
    }
}

testTenantManagementFix();