const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testFuelWalletEndpoints() {
    console.log('Testing Fuel Wallet Endpoints...\n');

    // You'll need to replace this with a valid JWT token
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // Test 1: Get wallet stats
        console.log('1. Testing GET /fuel/wallets/stats/overview');
        try {
            const statsResponse = await axios.get(`${BASE_URL}/fuel/wallets/stats/overview`, { headers });
            console.log('✅ Stats endpoint working');
            console.log('Response:', JSON.stringify(statsResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Stats endpoint failed');
            console.log('Error:', error.response?.data || error.message);
        }

        console.log('\n---\n');

        // Test 2: Try to get a wallet by ID (should fail with 404 if no wallet exists)
        console.log('2. Testing GET /fuel/wallets/:id with id="stats"');
        try {
            const walletResponse = await axios.get(`${BASE_URL}/fuel/wallets/stats`, { headers });
            console.log('Response:', JSON.stringify(walletResponse.data, null, 2));
        } catch (error) {
            console.log('Error (expected if no wallet with id "stats"):', error.response?.data || error.message);
        }

        console.log('\n---\n');

        // Test 3: Check if backend is running
        console.log('3. Testing if backend is accessible');
        try {
            const healthResponse = await axios.get(`${BASE_URL}/`);
            console.log('✅ Backend is running');
        } catch (error) {
            console.log('❌ Backend is not accessible');
            console.log('Error:', error.message);
        }

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

console.log('='.repeat(60));
console.log('FUEL WALLET ENDPOINT TEST');
console.log('='.repeat(60));
console.log('\nIMPORTANT: Update the token variable with a valid JWT token');
console.log('You can get this from your browser\'s developer tools\n');
console.log('='.repeat(60));
console.log();

testFuelWalletEndpoints();
