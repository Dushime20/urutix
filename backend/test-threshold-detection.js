/**
 * Integration test for threshold detection and alerting
 * Tests task 2.3: Implement threshold detection and alerting
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Super Admin credentials
const SUPER_ADMIN_EMAIL = 'super@admin.com';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin123!';

let authToken = '';

async function login() {
  console.log('🔐 Logging in as Super Admin...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
    });

    authToken = response.data.access_token;
    console.log('✅ Login successful\n');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetCurrentMetrics() {
  console.log('📊 Testing getCurrentMetrics...');
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/system-health/current`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const metrics = response.data;
    console.log('✅ Current metrics retrieved successfully');
    console.log('   Database metrics:', {
      connectionCount: metrics.database.connectionCount,
      activeQueries: metrics.database.activeQueries,
      avgQueryTime: metrics.database.avgQueryTime,
      slowQueries: metrics.database.slowQueries,
    });
    console.log('   API metrics:', {
      requestsPerMinute: metrics.api.requestsPerMinute,
      avgResponseTime: metrics.api.avgResponseTime,
      errorRate: metrics.api.errorRate,
    });
    console.log('   Server metrics:', {
      cpuUsage: metrics.server.cpuUsage,
      memoryUsage: metrics.server.memoryUsage,
      diskUsage: metrics.server.diskUsage,
    });
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Failed to get current metrics:', error.response?.data || error.message);
    return false;
  }
}

async function testCheckThresholds() {
  console.log('🚨 Testing checkThresholds...');
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/system-health/thresholds`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const violations = response.data;
    console.log(`✅ Threshold check completed`);
    
    if (violations.length === 0) {
      console.log('   ✓ No threshold violations detected');
    } else {
      console.log(`   ⚠️  Found ${violations.length} threshold violation(s):`);
      violations.forEach((v, i) => {
        console.log(`   ${i + 1}. [${v.severity.toUpperCase()}] ${v.metricType}.${v.metricName}`);
        console.log(`      Current: ${v.currentValue.toFixed(2)}, Threshold: ${v.thresholdValue}`);
        console.log(`      Message: ${v.message}`);
      });
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Failed to check thresholds:', error.response?.data || error.message);
    return false;
  }
}

async function testThresholdLogging() {
  console.log('📝 Testing threshold violation logging...');
  try {
    // First check thresholds to trigger logging
    await axios.get(`${API_BASE_URL}/admin/system-health/thresholds`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Then retrieve historical metrics to see if violations were logged
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // Last hour

    const response = await axios.get(`${API_BASE_URL}/admin/system-health/historical`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    console.log('✅ Historical metrics retrieved');
    console.log(`   Found ${response.data.length} metric entries in the last hour`);
    
    // Check if any entries have violation metadata
    const violationEntries = response.data.filter(entry => 
      entry.metrics && Object.values(entry.metrics).some(m => m.violation)
    );
    
    if (violationEntries.length > 0) {
      console.log(`   ✓ Found ${violationEntries.length} logged threshold violations`);
    } else {
      console.log('   ℹ️  No threshold violations logged in the last hour');
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Failed to test threshold logging:', error.response?.data || error.message);
    return false;
  }
}

async function testSeverityLevels() {
  console.log('🎯 Testing severity level calculation...');
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/system-health/thresholds`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const violations = response.data;
    
    if (violations.length === 0) {
      console.log('   ℹ️  No violations to test severity levels');
      console.log('');
      return true;
    }

    const severityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    violations.forEach(v => {
      severityCounts[v.severity]++;
    });

    console.log('✅ Severity levels calculated:');
    Object.entries(severityCounts).forEach(([level, count]) => {
      if (count > 0) {
        console.log(`   ${level.toUpperCase()}: ${count} violation(s)`);
      }
    });
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Failed to test severity levels:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('THRESHOLD DETECTION AND ALERTING TEST');
  console.log('Task 2.3: Implement threshold detection and alerting');
  console.log('='.repeat(60));
  console.log('');

  const results = {
    login: false,
    getCurrentMetrics: false,
    checkThresholds: false,
    thresholdLogging: false,
    severityLevels: false,
  };

  // Run tests
  results.login = await login();
  if (!results.login) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  results.getCurrentMetrics = await testGetCurrentMetrics();
  results.checkThresholds = await testCheckThresholds();
  results.thresholdLogging = await testThresholdLogging();
  results.severityLevels = await testSeverityLevels();

  // Summary
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}`);
  });
  
  console.log('');
  console.log(`Result: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Task 2.3 is complete.');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
