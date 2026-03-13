const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Test credentials - you should replace these with actual test user credentials
const TEST_USERS = {
  SUPER_ADMIN: {
    email: 'admin@urutix.com',
    password: 'admin123',
  },
  TRUCK_OWNER: {
    email: 'truckowner@test.com',
    password: 'password123',
  },
  CARGO_OWNER: {
    email: 'cargoowner@test.com', 
    password: 'password123',
  },
  BROKER: {
    email: 'broker@test.com',
    password: 'password123',
  },
  DRIVER: {
    email: 'driver@test.com',
    password: 'password123',
  },
  LENDER: {
    email: 'lender@test.com',
    password: 'password123',
  },
};

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

async function testUserKycEndpoints() {
  console.log('🧪 Testing User KYC System...\n');

  // Test 1: Login as different user roles
  console.log('1️⃣ Testing user logins...');
  const tokens = {};
  
  for (const [role, credentials] of Object.entries(TEST_USERS)) {
    const token = await login(credentials.email, credentials.password);
    if (token) {
      tokens[role] = token;
      console.log(`✅ ${role} login successful`);
    } else {
      console.log(`❌ ${role} login failed`);
    }
  }

  if (Object.keys(tokens).length === 0) {
    console.log('❌ No successful logins. Cannot proceed with tests.');
    return;
  }

  // Test 2: Get KYC requirements for different roles
  console.log('\n2️⃣ Testing KYC requirements endpoints...');
  const roles = ['TRUCK_OWNER', 'CARGO_OWNER', 'BROKER', 'DRIVER', 'AGENT', 'LENDER'];
  
  for (const role of roles) {
    try {
      const response = await axios.get(`${BASE_URL}/user-kyc/requirements/${role}`, {
        headers: { Authorization: `Bearer ${tokens.SUPER_ADMIN || Object.values(tokens)[0]}` }
      });
      
      console.log(`✅ ${role} requirements:`, {
        level: response.data.data.requirementLevel,
        requiredDocs: response.data.data.requiredDocuments.length,
        verificationSteps: response.data.data.verificationSteps.length,
      });
    } catch (error) {
      console.log(`❌ Failed to get ${role} requirements:`, error.response?.data?.message || error.message);
    }
  }

  // Test 3: Submit KYC data for different user roles
  console.log('\n3️⃣ Testing KYC submission...');
  
  const kycTestData = {
    TRUCK_OWNER: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'truckowner@test.com',
      phoneNumber: '+1234567890',
      address: '123 Main St',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345',
      companyName: 'Doe Trucking LLC',
      businessType: 'Transportation',
      businessRegistrationNumber: 'TR123456',
      taxId: 'TAX123456',
      bankAccountNumber: 'BANK123456',
      bankName: 'Test Bank',
      licenseNumber: 'CDL123456',
      licenseExpiryDate: '2025-12-31',
      yearsOfExperience: 10,
    },
    CARGO_OWNER: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'cargoowner@test.com',
      phoneNumber: '+1234567891',
      address: '456 Business Ave',
      city: 'Business City',
      state: 'Business State',
      country: 'Test Country',
      postalCode: '54321',
      companyName: 'Smith Cargo Inc',
      businessType: 'Logistics',
      businessRegistrationNumber: 'CG123456',
      taxId: 'TAX654321',
      bankAccountNumber: 'BANK654321',
      bankName: 'Business Bank',
    },
    DRIVER: {
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'driver@test.com',
      phoneNumber: '+1234567892',
      address: '789 Driver Lane',
      city: 'Driver City',
      state: 'Driver State',
      country: 'Test Country',
      postalCode: '98765',
      licenseNumber: 'DL123456',
      licenseExpiryDate: '2025-06-30',
      yearsOfExperience: 5,
    },
  };

  for (const [role, token] of Object.entries(tokens)) {
    if (kycTestData[role]) {
      try {
        const response = await axios.post(`${BASE_URL}/user-kyc/submit`, kycTestData[role], {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✅ ${role} KYC submission successful:`, {
          status: response.data.data.kycStatus,
          requirementLevel: response.data.data.kycRequirementLevel,
        });
      } catch (error) {
        console.log(`❌ ${role} KYC submission failed:`, error.response?.data?.message || error.message);
      }
    }
  }

  // Test 4: Get user's own KYC data
  console.log('\n4️⃣ Testing get my KYC data...');
  
  for (const [role, token] of Object.entries(tokens)) {
    try {
      const response = await axios.get(`${BASE_URL}/user-kyc/my-kyc`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`✅ ${role} KYC data retrieved:`, {
        status: response.data.data.profile.kycStatus,
        documentsCount: response.data.data.documents.length,
        requirementLevel: response.data.data.profile.kycRequirementLevel,
      });
    } catch (error) {
      console.log(`❌ ${role} KYC data retrieval failed:`, error.response?.data?.message || error.message);
    }
  }

  // Test 5: Admin endpoints (if admin token available)
  if (tokens.SUPER_ADMIN) {
    console.log('\n5️⃣ Testing admin endpoints...');
    
    try {
      // Get KYC statistics
      const statsResponse = await axios.get(`${BASE_URL}/user-kyc/admin/stats`, {
        headers: { Authorization: `Bearer ${tokens.SUPER_ADMIN}` }
      });
      
      console.log('✅ KYC Statistics:', {
        total: statsResponse.data.data.total,
        pending: statsResponse.data.data.pending,
        underReview: statsResponse.data.data.underReview,
        verified: statsResponse.data.data.verified,
        rejected: statsResponse.data.data.rejected,
      });
    } catch (error) {
      console.log('❌ Failed to get KYC statistics:', error.response?.data?.message || error.message);
    }

    try {
      // Get users under review
      const usersResponse = await axios.get(`${BASE_URL}/user-kyc/admin/users?status=UNDER_REVIEW`, {
        headers: { Authorization: `Bearer ${tokens.SUPER_ADMIN}` }
      });
      
      console.log(`✅ Users under review: ${usersResponse.data.data.length}`);
    } catch (error) {
      console.log('❌ Failed to get users under review:', error.response?.data?.message || error.message);
    }
  }

  console.log('\n🎉 User KYC System testing completed!');
}

// Run the tests
testUserKycEndpoints().catch(console.error);