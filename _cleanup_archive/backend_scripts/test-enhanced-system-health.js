const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@urutix.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in as Super Admin...');
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
    });

    authToken = response.data.access_token || response.data.token;
    console.log('✅ Login successful!\n');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCurrentMetrics() {
  try {
    console.log('📊 Testing GET /admin/system-health/enhanced/current');
    const response = await axios.get(
      `${API_URL}/api/admin/system-health/enhanced/current`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log('✅ Current metrics retrieved successfully!');
    console.log('Response structure:');
    console.log('  - timestamp:', response.data.timestamp);
    console.log('  - database:', Object.keys(response.data.database || {}));
    console.log('  - api:', Object.keys(response.data.api || {}));
    console.log('  - server:', Object.keys(response.data.server || {}));
    console.log('\nSample values:');
    console.log('  - CPU Usage:', response.data.server?.cpuUsage?.toFixed(2) + '%');
    console.log('  - Memory Usage:', response.data.server?.memoryUsage?.toFixed(2) + '%');
    console.log('  - Avg Query Time:', response.data.database?.avgQueryTime?.toFixed(2) + 'ms');
    console.log('  - API Requests/Min:', response.data.api?.requestsPerMinute);
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testHistoricalMetrics() {
  try {
    console.log('📈 Testing GET /admin/system-health/enhanced/historical');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 1); // Last hour

    const response = await axios.get(
      `${API_URL}/api/admin/system-health/enhanced/historical`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log('✅ Historical metrics retrieved successfully!');
    console.log(`  - Total data points: ${response.data.length}`);
    if (response.data.length > 0) {
      console.log('  - Sample metric:', {
        timestamp: response.data[0].timestamp,
        metricType: response.data[0].metricType,
        metricName: response.data[0].metricName,
        value: response.data[0].value,
      });
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testMetricsByCategory() {
  try {
    console.log('🗂️  Testing GET /admin/system-health/enhanced/category');
    
    const categories = ['DATABASE', 'API', 'SERVER'];
    
    for (const category of categories) {
      const response = await axios.get(
        `${API_URL}/api/admin/system-health/enhanced/category`,
        {
          params: { category },
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      console.log(`✅ ${category} metrics retrieved:`, Object.keys(response.data));
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testThresholdViolations() {
  try {
    console.log('⚠️  Testing GET /admin/system-health/enhanced/thresholds');
    const response = await axios.get(
      `${API_URL}/api/admin/system-health/enhanced/thresholds`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log('✅ Threshold violations retrieved successfully!');
    console.log(`  - Total violations: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('  - Violations by severity:');
      const bySeverity = response.data.reduce((acc, v) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1;
        return acc;
      }, {});
      Object.entries(bySeverity).forEach(([severity, count]) => {
        console.log(`    - ${severity}: ${count}`);
      });
      
      console.log('  - Sample violation:', {
        metricType: response.data[0].metricType,
        metricName: response.data[0].metricName,
        currentValue: response.data[0].currentValue,
        thresholdValue: response.data[0].thresholdValue,
        severity: response.data[0].severity,
      });
    } else {
      console.log('  - No violations detected (system healthy!)');
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testExportMetrics() {
  try {
    console.log('💾 Testing GET /admin/system-health/enhanced/export');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Last day

    const response = await axios.get(
      `${API_URL}/api/admin/system-health/enhanced/export`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log('✅ Metrics exported successfully!');
    console.log(`  - CSV size: ${response.data.length} characters`);
    
    const lines = response.data.split('\n').filter(l => l.length > 0);
    console.log(`  - Total rows: ${lines.length}`);
    console.log(`  - Header: ${lines[0]}`);
    if (lines.length > 1) {
      console.log(`  - Sample row: ${lines[1]}`);
    }
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Enhanced System Health Dashboard - API Tests');
  console.log('='.repeat(60));
  console.log('');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }

  // Run all tests
  const results = {
    currentMetrics: await testCurrentMetrics(),
    historicalMetrics: await testHistoricalMetrics(),
    metricsByCategory: await testMetricsByCategory(),
    thresholdViolations: await testThresholdViolations(),
    exportMetrics: await testExportMetrics(),
  };

  // Summary
  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  console.log('');
  console.log(`Total: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! System Health Dashboard is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('');
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
