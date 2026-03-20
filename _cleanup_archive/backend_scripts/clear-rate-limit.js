/**
 * Clear Rate Limiting for Testing
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api';

async function clearRateLimit() {
    console.log('🔄 Checking rate limit status...\n');

    try {
        const response = await axios.get(`${API_BASE_URL}/auth/rate-limit-info`);
        const data = response.data.data;
        
        console.log('Current rate limit status:');
        console.log('- Failed attempts:', data.count);
        console.log('- Remaining attempts:', data.remainingAttempts);
        console.log('- Is blocked:', data.isBlocked);
        console.log('- Reset time:', new Date(data.resetTime).toLocaleString());
        
        if (data.isBlocked) {
            const resetTime = new Date(data.resetTime);
            const now = new Date();
            const waitTime = Math.max(0, resetTime.getTime() - now.getTime());
            
            if (waitTime > 0) {
                console.log(`\n⏰ Account is blocked. Wait ${Math.ceil(waitTime / 1000)} seconds until reset.`);
                console.log(`Reset at: ${resetTime.toLocaleString()}`);
            } else {
                console.log('\n✅ Reset time has passed. Rate limit should be cleared now.');
            }
        } else {
            console.log('\n✅ Account is not blocked. Rate limit is clear.');
        }
        
    } catch (error) {
        console.error('❌ Failed to check rate limit:', error.message);
    }
}

clearRateLimit();