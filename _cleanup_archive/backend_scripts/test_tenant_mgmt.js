const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('Attempting to login as superadmin...');
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'superadmin@urutix.com',
            password: 'SuperAdmin@123'
        });

        const token = loginRes.data.accessToken;
        console.log('Login successful. Token obtained.');

        console.log('Calling /api/admin/tenant-management...');
        const res = await axios.get('http://localhost:3000/api/admin/tenant-management', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Response status:', res.status);
        console.log('Tenants count:', res.data.length);
    } catch (error) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
        if (error.response?.data?.message) {
            console.error('Core error message:', error.response.data.message);
        }
    }
}

testEndpoint();
