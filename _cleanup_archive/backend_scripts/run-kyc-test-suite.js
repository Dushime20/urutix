#!/usr/bin/env node

const { runTenantKycIntegrationTests, testResults: integrationResults } = require('./test-tenant-kyc-integration');
const { runKycPerformanceTests, performanceMetrics } = require('./test-kyc-performance');
const { runKycSecurityTests, securityResults } = require('./test-kyc-security');

// Test suite configuration
const TEST_SUITE_CONFIG = {
  runIntegrationTests: true,
  runPerformanceTests: true,
  runSecurityTests: true,
  generateReport: true,
  cleanupAfterTests: true,
  exitOnFailure: false,
};

// Overall test results
const overallResults = {
  startTime: null,
  endTime: null,
  duration: 0,
  suites: {
    integration: { status: 'pending', results: null },
    performance: { status: 'pending', results: null },
    security: { status: 'pending', results: null }
  },
  summary: {
    totalSuites: 0,
    passedSuites: 0,
    failedSuites: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0
  }
};

function printHeader() {
  console.log('🧪 COMPREHENSIVE KYC TEST SUITE');
  console.log('='.repeat(80));
  console.log('📋 Test Configuration:');
  console.log(`   Integration Tests: ${TEST_SUITE_CONFIG.runIntegrationTests ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Performance Tests: ${TEST_SUITE_CONFIG.runPerformanceTests ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Security Tests: ${TEST_SUITE_CONFIG.runSecurityTests ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('='.repeat(80));
  console.log('');
}

async function runIntegrationTestSuite() {
  console.log('🔄 RUNNING INTEGRATION TEST SUITE...');
  console.log('-'.repeat(80));
  
  try {
    await runTenantKycIntegrationTests();
    
    const passed = integrationResults.failed === 0;
    overallResults.suites.integration = {
      status: passed ? 'passed' : 'failed',
      results: integrationResults
    };
    
    console.log(`\n✅ Integration Test Suite ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   Tests: ${integrationResults.passed}/${integrationResults.total} passed`);
    
    return passed;
  } catch (error) {
    console.error('❌ Integration Test Suite CRASHED:', error.message);
    overallResults.suites.integration = {
      status: 'crashed',
      results: { error: error.message }
    };
    return false;
  }
}

async function runPerformanceTestSuite() {
  console.log('\n🚀 RUNNING PERFORMANCE TEST SUITE...');
  console.log('-'.repeat(80));
  
  try {
    await runKycPerformanceTests();
    
    // Analyze performance results
    const hasGoodPerformance = Object.values(performanceMetrics)
      .filter(metrics => Array.isArray(metrics) && metrics.length > 0)
      .every(metrics => {
        const avg = metrics.reduce((a, b) => a + b, 0) / metrics.length;
        return avg <= 2000; // 2 second threshold
      });
    
    overallResults.suites.performance = {
      status: hasGoodPerformance ? 'passed' : 'warning',
      results: performanceMetrics
    };
    
    console.log(`\n✅ Performance Test Suite ${hasGoodPerformance ? 'PASSED' : 'COMPLETED WITH WARNINGS'}`);
    
    return true; // Performance tests don't fail the suite, just warn
  } catch (error) {
    console.error('❌ Performance Test Suite CRASHED:', error.message);
    overallResults.suites.performance = {
      status: 'crashed',
      results: { error: error.message }
    };
    return false;
  }
}

async function runSecurityTestSuite() {
  console.log('\n🔒 RUNNING SECURITY TEST SUITE...');
  console.log('-'.repeat(80));
  
  try {
    await runKycSecurityTests();
    
    const highVulnerabilities = securityResults.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const passed = highVulnerabilities === 0;
    
    overallResults.suites.security = {
      status: passed ? 'passed' : 'failed',
      results: securityResults
    };
    
    console.log(`\n✅ Security Test Suite ${passed ? 'PASSED' : 'FAILED'}`);
    console.log(`   Security Score: ${((securityResults.passed / securityResults.total) * 100).toFixed(1)}%`);
    console.log(`   High Vulnerabilities: ${highVulnerabilities}`);
    
    return passed;
  } catch (error) {
    console.error('❌ Security Test Suite CRASHED:', error.message);
    overallResults.suites.security = {
      status: 'crashed',
      results: { error: error.message }
    };
    return false;
  }
}

function calculateOverallResults() {
  const suites = Object.values(overallResults.suites);
  
  overallResults.summary.totalSuites = suites.length;
  overallResults.summary.passedSuites = suites.filter(s => s.status === 'passed').length;
  overallResults.summary.failedSuites = suites.filter(s => s.status === 'failed' || s.status === 'crashed').length;
  
  // Calculate total tests
  if (overallResults.suites.integration.results) {
    overallResults.summary.totalTests += overallResults.suites.integration.results.total || 0;
    overallResults.summary.passedTests += overallResults.suites.integration.results.passed || 0;
    overallResults.summary.failedTests += overallResults.suites.integration.results.failed || 0;
  }
  
  if (overallResults.suites.security.results) {
    overallResults.summary.totalTests += overallResults.suites.security.results.total || 0;
    overallResults.summary.passedTests += overallResults.suites.security.results.passed || 0;
    overallResults.summary.failedTests += overallResults.suites.security.results.failed || 0;
  }
}

function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE KYC TEST SUITE REPORT');
  console.log('='.repeat(80));
  
  console.log(`⏱️ Duration: ${overallResults.duration.toFixed(2)} seconds`);
  console.log(`📋 Test Suites: ${overallResults.summary.passedSuites}/${overallResults.summary.totalSuites} passed`);
  console.log(`🧪 Individual Tests: ${overallResults.summary.passedTests}/${overallResults.summary.totalTests} passed`);
  
  const overallSuccessRate = overallResults.summary.totalTests > 0 
    ? ((overallResults.summary.passedTests / overallResults.summary.totalTests) * 100).toFixed(1)
    : '0.0';
  console.log(`📈 Overall Success Rate: ${overallSuccessRate}%`);
  
  console.log('\n📋 SUITE BREAKDOWN:');
  
  // Integration Tests
  const integration = overallResults.suites.integration;
  console.log(`\n🔄 Integration Tests: ${getStatusIcon(integration.status)} ${integration.status.toUpperCase()}`);
  if (integration.results && integration.results.total) {
    console.log(`   Tests: ${integration.results.passed}/${integration.results.total} passed`);
    console.log(`   Success Rate: ${((integration.results.passed / integration.results.total) * 100).toFixed(1)}%`);
  }
  
  // Performance Tests
  const performance = overallResults.suites.performance;
  console.log(`\n🚀 Performance Tests: ${getStatusIcon(performance.status)} ${performance.status.toUpperCase()}`);
  if (performance.results && !performance.results.error) {
    const metrics = Object.keys(performance.results).filter(key => Array.isArray(performance.results[key]));
    console.log(`   Metrics Collected: ${metrics.length}`);
    console.log(`   Operations Tested: ${metrics.reduce((sum, key) => sum + performance.results[key].length, 0)}`);
  }
  
  // Security Tests
  const security = overallResults.suites.security;
  console.log(`\n🔒 Security Tests: ${getStatusIcon(security.status)} ${security.status.toUpperCase()}`);
  if (security.results && security.results.total) {
    console.log(`   Tests: ${security.results.passed}/${security.results.total} passed`);
    console.log(`   Security Score: ${((security.results.passed / security.results.total) * 100).toFixed(1)}%`);
    console.log(`   Vulnerabilities: ${security.results.vulnerabilities.length}`);
    
    const highVulns = security.results.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const mediumVulns = security.results.vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    const lowVulns = security.results.vulnerabilities.filter(v => v.severity === 'LOW').length;
    
    if (highVulns > 0) console.log(`     🔴 High: ${highVulns}`);
    if (mediumVulns > 0) console.log(`     🟡 Medium: ${mediumVulns}`);
    if (lowVulns > 0) console.log(`     🟢 Low: ${lowVulns}`);
  }
  
  console.log('\n📋 RECOMMENDATIONS:');
  
  if (integration.status === 'failed') {
    console.log('   🔄 Fix failing integration tests before deployment');
  }
  
  if (performance.status === 'warning') {
    console.log('   🚀 Review performance metrics and optimize slow operations');
  }
  
  if (security.status === 'failed') {
    console.log('   🔒 Address security vulnerabilities, especially HIGH severity ones');
  }
  
  if (overallResults.summary.failedSuites === 0) {
    console.log('   ✅ All test suites passed - system is ready for deployment');
  } else {
    console.log('   ⚠️ Some test suites failed - review and fix issues before deployment');
  }
  
  console.log('\n' + '='.repeat(80));
}

function getStatusIcon(status) {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'warning': return '⚠️';
    case 'crashed': return '💥';
    default: return '❓';
  }
}

async function runComprehensiveKycTestSuite() {
  overallResults.startTime = Date.now();
  
  printHeader();
  
  let allPassed = true;
  
  try {
    // Run Integration Tests
    if (TEST_SUITE_CONFIG.runIntegrationTests) {
      const integrationPassed = await runIntegrationTestSuite();
      if (!integrationPassed) allPassed = false;
    }
    
    // Run Performance Tests
    if (TEST_SUITE_CONFIG.runPerformanceTests) {
      const performancePassed = await runPerformanceTestSuite();
      if (!performancePassed) allPassed = false;
    }
    
    // Run Security Tests
    if (TEST_SUITE_CONFIG.runSecurityTests) {
      const securityPassed = await runSecurityTestSuite();
      if (!securityPassed) allPassed = false;
    }
    
  } catch (error) {
    console.error('❌ Test suite execution failed:', error.message);
    allPassed = false;
  } finally {
    overallResults.endTime = Date.now();
    overallResults.duration = (overallResults.endTime - overallResults.startTime) / 1000;
    
    calculateOverallResults();
    
    if (TEST_SUITE_CONFIG.generateReport) {
      generateTestReport();
    }
    
    // Exit with appropriate code
    if (TEST_SUITE_CONFIG.exitOnFailure && !allPassed) {
      console.log('\n❌ Test suite failed - exiting with error code');
      process.exit(1);
    } else if (allPassed) {
      console.log('\n✅ All test suites completed successfully');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some test suites failed but continuing');
      process.exit(0);
    }
  }
}

// Handle command line arguments
if (process.argv.includes('--integration-only')) {
  TEST_SUITE_CONFIG.runPerformanceTests = false;
  TEST_SUITE_CONFIG.runSecurityTests = false;
}

if (process.argv.includes('--performance-only')) {
  TEST_SUITE_CONFIG.runIntegrationTests = false;
  TEST_SUITE_CONFIG.runSecurityTests = false;
}

if (process.argv.includes('--security-only')) {
  TEST_SUITE_CONFIG.runIntegrationTests = false;
  TEST_SUITE_CONFIG.runPerformanceTests = false;
}

if (process.argv.includes('--exit-on-failure')) {
  TEST_SUITE_CONFIG.exitOnFailure = true;
}

if (process.argv.includes('--no-report')) {
  TEST_SUITE_CONFIG.generateReport = false;
}

// Run the comprehensive test suite
if (require.main === module) {
  runComprehensiveKycTestSuite().catch(error => {
    console.error('❌ Comprehensive test suite crashed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveKycTestSuite,
  overallResults,
  TEST_SUITE_CONFIG
};