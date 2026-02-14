const axios = require('axios');

async function testMatrixEndpoint() {
    try {
        // Use a valid token from your login
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNGRjYmVjOS0zNzE3LTQ1ZGMtOWRkMS0wMTYwZTE1M2UwYzAiLCJlbWFpbCI6InN1cGVyYWRtaW5AdXJ1dGl4LmNvbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsInRlbmFudElkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwiaWF0IjoxNzM5NTIxNTIzLCJleHAiOjE3Mzk1NzU1MjN9.pvS8cvUeFn4hDHfOMvumuejBMXH3SuE_tOJJ2VNGaWE';
        
        console.log('🔍 Testing /api/admin/permissions/roles/matrix endpoint...\n');
        
        const response = await axios.get('http://localhost:3000/api/admin/permissions/roles/matrix', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-ID': '00000000-0000-0000-0000-000000000001'
            }
        });
        
        console.log('✅ Success!');
        console.log('Status:', response.status);
        console.log('\n📊 Response data:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.response?.status, error.response?.statusText);
        console.error('\n📋 Error details:');
        console.error(JSON.stringify(error.response?.data, null, 2));
        console.error('\n🔍 Full error message:');
        console.error(error.message);
    }
}

testMatrixEndpoint();
