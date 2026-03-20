const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Test configuration
const TEST_CONFIG = {
  superAdminEmail: 'admin@urutix.com',
  superAdminPassword: 'admin123',
  tenantAdminEmail: 'deborah@deborah.com',
  tenantAdminPassword: 'deborah123',
  testTenantEmail: 'test-kyc@tenant.com',
  testTenantPassword: 'tenant123',
};

// Test data
const KYC_TEST_DATA = {
  valid: {
    registrationNumber: 'REG2024001',
    taxId: 'TAX123456789',
    businessType: 'LOGISTICS',
    businessDescription: 'Full-service transportation and logistics company',
    companyAddress: '123 Business Park, Suite 100, Business City, BC 12345',
    contactPerson: 'John Smith',
    contactPhone: '+1-555-0123',
    contactEmail: 'john.smith@testcompany.com',
    bankAccountNumber: 'ACC123456789',
    bankName: 'First National Bank',
    additionalInfo: {
      yearsInBusiness: 8,
      numberOfEmployees: 45,
      annualRevenue: 2500000,
      businessLicenseNumber: 'BL2024001',
      insurancePolicyNumber: 'INS789456123'
    }
  },
  invalid: {
    // Missing required fields
    businessDescription: 'Incomplete KYC data',
    contactPhone: '+1-555-0000'
  },
  update: {
    registrationNumber: 'REG2024001-UPDATED',
    taxId: 'TAX123456789',
    businessType: 'LOGISTICS',
    businessDescription: 'Updated full-service transportation and logistics company',
    companyAddress: '456 Updated Business Park, Suite 200, New City, NC 54321',
    contactPerson: 'Jane Smith',
    contactPhone: '+1-555-0456',
    contactEmail: 'jane.smith@testcompany.com',
    bankAccountNumber: 'ACC987654321',
    bankName: 'Second National Bank',
    additionalInfo: {
      yearsInBusiness: 10,
      numberOfEmployees: 60,
      annualRevenue: 3500000,
      businessLicenseNumber: 'BL2024002',
      insurancePolicyNumber: 'INS456789123'
    }
  }
};

// Document types for testing
const DOCUMENT_TYPES = [
  'BUSINESS_LICENSE',
  'TAX_CERTIFICATE',
  'IDENTITY_DOCUMENT',
  'BANK_STATEMENT',
  'PROOF_OF_ADDRESS',
  'INSURANCE_CERTIFICATE'
];

