const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Performance test configuration
const PERFORMANCE_CONFIG = {
  adminEmail: 'admin@urutix.com',
  adminPassword: 'admin123',
  tenantEmail: 'deborah@deborah.com',
  tenantPassword: 'deborah123',
  concurrentUsers: 10,
  operationsPerUser: 5,
  maxResponseTime: 2000, // 2 seconds
  maxConcurrentResponseTime: 5000, // 5 seconds under load
};

let adminToken = '';
let tenantToken = '';
let testTenantIds = [];

// Performance metrics
const performanceMetrics = {
  kycSubmission: [],
  statusUpdate: [],
  documentRetrieval: [],
  auditLogRetrieval: [],
  statsRetrieval: [],
  concurrentOperations: []
};

async function login(email, password) {
  const startTime = performance.now();
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    const endTime = performance.now();
    console.log(`✅ Login successful (${(endTime - startTime).toFixed(2)}ms)`);
    return response.data.access_token;
  } catch (error) {
    console.error(`❌ Login failed:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function createTestTenants(count) {
  console.log(`🏢 Creating ${count} test tenants for performance testing...`);
  const tenants = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const tenantData = {
        name: `Performance Test Tenant ${i + 1}`,
        type: 'SMALL_BUSINESS',
        contactEmail: `perf-test-${i + 1}@tenant.com`,
        contactPhone: `+1-555-${String(i + 1).padStart(4, '0')}`,
        address: `${i + 1} Performance Test Street`,
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345'
      };

      const response = await axios.post(`${BASE_URL}/admin/tenants`, tenantData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      tenants.push(response.data.data);
      testTenantIds.push(response.data.data.id);
    } catch (error) {
      console.error(`❌ Failed to create tenant ${i + 1}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`✅ Created ${tenants.length} test tenants`);
  return tenants;
}

async function measureKycSubmission(tenantId, iteration) {
  const kycData = {
    registrationNumber: `PERF-REG-${tenantId}-${iteration}`,
    taxId: `PERF-TAX-${tenantId}-${iteration}`,
    businessType: 'LOGISTICS',
    businessDescription: `Performance test business ${iteration}`,
    companyAddress: `${iteration} Performance Test Address`,
    contactPerson: `Test Person ${iteration}`,
    contactPhone: `+1-555-${String(iteration).padStart(4, '0')}`,
    contactEmail: `test-${iteration}@perftest.com`,
    bankAccountNumber: `PERF-BANK-${iteration}`,
    bankName: 'Performance Test Bank',
    additionalInfo: {
      iteration,
      timestamp: new Date().toISOString()
    }
  };

  const startTime = performance.now();
  try {
    const response = await axios.post(`${BASE_URL}/kyc/submit`, kycData, {
      headers: { Authorization: `Bearer ${tenantToken}` },
    });
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    performanceMetrics.kycSubmission.push(responseTime);
    return { success: true, responseTime, data: response.data };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    console.error(`❌ KYC submission failed for tenant ${tenantId}:`, error.response?.data?.message || error.message);
    return { success: false, responseTime, error: error.message };
  }
}

