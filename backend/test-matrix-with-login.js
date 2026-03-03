const axios = require('axios');

async function testWithFreshToken() {
    try {
        // Step 1: Login to get a fresh token
        console.log('🔐 Step 1: Logging in...\n');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'superadmin@urutix.com',
            password: 'SuperAdmin@123'
        });
        
        const token = loginResponse.data.accessToken;
        const tenantId = loginResponse.data.user.tenantId;
        
        console.log('✅ Login successful!');
        console.log('Token:', token.substring(0, 50) + '...');
        console.log('Tenant ID:', tenantId);
        
        // Step 2: Test the matrix endpoint
        console.log('\n🔍 Step 2: Testing /api/admin/permissions/roles/matrix endpoint...\n');
        
        const response = await axios.get('http://localhost:3000/api/admin/permissions/roles/matrix', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-ID': tenantId
            }
        });
        
        console.log('✅ Matrix endpoint success!');
        console.log('Status:', response.status);
        console.log('\n📊 Response summary:');
        console.log('- Roles count:', response.data.roles?.length || 0);
        console.log('- Permissions count:', response.data.permissions?.length || 0);
        
        if (response.data.roles && response.data.roles.length > 0) {
            console.log('\n📋 Sample role:');
            const sampleRole = response.data.roles[0];
            console.log(JSON.stringify({
                id: sampleRole.id,
                name: sampleRole.name,
                description: sampleRole.description,
                permissionsCount: sampleRole.permissions?.length || 0
            }, null, 2));
        }
        
        if (response.data.permissions && response.data.permissions.length > 0) {
            console.log('\n🔑 Sample permissions:');
            response.data.permissions.slice(0, 3).forEach(perm => {
                console.log(`  - ${perm.name} (${perm.category})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.statusText);
        console.error('\n📋 Error details:');
        console.error(JSON.stringify(error.response?.data, null, 2));
        console.error('\n🔍 Full error message:');
        console.error(error.message);
        
        if (error.response?.data?.message) {
            console.error('\n💡 Server message:', error.response.data.message);
        }
    }
}

testWithFreshToken();