let superAdminToken = '';
let tenantAdminToken = '';
let testTenantId = '';
let uploadedDocuments = [];
let auditLogEntries = [];

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(testName, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED ${message ? '- ' + message : ''}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED ${message ? '- ' + message : ''}`);
  }
  testResults.details.push({ testName, passed, message });
}

async function login(email, password, description) {
  try {
    console.log(`🔐 Logging in as ${description}...`);
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    
    logTest(`Login - ${description}`, true, `Token obtained`);
    return response.data.access_token;
  } catch (error) {
    logTest(`Login - ${description}`, false, error.response?.data?.message || error.message);
    return null;
  }
}

async function createTestTenant() {
  try {
    console.log('🏢 Creating test tenant...');
    
    // First check if tenant already exists
    try {
      const existingResponse = await axios.get(`${BASE_URL}/admin/tenants`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
        params: { search: 'Test KYC Tenant' }
      });
      
      const existingTenant = existingResponse.data.data?.find(t => t.name === 'Test KYC Tenant');
      if (existingTenant) {
        testTenantId = existingTenant.id;
        logTest('Create Test Tenant', true, `Using existing tenant: ${testTenantId}`);
        return existingTenant;
      }
    } catch (error) {
      // Tenant doesn't exist, continue with creation
    }

    const tenantData = {
      name: 'Test KYC Tenant',
      type: 'SMALL_BUSINESS',
      contactEmail: TEST_CONFIG.testTenantEmail,
      contactPhone: '+1-555-0199',
      address: '789 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345'
    };

    const response = await axios.post(`${BASE_URL}/admin/tenants`, tenantData, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    testTenantId = response.data.data.id;
    logTest('Create Test Tenant', true, `Tenant created: ${testTenantId}`);
    return response.data.data;
  } catch (error) {
    logTest('Create Test Tenant', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testKycSubmission(kycData, shouldSucceed = true, testName = 'KYC Submission') {
  try {
    console.log(`📝 Testing ${testName}...`);
    
    const response = await axios.post(`${BASE_URL}/kyc/submit`, kycData, {
      headers: { Authorization: `Bearer ${tenantAdminToken}` },
    });

    if (shouldSucceed) {
      logTest(testName, true, `Status: ${response.data.data.kycStatus}`);
      return response.data.data;
    } else {
      logTest(testName, false, 'Expected failure but request succeeded');
      return null;
    }
  } catch (error) {
    if (!shouldSucceed) {
      logTest(testName, true, `Expected failure: ${error.response?.data?.message}`);
      return null;
    } else {
      logTest(testName, false, error.response?.data?.message || error.message);
      return null;
    }
  }
}

async function testKycStatusUpdate(tenantId, status, notes, shouldSucceed = true) {
  try {
    console.log(`📝 Testing KYC status update to ${status}...`);
    
    const response = await axios.put(`${BASE_URL}/kyc/${tenantId}/status`, {
      status,
      notes,
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    if (shouldSucceed) {
      logTest(`KYC Status Update - ${status}`, true, `Status updated successfully`);
      return response.data.data;
    } else {
      logTest(`KYC Status Update - ${status}`, false, 'Expected failure but request succeeded');
      return null;
    }
  } catch (error) {
    if (!shouldSucceed) {
      logTest(`KYC Status Update - ${status}`, true, `Expected failure: ${error.response?.data?.message}`);
      return null;
    } else {
      logTest(`KYC Status Update - ${status}`, false, error.response?.data?.message || error.message);
      return null;
    }
  }
}

async function createTestDocument(documentType) {
  // Create a simple test file
  const testContent = `Test ${documentType} document\nGenerated for KYC testing\nTimestamp: ${new Date().toISOString()}`;
  const fileName = `test-${documentType.toLowerCase()}.txt`;
  const filePath = path.join(__dirname, 'temp', fileName);
  
  // Ensure temp directory exists
  const tempDir = path.dirname(filePath);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, testContent);
  return { filePath, fileName };
}

async function testDocumentUpload(documentType, shouldSucceed = true) {
  try {
    console.log(`📄 Testing document upload - ${documentType}...`);
    
    const { filePath, fileName } = await createTestDocument(documentType);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('documentType', documentType);
    formData.append('documentName', `Test ${documentType} Document`);

    const response = await axios.post(`${BASE_URL}/kyc/${testTenantId}/documents`, formData, {
      headers: {
        Authorization: `Bearer ${tenantAdminToken}`,
        ...formData.getHeaders(),
      },
    });

    // Clean up test file
    fs.unlinkSync(filePath);

    if (shouldSucceed) {
      uploadedDocuments.push(response.data.data);
      logTest(`Document Upload - ${documentType}`, true, `Document ID: ${response.data.data.id}`);
      return response.data.data;
    } else {
      logTest(`Document Upload - ${documentType}`, false, 'Expected failure but request succeeded');
      return null;
    }
  } catch (error) {
    if (!shouldSucceed) {
      logTest(`Document Upload - ${documentType}`, true, `Expected failure: ${error.response?.data?.message}`);
      return null;
    } else {
      logTest(`Document Upload - ${documentType}`, false, error.response?.data?.message || error.message);
      return null;
    }
  }
}

async function testDocumentVerification(documentId, verified, notes, shouldSucceed = true) {
  try {
    console.log(`📄 Testing document verification - ${verified ? 'APPROVE' : 'REJECT'}...`);
    
    const response = await axios.put(`${BASE_URL}/kyc/documents/${documentId}/verify`, {
      verified,
      notes,
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    if (shouldSucceed) {
      logTest(`Document Verification - ${verified ? 'APPROVE' : 'REJECT'}`, true, `Document ${verified ? 'approved' : 'rejected'}`);
      return response.data.data;
    } else {
      logTest(`Document Verification - ${verified ? 'APPROVE' : 'REJECT'}`, false, 'Expected failure but request succeeded');
      return null;
    }
  } catch (error) {
    if (!shouldSucceed) {
      logTest(`Document Verification - ${verified ? 'APPROVE' : 'REJECT'}`, true, `Expected failure: ${error.response?.data?.message}`);
      return null;
    } else {
      logTest(`Document Verification - ${verified ? 'APPROVE' : 'REJECT'}`, false, error.response?.data?.message || error.message);
      return null;
    }
  }
}

async function testGetKycDocuments(tenantId, expectedCount = null) {
  try {
    console.log('📄 Testing get KYC documents...');
    
    const response = await axios.get(`${BASE_URL}/kyc/${tenantId}/documents`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    const documents = response.data.data;
    let passed = true;
    let message = `Found ${documents.length} documents`;
    
    if (expectedCount !== null && documents.length !== expectedCount) {
      passed = false;
      message = `Expected ${expectedCount} documents, found ${documents.length}`;
    }

    logTest('Get KYC Documents', passed, message);
    return documents;
  } catch (error) {
    logTest('Get KYC Documents', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetKycAuditLog(tenantId, expectedMinEntries = 1) {
  try {
    console.log('📋 Testing get KYC audit log...');
    
    const response = await axios.get(`${BASE_URL}/kyc/${tenantId}/audit-log`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    const auditEntries = response.data.data;
    auditLogEntries = auditEntries;
    
    let passed = auditEntries.length >= expectedMinEntries;
    let message = `Found ${auditEntries.length} audit entries`;
    
    if (!passed) {
      message = `Expected at least ${expectedMinEntries} entries, found ${auditEntries.length}`;
    }

    logTest('Get KYC Audit Log', passed, message);
    return auditEntries;
  } catch (error) {
    logTest('Get KYC Audit Log', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetPendingKyc() {
  try {
    console.log('📋 Testing get pending KYC...');
    
    const response = await axios.get(`${BASE_URL}/kyc/pending`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    const pendingTenants = response.data.data;
    logTest('Get Pending KYC', true, `Found ${pendingTenants.length} pending tenants`);
    return pendingTenants;
  } catch (error) {
    logTest('Get Pending KYC', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetKycStats() {
  try {
    console.log('📊 Testing get KYC statistics...');
    
    const response = await axios.get(`${BASE_URL}/kyc/stats`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    const stats = response.data.data;
    const hasValidStats = stats.total >= 0 && 
                         stats.pending >= 0 && 
                         stats.submitted >= 0 && 
                         stats.approved >= 0;
    
    logTest('Get KYC Statistics', hasValidStats, `Total: ${stats.total}, Approved: ${stats.approved}`);
    return stats;
  } catch (error) {
    logTest('Get KYC Statistics', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testUnauthorizedAccess() {
  console.log('🔒 Testing unauthorized access scenarios...');
  
  // Test 1: Submit KYC without token
  try {
    await axios.post(`${BASE_URL}/kyc/submit`, KYC_TEST_DATA.valid);
    logTest('Unauthorized KYC Submit', false, 'Should have been rejected');
  } catch (error) {
    logTest('Unauthorized KYC Submit', true, 'Correctly rejected unauthorized request');
  }

  // Test 2: Update KYC status with tenant token (should fail)
  try {
    await axios.put(`${BASE_URL}/kyc/${testTenantId}/status`, {
      status: 'APPROVED',
      notes: 'Unauthorized attempt'
    }, {
      headers: { Authorization: `Bearer ${tenantAdminToken}` },
    });
    logTest('Unauthorized Status Update', false, 'Should have been rejected');
  } catch (error) {
    logTest('Unauthorized Status Update', true, 'Correctly rejected unauthorized request');
  }

  // Test 3: Access other tenant's documents
  try {
    await axios.get(`${BASE_URL}/kyc/different-tenant-id/documents`, {
      headers: { Authorization: `Bearer ${tenantAdminToken}` },
    });
    logTest('Unauthorized Document Access', false, 'Should have been rejected');
  } catch (error) {
    logTest('Unauthorized Document Access', true, 'Correctly rejected unauthorized request');
  }
}

async function testKycWorkflowIntegration() {
  console.log('🔄 Testing complete KYC workflow integration...');
  
  // Test the complete workflow from submission to approval
  let currentTenant = null;
  
  // Step 1: Submit KYC
  currentTenant = await testKycSubmission(KYC_TEST_DATA.valid, true, 'Workflow - Initial Submission');
  
  if (!currentTenant) return;
  
  // Step 2: Move to Under Review
  currentTenant = await testKycStatusUpdate(testTenantId, 'UNDER_REVIEW', 'Starting review process');
  
  // Step 3: Upload documents
  for (const docType of DOCUMENT_TYPES.slice(0, 3)) { // Upload first 3 document types
    await testDocumentUpload(docType);
  }
  
  // Step 4: Verify some documents
  if (uploadedDocuments.length > 0) {
    await testDocumentVerification(uploadedDocuments[0].id, true, 'Document verified successfully');
    if (uploadedDocuments.length > 1) {
      await testDocumentVerification(uploadedDocuments[1].id, false, 'Document needs revision');
    }
  }
  
  // Step 5: Final approval
  currentTenant = await testKycStatusUpdate(testTenantId, 'APPROVED', 'KYC process completed successfully');
  
  // Step 6: Verify audit trail
  const auditEntries = await testGetKycAuditLog(testTenantId, 5); // Expect at least 5 entries
  
  if (auditEntries) {
    const hasSubmission = auditEntries.some(entry => entry.action === 'SUBMITTED');
    const hasApproval = auditEntries.some(entry => entry.action === 'APPROVED');
    const hasDocumentUpload = auditEntries.some(entry => entry.action === 'DOCUMENT_UPLOADED');
    
    logTest('Workflow - Audit Trail Completeness', 
      hasSubmission && hasApproval && hasDocumentUpload,
      'All expected audit actions found');
  }
}

async function testDataValidation() {
  console.log('✅ Testing data validation...');
  
  // Test invalid KYC data
  await testKycSubmission(KYC_TEST_DATA.invalid, false, 'Validation - Invalid Data');
  
  // Test empty KYC data
  await testKycSubmission({}, false, 'Validation - Empty Data');
  
  // Test invalid status update
  await testKycStatusUpdate(testTenantId, 'INVALID_STATUS', 'Invalid status test', false);
  
  // Test document upload without file (would need different approach in real test)
  // This is handled by the multipart form validation
}

async function testEdgeCases() {
  console.log('🔍 Testing edge cases...');
  
  // Test 1: Update KYC data after submission
  await testKycSubmission(KYC_TEST_DATA.update, true, 'Edge Case - Update After Submission');
  
  // Test 2: Multiple status updates
  await testKycStatusUpdate(testTenantId, 'UNDER_REVIEW', 'Second review');
  await testKycStatusUpdate(testTenantId, 'INCOMPLETE', 'Missing documents');
  await testKycStatusUpdate(testTenantId, 'SUBMITTED', 'Resubmitted with corrections');
  
  // Test 3: Non-existent tenant
  await testKycStatusUpdate('non-existent-id', 'APPROVED', 'Should fail', false);
  
  // Test 4: Non-existent document verification
  await testDocumentVerification('non-existent-doc-id', true, 'Should fail', false);
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Clean up uploaded test files
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    // Note: In a real test environment, you might want to clean up the test tenant
    // For now, we'll leave it for manual inspection
    
    logTest('Cleanup', true, 'Test data cleaned up successfully');
  } catch (error) {
    logTest('Cleanup', false, error.message);
  }
}

function printTestSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TENANT KYC INTEGRATION TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => console.log(`   • ${test.testName}: ${test.message}`));
  }
  
  console.log('\n📋 TEST COVERAGE:');
  console.log('   ✓ Authentication & Authorization');
  console.log('   ✓ KYC Data Submission & Validation');
  console.log('   ✓ Status Management Workflow');
  console.log('   ✓ Document Upload & Verification');
  console.log('   ✓ Audit Trail & Logging');
  console.log('   ✓ Admin Functions & Statistics');
  console.log('   ✓ Security & Access Control');
  console.log('   ✓ Edge Cases & Error Handling');
  console.log('   ✓ End-to-End Workflow Integration');
  
  if (testTenantId) {
    console.log(`\n🏢 Test Tenant ID: ${testTenantId}`);
    console.log(`📄 Documents Uploaded: ${uploadedDocuments.length}`);
    console.log(`📋 Audit Log Entries: ${auditLogEntries.length}`);
  }
  
  console.log('\n' + '='.repeat(80));
}

async function runTenantKycIntegrationTests() {
  console.log('🧪 STARTING TENANT KYC INTEGRATION TESTS');
  console.log('='.repeat(80));
  
  try {
    // Phase 1: Authentication Setup
    console.log('\n📋 PHASE 1: AUTHENTICATION SETUP');
    superAdminToken = await login(TEST_CONFIG.superAdminEmail, TEST_CONFIG.superAdminPassword, 'Super Admin');
    tenantAdminToken = await login(TEST_CONFIG.tenantAdminEmail, TEST_CONFIG.tenantAdminPassword, 'Tenant Admin');
    
    if (!superAdminToken || !tenantAdminToken) {
      console.log('❌ Authentication failed, cannot continue tests');
      return;
    }
    
    // Phase 2: Test Data Setup
    console.log('\n📋 PHASE 2: TEST DATA SETUP');
    await createTestTenant();
    
    if (!testTenantId) {
      console.log('❌ Test tenant creation failed, cannot continue tests');
      return;
    }
    
    // Phase 3: Core KYC Functionality Tests
    console.log('\n📋 PHASE 3: CORE KYC FUNCTIONALITY');
    await testKycSubmission(KYC_TEST_DATA.valid);
    await testKycStatusUpdate(testTenantId, 'UNDER_REVIEW', 'Initial review started');
    await testKycStatusUpdate(testTenantId, 'APPROVED', 'KYC approved after review');
    
    // Phase 4: Document Management Tests
    console.log('\n📋 PHASE 4: DOCUMENT MANAGEMENT');
    for (const docType of DOCUMENT_TYPES.slice(0, 4)) {
      await testDocumentUpload(docType);
    }
    
    if (uploadedDocuments.length > 0) {
      await testDocumentVerification(uploadedDocuments[0].id, true, 'First document approved');
      if (uploadedDocuments.length > 1) {
        await testDocumentVerification(uploadedDocuments[1].id, false, 'Second document rejected');
      }
    }
    
    await testGetKycDocuments(testTenantId, uploadedDocuments.length);
    
    // Phase 5: Admin Functions Tests
    console.log('\n📋 PHASE 5: ADMIN FUNCTIONS');
    await testGetPendingKyc();
    await testGetKycStats();
    await testGetKycAuditLog(testTenantId);
    
    // Phase 6: Security & Authorization Tests
    console.log('\n📋 PHASE 6: SECURITY & AUTHORIZATION');
    await testUnauthorizedAccess();
    
    // Phase 7: Data Validation Tests
    console.log('\n📋 PHASE 7: DATA VALIDATION');
    await testDataValidation();
    
    // Phase 8: Edge Cases Tests
    console.log('\n📋 PHASE 8: EDGE CASES');
    await testEdgeCases();
    
    // Phase 9: Complete Workflow Integration Test
    console.log('\n📋 PHASE 9: WORKFLOW INTEGRATION');
    await testKycWorkflowIntegration();
    
    // Phase 10: Cleanup
    console.log('\n📋 PHASE 10: CLEANUP');
    await cleanupTestData();
    
  } catch (error) {
    console.error('❌ Test suite encountered an error:', error.message);
    logTest('Test Suite Execution', false, error.message);
  } finally {
    printTestSummary();
  }
}

// Run the integration tests
if (require.main === module) {
  runTenantKycIntegrationTests().catch(error => {
    console.error('❌ Integration test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runTenantKycIntegrationTests,
  testResults,
  TEST_CONFIG,
  KYC_TEST_DATA
};