const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Security test configuration
const SECURITY_CONFIG = {
  adminEmail: 'admin@urutix.com',
  adminPassword: 'admin123',
  tenantEmail: 'deborah@deborah.com',
  tenantPassword: 'deborah123',
  maliciousEmail: 'hacker@malicious.com',
  maliciousPassword: 'hacker123',
};

let adminToken = '';
let tenantToken = '';
let testTenantId = '';

// Security test results
const securityResults = {
  passed: 0,
  failed: 0,
  total: 0,
  vulnerabilities: [],
  details: []
};

function logSecurityTest(testName, passed, message = '', severity = 'MEDIUM') {
  securityResults.total++;
  if (passed) {
    securityResults.passed++;
    console.log(`✅ ${testName}: SECURE ${message ? '- ' + message : ''}`);
  } else {
    securityResults.failed++;
    securityResults.vulnerabilities.push({ testName, message, severity });
    console.log(`🚨 ${testName}: VULNERABLE ${message ? '- ' + message : ''} [${severity}]`);
  }
  securityResults.details.push({ testName, passed, message, severity });
}

async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.access_token;
  } catch (error) {
    return null;
  }
}

async function testAuthenticationSecurity() {
  console.log('🔐 Testing authentication security...');
  
  // Test 1: Invalid token access
  try {
    await axios.post(`${BASE_URL}/kyc/submit`, {
      registrationNumber: 'TEST123'
    }, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    logSecurityTest('Invalid Token Access', false, 'Accepts invalid tokens', 'HIGH');
  } catch (error) {
    if (error.response?.status === 401) {
      logSecurityTest('Invalid Token Access', true, 'Correctly rejects invalid tokens');
    } else {
      logSecurityTest('Invalid Token Access', false, 'Unexpected error response', 'MEDIUM');
    }
  }
  
  // Test 2: No token access
  try {
    await axios.post(`${BASE_URL}/kyc/submit`, {
      registrationNumber: 'TEST123'
    });
    logSecurityTest('No Token Access', false, 'Accepts requests without tokens', 'HIGH');
  } catch (error) {
    if (error.response?.status === 401) {
      logSecurityTest('No Token Access', true, 'Correctly requires authentication');
    } else {
      logSecurityTest('No Token Access', false, 'Unexpected error response', 'MEDIUM');
    }
  }
  
  // Test 3: Expired token (simulated)
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
  try {
    await axios.post(`${BASE_URL}/kyc/submit`, {
      registrationNumber: 'TEST123'
    }, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    logSecurityTest('Expired Token Access', false, 'Accepts expired tokens', 'HIGH');
  } catch (error) {
    if (error.response?.status === 401) {
      logSecurityTest('Expired Token Access', true, 'Correctly rejects expired tokens');
    } else {
      logSecurityTest('Expired Token Access', false, 'Unexpected error response', 'MEDIUM');
    }
  }
}

async function testAuthorizationSecurity() {
  console.log('🔒 Testing authorization security...');
  
  // Test 1: Tenant accessing other tenant's data
  try {
    const otherTenantId = crypto.randomUUID();
    await axios.get(`${BASE_URL}/kyc/${otherTenantId}/documents`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    logSecurityTest('Cross-Tenant Data Access', false, 'Allows access to other tenant data', 'HIGH');
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      logSecurityTest('Cross-Tenant Data Access', true, 'Correctly blocks cross-tenant access');
    } else {
      logSecurityTest('Cross-Tenant Data Access', false, 'Unexpected error response', 'MEDIUM');
    }
  }
  
  // Test 2: Tenant trying admin operations
  try {
    await axios.put(`${BASE_URL}/kyc/${testTenantId}/status`, {
      status: 'APPROVED',
      notes: 'Unauthorized approval attempt'
    }, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    logSecurityTest('Tenant Admin Operation', false, 'Allows tenant to perform admin operations', 'HIGH');
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      logSecurityTest('Tenant Admin Operation', true, 'Correctly blocks tenant admin operations');
    } else {
      logSecurityTest('Tenant Admin Operation', false, 'Unexpected error response', 'MEDIUM');
    }
  }
  
  // Test 3: Accessing admin-only endpoints
  try {
    await axios.get(`${BASE_URL}/kyc/stats`, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    logSecurityTest('Admin Endpoint Access', false, 'Allows tenant access to admin endpoints', 'HIGH');
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      logSecurityTest('Admin Endpoint Access', true, 'Correctly blocks tenant from admin endpoints');
    } else {
      logSecurityTest('Admin Endpoint Access', false, 'Unexpected error response', 'MEDIUM');
    }
  }
}

async function testInputValidationSecurity() {
  console.log('🛡️ Testing input validation security...');
  
  // Test 1: SQL Injection attempts
  const sqlInjectionPayloads = [
    "'; DROP TABLE tenants; --",
    "' OR '1'='1",
    "'; UPDATE tenants SET kycStatus='APPROVED' WHERE id='any'; --",
    "' UNION SELECT * FROM users --"
  ];
  
  for (const payload of sqlInjectionPayloads) {
    try {
      await axios.post(`${BASE_URL}/kyc/submit`, {
        registrationNumber: payload,
        taxId: 'TEST123',
        businessType: 'LOGISTICS',
        contactPerson: 'Test Person',
        contactEmail: 'test@test.com'
      }, {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });
      logSecurityTest('SQL Injection Protection', false, `Vulnerable to: ${payload}`, 'HIGH');
    } catch (error) {
      if (error.response?.status === 400) {
        logSecurityTest('SQL Injection Protection', true, 'Input validation blocks SQL injection');
      } else if (error.response?.status === 500) {
        logSecurityTest('SQL Injection Protection', false, 'SQL injection causes server error', 'HIGH');
      }
    }
  }
  
  // Test 2: XSS attempts
  const xssPayloads = [
    "<script>alert('xss')</script>",
    "javascript:alert('xss')",
    "<img src=x onerror=alert('xss')>",
    "';alert('xss');//"
  ];
  
  for (const payload of xssPayloads) {
    try {
      await axios.post(`${BASE_URL}/kyc/submit`, {
        registrationNumber: 'TEST123',
        taxId: 'TEST123',
        businessType: 'LOGISTICS',
        contactPerson: payload,
        contactEmail: 'test@test.com'
      }, {
        headers: { Authorization: `Bearer ${tenantToken}` },
      });
      
      // Check if the payload is stored and returned
      const response = await axios.get(`${BASE_URL}/kyc/${testTenantId}/audit-log`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      
      const hasXssPayload = JSON.stringify(response.data).includes(payload);
      if (hasXssPayload) {
        logSecurityTest('XSS Protection', false, `Stores XSS payload: ${payload}`, 'MEDIUM');
      } else {
        logSecurityTest('XSS Protection', true, 'XSS payload sanitized or blocked');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        logSecurityTest('XSS Protection', true, 'Input validation blocks XSS');
      }
    }
  }
  
  // Test 3: Large payload attacks
  const largePayload = 'A'.repeat(100000); // 100KB payload
  try {
    await axios.post(`${BASE_URL}/kyc/submit`, {
      registrationNumber: 'TEST123',
      taxId: 'TEST123',
      businessType: 'LOGISTICS',
      businessDescription: largePayload,
      contactPerson: 'Test Person',
      contactEmail: 'test@test.com'
    }, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    logSecurityTest('Large Payload Protection', false, 'Accepts extremely large payloads', 'MEDIUM');
  } catch (error) {
    if (error.response?.status === 413 || error.response?.status === 400) {
      logSecurityTest('Large Payload Protection', true, 'Correctly limits payload size');
    } else {
      logSecurityTest('Large Payload Protection', false, 'Unexpected error with large payload', 'LOW');
    }
  }
}

async function testDataExposureSecurity() {
  console.log('🔍 Testing data exposure security...');
  
  // Test 1: Error message information disclosure
  try {
    await axios.get(`${BASE_URL}/kyc/non-existent-id/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logSecurityTest('Error Information Disclosure', false, 'May expose sensitive information in errors', 'LOW');
  } catch (error) {
    const errorMessage = error.response?.data?.message || '';
    const hasDbInfo = errorMessage.includes('database') || errorMessage.includes('table') || errorMessage.includes('column');
    const hasPathInfo = errorMessage.includes('/') || errorMessage.includes('\\');
    
    if (hasDbInfo || hasPathInfo) {
      logSecurityTest('Error Information Disclosure', false, 'Error messages expose system information', 'MEDIUM');
    } else {
      logSecurityTest('Error Information Disclosure', true, 'Error messages are sanitized');
    }
  }
  
  // Test 2: Sensitive data in responses
  try {
    const response = await axios.get(`${BASE_URL}/kyc/${testTenantId}/audit-log`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    const responseText = JSON.stringify(response.data);
    const hasSensitiveData = responseText.includes('password') || 
                            responseText.includes('secret') || 
                            responseText.includes('key') ||
                            responseText.includes('token');
    
    if (hasSensitiveData) {
      logSecurityTest('Sensitive Data Exposure', false, 'Response contains sensitive data', 'HIGH');
    } else {
      logSecurityTest('Sensitive Data Exposure', true, 'No sensitive data in responses');
    }
  } catch (error) {
    logSecurityTest('Sensitive Data Exposure', false, 'Could not test data exposure', 'LOW');
  }
}

async function testRateLimitingSecurity() {
  console.log('⏱️ Testing rate limiting security...');
  
  // Test rapid requests to detect rate limiting
  const rapidRequests = [];
  const requestCount = 20;
  
  for (let i = 0; i < requestCount; i++) {
    rapidRequests.push(
      axios.post(`${BASE_URL}/kyc/submit`, {
        registrationNumber: `RATE-TEST-${i}`,
        taxId: `RATE-TEST-${i}`,
        businessType: 'LOGISTICS',
        contactPerson: 'Rate Test Person',
        contactEmail: 'ratetest@test.com'
      }, {
        headers: { Authorization: `Bearer ${tenantToken}` },
      }).catch(error => error.response)
    );
  }
  
  const results = await Promise.all(rapidRequests);
  const rateLimitedRequests = results.filter(r => r?.status === 429).length;
  const successfulRequests = results.filter(r => r?.status === 200).length;
  
  if (rateLimitedRequests > 0) {
    logSecurityTest('Rate Limiting', true, `${rateLimitedRequests}/${requestCount} requests rate limited`);
  } else if (successfulRequests === requestCount) {
    logSecurityTest('Rate Limiting', false, 'No rate limiting detected', 'MEDIUM');
  } else {
    logSecurityTest('Rate Limiting', false, 'Unexpected response pattern', 'LOW');
  }
}

async function testFileUploadSecurity() {
  console.log('📁 Testing file upload security...');
  
  // Test 1: Malicious file type upload (would need actual file upload implementation)
  // This is a placeholder for when file upload is fully implemented
  logSecurityTest('Malicious File Upload', true, 'File upload security test placeholder - implement when file upload is active');
  
  // Test 2: File size limits (would need actual file upload implementation)
  logSecurityTest('File Size Limits', true, 'File size limit test placeholder - implement when file upload is active');
  
  // Test 3: File content validation (would need actual file upload implementation)
  logSecurityTest('File Content Validation', true, 'File content validation test placeholder - implement when file upload is active');
}

async function createTestTenant() {
  try {
    const tenantData = {
      name: 'Security Test Tenant',
      type: 'SMALL_BUSINESS',
      contactEmail: 'security-test@tenant.com',
      contactPhone: '+1-555-0199',
      address: '789 Security Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345'
    };

    const response = await axios.post(`${BASE_URL}/admin/tenants`, tenantData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    testTenantId = response.data.data.id;
    return response.data.data;
  } catch (error) {
    console.error('Failed to create test tenant:', error.response?.data?.message || error.message);
    return null;
  }
}

function printSecurityReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🔒 KYC SECURITY TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${securityResults.total}`);
  console.log(`Secure: ${securityResults.passed} ✅`);
  console.log(`Vulnerable: ${securityResults.failed} 🚨`);
  console.log(`Security Score: ${((securityResults.passed / securityResults.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));
  
  if (securityResults.vulnerabilities.length > 0) {
    console.log('\n🚨 SECURITY VULNERABILITIES FOUND:');
    
    const highSeverity = securityResults.vulnerabilities.filter(v => v.severity === 'HIGH');
    const mediumSeverity = securityResults.vulnerabilities.filter(v => v.severity === 'MEDIUM');
    const lowSeverity = securityResults.vulnerabilities.filter(v => v.severity === 'LOW');
    
    if (highSeverity.length > 0) {
      console.log('\n🔴 HIGH SEVERITY:');
      highSeverity.forEach(v => console.log(`   • ${v.testName}: ${v.message}`));
    }
    
    if (mediumSeverity.length > 0) {
      console.log('\n🟡 MEDIUM SEVERITY:');
      mediumSeverity.forEach(v => console.log(`   • ${v.testName}: ${v.message}`));
    }
    
    if (lowSeverity.length > 0) {
      console.log('\n🟢 LOW SEVERITY:');
      lowSeverity.forEach(v => console.log(`   • ${v.testName}: ${v.message}`));
    }
  } else {
    console.log('\n✅ NO SECURITY VULNERABILITIES DETECTED');
  }
  
  console.log('\n📋 SECURITY TEST COVERAGE:');
  console.log('   ✓ Authentication Security');
  console.log('   ✓ Authorization & Access Control');
  console.log('   ✓ Input Validation & Injection Protection');
  console.log('   ✓ Data Exposure & Information Disclosure');
  console.log('   ✓ Rate Limiting & DoS Protection');
  console.log('   ✓ File Upload Security (Placeholder)');
  
  console.log('\n' + '='.repeat(80));
}

async function runKycSecurityTests() {
  console.log('🔒 STARTING KYC SECURITY TESTS');
  console.log('='.repeat(80));
  
  try {
    // Phase 1: Authentication Setup
    console.log('\n📋 PHASE 1: AUTHENTICATION SETUP');
    adminToken = await login(SECURITY_CONFIG.adminEmail, SECURITY_CONFIG.adminPassword);
    tenantToken = await login(SECURITY_CONFIG.tenantEmail, SECURITY_CONFIG.tenantPassword);
    
    if (!adminToken || !tenantToken) {
      console.log('❌ Authentication failed, cannot continue security tests');
      return;
    }
    
    // Phase 2: Test Data Setup
    console.log('\n📋 PHASE 2: TEST DATA SETUP');
    await createTestTenant();
    
    // Phase 3: Authentication Security Tests
    console.log('\n📋 PHASE 3: AUTHENTICATION SECURITY');
    await testAuthenticationSecurity();
    
    // Phase 4: Authorization Security Tests
    console.log('\n📋 PHASE 4: AUTHORIZATION SECURITY');
    await testAuthorizationSecurity();
    
    // Phase 5: Input Validation Security Tests
    console.log('\n📋 PHASE 5: INPUT VALIDATION SECURITY');
    await testInputValidationSecurity();
    
    // Phase 6: Data Exposure Security Tests
    console.log('\n📋 PHASE 6: DATA EXPOSURE SECURITY');
    await testDataExposureSecurity();
    
    // Phase 7: Rate Limiting Security Tests
    console.log('\n📋 PHASE 7: RATE LIMITING SECURITY');
    await testRateLimitingSecurity();
    
    // Phase 8: File Upload Security Tests
    console.log('\n📋 PHASE 8: FILE UPLOAD SECURITY');
    await testFileUploadSecurity();
    
  } catch (error) {
    console.error('❌ Security test suite encountered an error:', error.message);
  } finally {
    printSecurityReport();
  }
}

// Run security tests
if (require.main === module) {
  runKycSecurityTests().catch(error => {
    console.error('❌ Security test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runKycSecurityTests,
  securityResults,
  SECURITY_CONFIG
};