async function measureStatusUpdate(tenantId, status, iteration) {
  const startTime = performance.now();
  try {
    const response = await axios.put(`${BASE_URL}/kyc/${tenantId}/status`, {
      status,
      notes: `Performance test status update ${iteration}`
    }, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    performanceMetrics.statusUpdate.push(responseTime);
    return { success: true, responseTime, data: response.data };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    console.error(`❌ Status update failed for tenant ${tenantId}:`, error.response?.data?.message || error.message);
    return { success: false, responseTime, error: error.message };
  }
}

async function measureDocumentRetrieval(tenantId) {
  const startTime = performance.now();
  try {
    const response = await axios.get(`${BASE_URL}/kyc/${tenantId}/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    performanceMetrics.documentRetrieval.push(responseTime);
    return { success: true, responseTime, data: response.data };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    return { success: false, responseTime, error: error.message };
  }
}

async function measureAuditLogRetrieval(tenantId) {
  const startTime = performance.now();
  try {
    const response = await axios.get(`${BASE_URL}/kyc/${tenantId}/audit-log`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    performanceMetrics.auditLogRetrieval.push(responseTime);
    return { success: true, responseTime, data: response.data };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    return { success: false, responseTime, error: error.message };
  }
}

async function measureStatsRetrieval() {
  const startTime = performance.now();
  try {
    const response = await axios.get(`${BASE_URL}/kyc/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    performanceMetrics.statsRetrieval.push(responseTime);
    return { success: true, responseTime, data: response.data };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    return { success: false, responseTime, error: error.message };
  }
}

async function runSequentialPerformanceTests() {
  console.log('📊 Running sequential performance tests...');
  
  if (testTenantIds.length === 0) {
    console.log('❌ No test tenants available');
    return;
  }

  const tenantId = testTenantIds[0];
  
  // Test KYC submission performance
  console.log('📝 Testing KYC submission performance...');
  for (let i = 0; i < 10; i++) {
    await measureKycSubmission(tenantId, i + 1);
  }
  
  // Test status update performance
  console.log('📝 Testing status update performance...');
  const statuses = ['UNDER_REVIEW', 'INCOMPLETE', 'SUBMITTED', 'APPROVED'];
  for (let i = 0; i < statuses.length; i++) {
    await measureStatusUpdate(tenantId, statuses[i], i + 1);
  }
  
  // Test document retrieval performance
  console.log('📄 Testing document retrieval performance...');
  for (let i = 0; i < 5; i++) {
    await measureDocumentRetrieval(tenantId);
  }
  
  // Test audit log retrieval performance
  console.log('📋 Testing audit log retrieval performance...');
  for (let i = 0; i < 5; i++) {
    await measureAuditLogRetrieval(tenantId);
  }
  
  // Test stats retrieval performance
  console.log('📊 Testing stats retrieval performance...');
  for (let i = 0; i < 5; i++) {
    await measureStatsRetrieval();
  }
}

async function runConcurrentPerformanceTests() {
  console.log('🚀 Running concurrent performance tests...');
  
  const concurrentOperations = [];
  const startTime = performance.now();
  
  // Create concurrent operations
  for (let i = 0; i < PERFORMANCE_CONFIG.concurrentUsers; i++) {
    const tenantId = testTenantIds[i % testTenantIds.length];
    
    // Each user performs multiple operations
    for (let j = 0; j < PERFORMANCE_CONFIG.operationsPerUser; j++) {
      concurrentOperations.push(measureKycSubmission(tenantId, `${i}-${j}`));
      concurrentOperations.push(measureDocumentRetrieval(tenantId));
      concurrentOperations.push(measureAuditLogRetrieval(tenantId));
    }
  }
  
  // Execute all operations concurrently
  const results = await Promise.allSettled(concurrentOperations);
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  // Analyze results
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  performanceMetrics.concurrentOperations.push({
    totalOperations: results.length,
    successful,
    failed,
    totalTime,
    operationsPerSecond: (results.length / (totalTime / 1000)).toFixed(2)
  });
  
  console.log(`✅ Concurrent test completed: ${successful}/${results.length} operations successful`);
  console.log(`⏱️ Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`🚀 Operations per second: ${(results.length / (totalTime / 1000)).toFixed(2)}`);
}

function calculateStatistics(measurements) {
  if (measurements.length === 0) return null;
  
  const sorted = measurements.sort((a, b) => a - b);
  const sum = measurements.reduce((a, b) => a + b, 0);
  
  return {
    count: measurements.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    average: sum / measurements.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
}

function printPerformanceReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 KYC PERFORMANCE TEST REPORT');
  console.log('='.repeat(80));
  
  const operations = [
    { name: 'KYC Submission', data: performanceMetrics.kycSubmission },
    { name: 'Status Update', data: performanceMetrics.statusUpdate },
    { name: 'Document Retrieval', data: performanceMetrics.documentRetrieval },
    { name: 'Audit Log Retrieval', data: performanceMetrics.auditLogRetrieval },
    { name: 'Stats Retrieval', data: performanceMetrics.statsRetrieval }
  ];
  
  operations.forEach(op => {
    const stats = calculateStatistics(op.data);
    if (stats) {
      console.log(`\n📋 ${op.name}:`);
      console.log(`   Operations: ${stats.count}`);
      console.log(`   Average: ${stats.average.toFixed(2)}ms`);
      console.log(`   Median: ${stats.median.toFixed(2)}ms`);
      console.log(`   Min: ${stats.min.toFixed(2)}ms`);
      console.log(`   Max: ${stats.max.toFixed(2)}ms`);
      console.log(`   95th percentile: ${stats.p95.toFixed(2)}ms`);
      console.log(`   99th percentile: ${stats.p99.toFixed(2)}ms`);
      
      // Performance assessment
      const avgTime = stats.average;
      const maxAllowed = PERFORMANCE_CONFIG.maxResponseTime;
      const status = avgTime <= maxAllowed ? '✅ GOOD' : '⚠️ SLOW';
      console.log(`   Performance: ${status} (${avgTime.toFixed(2)}ms avg, ${maxAllowed}ms target)`);
    }
  });
  
  // Concurrent operations report
  if (performanceMetrics.concurrentOperations.length > 0) {
    console.log('\n📋 Concurrent Operations:');
    performanceMetrics.concurrentOperations.forEach((test, index) => {
      console.log(`   Test ${index + 1}:`);
      console.log(`     Total Operations: ${test.totalOperations}`);
      console.log(`     Successful: ${test.successful}`);
      console.log(`     Failed: ${test.failed}`);
      console.log(`     Success Rate: ${((test.successful / test.totalOperations) * 100).toFixed(1)}%`);
      console.log(`     Total Time: ${test.totalTime.toFixed(2)}ms`);
      console.log(`     Operations/sec: ${test.operationsPerSecond}`);
    });
  }
  
  console.log('\n📊 Performance Thresholds:');
  console.log(`   Target Response Time: ${PERFORMANCE_CONFIG.maxResponseTime}ms`);
  console.log(`   Target Concurrent Response Time: ${PERFORMANCE_CONFIG.maxConcurrentResponseTime}ms`);
  console.log(`   Concurrent Users Tested: ${PERFORMANCE_CONFIG.concurrentUsers}`);
  console.log(`   Operations Per User: ${PERFORMANCE_CONFIG.operationsPerUser}`);
  
  console.log('\n' + '='.repeat(80));
}

async function cleanupPerformanceTestData() {
  console.log('🧹 Cleaning up performance test data...');
  
  let cleaned = 0;
  for (const tenantId of testTenantIds) {
    try {
      await axios.delete(`${BASE_URL}/admin/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      cleaned++;
    } catch (error) {
      console.error(`❌ Failed to cleanup tenant ${tenantId}:`, error.response?.data?.message || error.message);
    }
  }
  
  console.log(`✅ Cleaned up ${cleaned}/${testTenantIds.length} test tenants`);
}

async function runKycPerformanceTests() {
  console.log('🚀 STARTING KYC PERFORMANCE TESTS');
  console.log('='.repeat(80));
  
  try {
    // Phase 1: Authentication
    console.log('\n📋 PHASE 1: AUTHENTICATION');
    adminToken = await login(PERFORMANCE_CONFIG.adminEmail, PERFORMANCE_CONFIG.adminPassword);
    tenantToken = await login(PERFORMANCE_CONFIG.tenantEmail, PERFORMANCE_CONFIG.tenantPassword);
    
    if (!adminToken || !tenantToken) {
      console.log('❌ Authentication failed, cannot continue tests');
      return;
    }
    
    // Phase 2: Test Data Setup
    console.log('\n📋 PHASE 2: TEST DATA SETUP');
    await createTestTenants(Math.max(PERFORMANCE_CONFIG.concurrentUsers, 5));
    
    if (testTenantIds.length === 0) {
      console.log('❌ No test tenants created, cannot continue tests');
      return;
    }
    
    // Phase 3: Sequential Performance Tests
    console.log('\n📋 PHASE 3: SEQUENTIAL PERFORMANCE TESTS');
    await runSequentialPerformanceTests();
    
    // Phase 4: Concurrent Performance Tests
    console.log('\n📋 PHASE 4: CONCURRENT PERFORMANCE TESTS');
    await runConcurrentPerformanceTests();
    
    // Phase 5: Performance Report
    console.log('\n📋 PHASE 5: PERFORMANCE ANALYSIS');
    printPerformanceReport();
    
    // Phase 6: Cleanup
    console.log('\n📋 PHASE 6: CLEANUP');
    await cleanupPerformanceTestData();
    
  } catch (error) {
    console.error('❌ Performance test suite encountered an error:', error.message);
  }
}

// Run performance tests
if (require.main === module) {
  runKycPerformanceTests().catch(error => {
    console.error('❌ Performance test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runKycPerformanceTests,
  performanceMetrics,
  PERFORMANCE_CONFIG
};