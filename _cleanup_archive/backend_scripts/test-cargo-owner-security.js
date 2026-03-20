/**
 * Integration Test: Cargo Owner Security
 * Tests authorization guards, tenant isolation, and security measures
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test users
const tenant1User = {
  email: 'cargo1@test.com',
  password: 'Test123!@#',
};

const tenant2User = {
  email: 'cargo2@test.com',
  password: 'Test123!@#',
};

const adminUser = {
  email: 'admin@test.com',
  password: 'Admin123!@#',
};

let tenant1Token = null;
let tenant2Token = null;
let adminToken = null;
let tenant1LoadId = null;
let tenant2LoadId = null;

// Helper function to login
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data.access_token || response.data.token;
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper function to create a load
async function createLoad(token, loadData) {
  try {
    const response = await axios.post(`${API_URL}/loads`, loadData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.load || response.data;
  } catch (error) {
    console.error('Create load failed:', error.response?.data || error.message);
    throw error;
  }
}

// Test 1: Tenant Isolation
async function testTenantIsolation() {
  console.log('\n=== Test 1: Tenant Isolation ===');
  
  try {
    // Tenant 1 user tries to access Tenant 2's load
    const response = await axios.get(`${API_URL}/loads/${tenant2LoadId}`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    
    console.log('❌ FAILED: Tenant 1 user accessed Tenant 2 load');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ PASSED: Tenant isolation working - access denied');
      return true;
    }
    console.log('❌ FAILED: Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Authorization Guard
async function testAuthorizationGuard() {
  console.log('\n=== Test 2: Authorization Guard ===');
  
  try {
    // Tenant 1 user tries to update Tenant 2's load
    const response = await axios.patch(
      `${API_URL}/loads/${tenant2LoadId}`,
      { title: 'Hacked Load' },
      { headers: { Authorization: `Bearer ${tenant1Token}` } },
    );
    
    console.log('❌ FAILED: Unauthorized update succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ PASSED: Authorization guard working - update denied');
      return true;
    }
    console.log('❌ FAILED: Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Admin Access
async function testAdminAccess() {
  console.log('\n=== Test 3: Admin Access ===');
  
  try {
    // Admin should be able to access loads in their tenant
    const response = await axios.get(`${API_URL}/loads/${tenant1LoadId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    if (response.status === 200) {
      console.log('✅ PASSED: Admin can access loads in their tenant');
      return true;
    }
    console.log('❌ FAILED: Admin access denied');
    return false;
  } catch (error) {
    console.log('❌ FAILED: Admin access error:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Owner Can Update Own Load
async function testOwnerUpdate() {
  console.log('\n=== Test 4: Owner Can Update Own Load ===');
  
  try {
    const response = await axios.patch(
      `${API_URL}/loads/${tenant1LoadId}`,
      { title: 'Updated Load Title' },
      { headers: { Authorization: `Bearer ${tenant1Token}` } },
    );
    
    if (response.status === 200) {
      console.log('✅ PASSED: Owner can update their own load');
      return true;
    }
    console.log('❌ FAILED: Owner update failed');
    return false;
  } catch (error) {
    console.log('❌ FAILED: Owner update error:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Owner Can Delete Own Load
async function testOwnerDelete() {
  console.log('\n=== Test 5: Owner Can Delete Own Load ===');
  
  try {
    // Create a new load to delete
    const loadData = {
      title: 'Test Load for Deletion',
      description: 'This load will be deleted',
      weight: 1000,
      loadType: 'FTL',
      equipmentType: 'DRY_VAN',
      cargoType: 'GENERAL',
      urgencyLevel: 'NORMAL',
      visibility: 'PUBLIC',
      unitsRequired: 1,
      locations: [],
      pickupDate: new Date(Date.now() + 86400000).toISOString(),
      deliveryDate: new Date(Date.now() + 172800000).toISOString(),
      loadValue: 5000,
      paymentTerms: 'NET_30',
    };
    
    const load = await createLoad(tenant1Token, loadData);
    const loadId = load.id;
    
    const response = await axios.delete(`${API_URL}/loads/${loadId}`, {
      headers: { Authorization: `Bearer ${tenant1Token}` },
    });
    
    if (response.status === 200) {
      console.log('✅ PASSED: Owner can delete their own load');
      return true;
    }
    console.log('❌ FAILED: Owner delete failed');
    return false;
  } catch (error) {
    console.log('❌ FAILED: Owner delete error:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Unauthenticated Access Denied
async function testUnauthenticatedAccess() {
  console.log('\n=== Test 6: Unauthenticated Access Denied ===');
  
  try {
    const response = await axios.get(`${API_URL}/loads/${tenant1LoadId}`);
    
    console.log('❌ FAILED: Unauthenticated access succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ PASSED: Unauthenticated access denied');
      return true;
    }
    console.log('❌ FAILED: Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

// Test 7: Input Validation
async function testInputValidation() {
  console.log('\n=== Test 7: Input Validation ===');
  
  const invalidLoadData = {
    title: 'A'.repeat(300), // Exceeds max length
    weight: -100, // Negative weight
    loadValue: -5000, // Negative value
    loadType: 'FTL',
    equipmentType: 'DRY_VAN',
    cargoType: 'GENERAL',
    visibility: 'PUBLIC',
    unitsRequired: 1,
    locations: [],
    pickupDate: new Date().toISOString(),
    deliveryDate: new Date().toISOString(),
    paymentTerms: 'NET_30',
  };
  
  try {
    await createLoad(tenant1Token, invalidLoadData);
    console.log('❌ FAILED: Invalid data accepted');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ PASSED: Input validation working - invalid data rejected');
      return true;
    }
    console.log('❌ FAILED: Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('===========================================');
  console.log('Cargo Owner Security Integration Tests');
  console.log('===========================================');
  
  try {
    // Setup: Login users
    console.log('\n--- Setup: Logging in users ---');
    tenant1Token = await login(tenant1User.email, tenant1User.password);
    console.log('✓ Tenant 1 user logged in');
    
    tenant2Token = await login(tenant2User.email, tenant2User.password);
    console.log('✓ Tenant 2 user logged in');
    
    adminToken = await login(adminUser.email, adminUser.password);
    console.log('✓ Admin user logged in');
    
    // Setup: Create test loads
    console.log('\n--- Setup: Creating test loads ---');
    const loadData = {
      title: 'Test Load',
      description: 'Test load for security testing',
      weight: 5000,
      loadType: 'FTL',
      equipmentType: 'DRY_VAN',
      cargoType: 'GENERAL',
      urgencyLevel: 'NORMAL',
      visibility: 'PUBLIC',
      unitsRequired: 1,
      locations: [],
      pickupDate: new Date(Date.now() + 86400000).toISOString(),
      deliveryDate: new Date(Date.now() + 172800000).toISOString(),
      loadValue: 10000,
      paymentTerms: 'NET_30',
    };
    
    const tenant1Load = await createLoad(tenant1Token, loadData);
    tenant1LoadId = tenant1Load.id;
    console.log('✓ Tenant 1 load created:', tenant1LoadId);
    
    const tenant2Load = await createLoad(tenant2Token, loadData);
    tenant2LoadId = tenant2Load.id;
    console.log('✓ Tenant 2 load created:', tenant2LoadId);
    
    // Run tests
    const results = [];
    
    results.push(await testTenantIsolation());
    results.push(await testAuthorizationGuard());
    results.push(await testAdminAccess());
    results.push(await testOwnerUpdate());
    results.push(await testOwnerDelete());
    results.push(await testUnauthenticatedAccess());
    results.push(await testInputValidation());
    
    // Summary
    console.log('\n===========================================');
    console.log('Test Summary');
    console.log('===========================================');
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('\n✅ ALL TESTS PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test setup failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
