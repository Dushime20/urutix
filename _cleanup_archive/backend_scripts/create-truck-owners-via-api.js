const axios = require('axios');

async function createTruckOwnersViaAPI() {
  try {
    console.log('🚛 Creating Truck Owners via API...\n');

    const truckOwners = [
      {
        email: 'john.kamau@trucking.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Kamau',
        companyName: 'Kamau Transport Ltd',
        phone: '+254712345678'
      },
      {
        email: 'mary.wanjiku@logistics.com',
        password: 'password123',
        firstName: 'Mary',
        lastName: 'Wanjiku',
        companyName: 'Wanjiku Logistics',
        phone: '+254723456789'
      },
      {
        email: 'peter.ochieng@freight.com',
        password: 'password123',
        firstName: 'Peter',
        lastName: 'Ochieng',
        companyName: 'Ochieng Freight Services',
        phone: '+254734567890'
      }
    ];

    // First, get the tenant info by logging in as tenant admin
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      email: 'deborahrutagengwa.admin@urutix.com',
      password: 'password123'
    });

    const tenantId = loginResponse.data.data.user.tenantId;
    console.log('🏢 Target Tenant ID:', tenantId);
    console.log('');

    for (const owner of truckOwners) {
      try {
        // Register truck owner
        const registerResponse = await axios.post('http://localhost:3001/auth/register', {
          email: owner.email,
          password: owner.password,
          firstName: owner.firstName,
          lastName: owner.lastName,
          role: 'TRUCK_OWNER',
          companyName: owner.companyName,
          phone: owner.phone,
          tenantId: tenantId
        });

        if (registerResponse.data.success) {
          console.log(`✅ Created: ${owner.firstName} ${owner.lastName} (${owner.email})`);
        } else {
          console.log(`❌ Failed to create: ${owner.email} - ${registerResponse.data.message}`);
        }
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`⚠️  User already exists: ${owner.email}`);
        } else {
          console.log(`❌ Error creating ${owner.email}:`, error.response?.data?.message || error.message);
        }
      }
    }

    console.log('\n🎉 Truck owner creation process completed!');
    console.log('💡 Refresh the Truck Owners & Credits page to see the new truck owners.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createTruckOwnersViaAPI();