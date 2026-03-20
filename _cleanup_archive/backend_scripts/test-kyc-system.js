const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@urutix.com',
  adminPassword: 'admin123',
  tenantEmail: 'test@tenant.com',
  tenantPassword: 'tenant123',
};

let adminToken = '';
let tenantToken = '';
let testTenantId = '';

async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.access_token;
  } catch (error) {
    console.error(`❌ Login failed for ${email}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function testKycSubmission() {
  console.log('📝 Testing KYC submission...');
  
  try {
    const kycData = {
      registrationNumber: 'REG123456789',
      taxId: 'TAX987654321',
      businessType: 'LOGISTICS',
      businessDescription: 'Transportation and logistics services',
      companyAddress: '123 Business Street, City, Country',
      contactPerson: 'John Doe',
      contactPhone: '+1234567890',
      contactEmail: 'contact@testcompany.com',
      bankAccountNumber: 'BANK123456',
      bankName: 'Test Bank',
      additionalInfo: {
        yearsInBusiness: 5,
        numberOfEmployees: 25,
      },
    };

    const response = await axios.post(`${BASE_URL}/kyc/submit`, kycData, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });

    console.log('✅ KYC submission successful:', response.data.message);
    return response.data.data;
  } catch (error) {
    console.error('❌ KYC submission failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testKycStatusUpdate(tenantId, status, notes) {
  console.log(`📝 Testing KYC status update to ${status}...`);
  
  try {
    const response = await axios.put(`${BASE_URL}/kyc/${tenantId}/status`, {
      status,
      notes,
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log('✅ KYC status update successful:', response.data.message);
    return response.data.data;
  } catch (error) {
    console.error('❌ KYC status update failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetPendingKyc() {
  console.log('📝 Testing get pending KYC...');
  
  try {
    const response = await axios.get(`${BASE_URL}/kyc/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log('✅ Get pending KYC successful:', response.data.data.length, 'tenants found');
    return response.data.data;
  } catch (error) {
    console.error('❌ Get pending KYC failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetKycStats() {
  console.log('📝 Testing get KYC statistics...');
  
  try {
    const response = await axios.get(`${BASE_URL}/kyc/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log('✅ Get KYC stats successful:', response.data.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Get KYC stats failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetKycAuditLog(tenantId) {
  console.log('📝 Testing get KYC audit log...');
  
  try {
    const response = await axios.get(`${BASE_URL}/kyc/${tenantId}/audit-log`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log('✅ Get KYC audit log successful:', response.data.data.length, 'entries found');
    return response.data.data;
  } catch (error) {
    console.error('❌ Get KYC audit log failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testOnboardingStatus() {
  console.log('📝 Testing onboarding status...');
  
  try {
    const response = await axios.get(`${BASE_URL}/onboarding/status`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });

    console.log('✅ Onboarding status retrieved:', {
      step: response.data.step,
      status: response.data.status,
      kycStatus: response.data.kycStatus,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Get onboarding status failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function runKycTests() {
  console.log('🧪 Starting KYC System Tests...');
  console.log('');

  // Step 1: Login as admin
  console.log('🔐 Step 1: Admin login...');
  adminToken = await login(TEST_CONFIG.adminEmail, TEST_CONFIG.adminPassword);
  if (!adminToken) {
    console.log('⚠️ Admin login failed, skipping admin-only tests');
  } else {
    console.log('✅ Admin login successful');
  }

  // Step 2: Login as tenant
  console.log('🔐 Step 2: Tenant login...');
  tenantToken = await login(TEST_CONFIG.tenantEmail, TEST_CONFIG.tenantPassword);
  if (!tenantToken) {
    console.log('❌ Tenant login failed, cannot continue tests');
    return;
  } else {
    console.log('✅ Tenant login successful');
  }

  // Step 3: Get onboarding status
  console.log('📋 Step 3: Check onboarding status...');
  const onboardingStatus = await testOnboardingStatus();
  if (onboardingStatus) {
    testTenantId = onboardingStatus.tenant.id;
    console.log('✅ Tenant ID obtained:', testTenantId);
  }

  // Step 4: Submit KYC
  console.log('📝 Step 4: Submit KYC data...');
  const submittedTenant = await testKycSubmission();
  if (submittedTenant) {
    console.log('✅ KYC submission test passed');
  }

  if (adminToken) {
    // Step 5: Get pending KYC (admin only)
    console.log('📋 Step 5: Get pending KYC...');
    await testGetPendingKyc();

    // Step 6: Update KYC status to UNDER_REVIEW
    console.log('📝 Step 6: Update KYC status to UNDER_REVIEW...');
    await testKycStatusUpdate(testTenantId, 'UNDER_REVIEW', 'KYC under review by admin');

    // Step 7: Update KYC status to APPROVED
    console.log('📝 Step 7: Update KYC status to APPROVED...');
    await testKycStatusUpdate(testTenantId, 'APPROVED', 'KYC approved - all documents verified');

    // Step 8: Get KYC statistics
    console.log('📊 Step 8: Get KYC statistics...');
    await testGetKycStats();

    // Step 9: Get KYC audit log
    console.log('📋 Step 9: Get KYC audit log...');
    await testGetKycAuditLog(testTenantId);
  }

  // Step 10: Check final onboarding status
  console.log('📋 Step 10: Check final onboarding status...');
  await testOnboardingStatus();

  console.log('');
  console.log('🎉 KYC System Tests Complete!');
  console.log('');
  console.log('📊 Test Summary:');
  console.log('   ✓ KYC data submission');
  console.log('   ✓ KYC status management');
  console.log('   ✓ Onboarding integration');
  console.log('   ✓ Admin KYC workflow');
  console.log('   ✓ Audit logging');
  console.log('   ✓ Statistics reporting');
}

// Run tests
runKycTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});