/**
 * Script to configure a lender for external lending system integration
 * 
 * Usage:
 * 1. Update the configuration values below
 * 2. Get your admin JWT token
 * 3. Run: node configure-external-lender.js
 */

const axios = require('axios');

// ===== CONFIGURATION - UPDATE THESE VALUES =====
const CONFIG = {
  // Your admin JWT token (get from browser localStorage or login)
  adminToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMzUxM2IzOC1lNDkzLTRkODUtOWU5My1iMzUxMTk2ZDFhMmUiLCJlbWFpbCI6ImFkbWluMkB1cnV0aXguY29tIiwicm9sZSI6IkFETUlOIiwidGVuYW50SWQiOiJmMzFlNzNmMi0yYzY1LTRiNmMtYjZmMS1mOWQxMTU1MDAxMmQiLCJpYXQiOjE3NjU5ODEyMTksImV4cCI6MTc2NjAzNTIxOX0.YqMkNA8Djr5znN1mONgBZYlP2pMVAmThPS-Jwfe6KL4',
  
  // Backend API URL
  apiBaseUrl: 'http://localhost:3002/api',
  
  // Lender ID to configure (from your logs, use one of these):
  // - 2d6a9dd1-7a81-4e5a-affe-289b2dea80f8 (Uruti Lender)
  // - addedfac-bbd1-476f-907e-4e8defe336d6 (Debbie)
  // - 5d8c6515-85fa-49b0-a5ba-e4ef70b994bf (Alpha Capital Lending)
  // - 3afcf554-9bfe-4cce-8bd4-05b52bfdff2e (Beta Finance Solutions)
  // - 4c2d19c9-c728-41f7-9422-f76ab9f3056d (Gamma Investment Group)
  lenderId: '2d6a9dd1-7a81-4e5a-affe-289b2dea80f8',
  
  // External system configuration
  baseUrl: 'http://localhost:3000', // Your external system base URL (without /api)
  apiKey: '8ed97c214f68b0460993658b41139432523d9dfff1c49cf5585eaae53b6d8078',
  webhookSecret: '9e0b0a4c26638001daa309f7603d6ded6291d92a7357c9982ef0faf606284699',
  loanProductCode: 'PL-001', // Loan product code
};

async function configureLender() {
  try {
    console.log('🔧 Configuring lender for external system integration...');
    console.log(`Lender ID: ${CONFIG.lenderId}`);
    console.log(`Base URL: ${CONFIG.baseUrl}`);
    console.log('');

    const response = await axios.post(
      `${CONFIG.apiBaseUrl}/admin/uruti-lending/configure`,
      {
        lenderId: CONFIG.lenderId,
        baseUrl: CONFIG.baseUrl,
        apiKey: CONFIG.apiKey,
        webhookSecret: CONFIG.webhookSecret,
        loanProductCode: CONFIG.loanProductCode,
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Success! Lender configured for external system.');
    console.log('');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your backend');
    console.log('2. Try fetching lenders again');
    console.log('3. Loan officers should now appear in External Lending System tab');
    
  } catch (error) {
    console.error('❌ Error configuring lender:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Validate configuration
if (CONFIG.adminToken === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
  console.error('❌ Please update CONFIG.adminToken with your admin JWT token');
  console.error('   Get it from browser DevTools → Application → Local Storage → accessToken');
  process.exit(1);
}

if (CONFIG.apiKey === 'YOUR_API_KEY_FROM_EXTERNAL_SYSTEM') {
  console.error('❌ Please update CONFIG.apiKey with your external system API key');
  process.exit(1);
}

if (CONFIG.webhookSecret === 'YOUR_WEBHOOK_SECRET') {
  console.error('❌ Please update CONFIG.webhookSecret with your external system webhook secret');
  process.exit(1);
}

// Run the configuration
configureLender();

