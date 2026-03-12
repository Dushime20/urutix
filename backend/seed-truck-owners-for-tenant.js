const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'urutix_db',
  user: 'postgres',
  password: 'password',
});

async function seedTruckOwnersForTenant() {
  try {
    console.log('🚛 Seeding Truck Owners for Tenant...\n');

    // Get the tenant ID for deborahrutagengwa.admin@urutix.com
    const tenantQuery = await pool.query(`
      SELECT u."tenantId", t."contactEmail"
      FROM users u
      JOIN tenants t ON u."tenantId" = t.id
      WHERE u.email = 'deborahrutagengwa.admin@urutix.com'
    `);

    if (tenantQuery.rows.length === 0) {
      throw new Error('Tenant admin not found');
    }

    const tenantId = tenantQuery.rows[0].tenantId;
    const tenantEmail = tenantQuery.rows[0].contactEmail;

    console.log('🏢 Target Tenant:', tenantEmail);
    console.log('🆔 Tenant ID:', tenantId);
    console.log('');

    // Check if truck owners already exist for this tenant
    const existingTruckOwners = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'TRUCK_OWNER' AND "tenantId" = $1
    `, [tenantId]);

    console.log('📊 Existing truck owners:', existingTruckOwners.rows[0].count);

    if (existingTruckOwners.rows[0].count > 0) {
      console.log('✅ Truck owners already exist for this tenant');
      return;
    }

    // Create truck owners
    const truckOwners = [
      {
        email: 'john.kamau@trucking.com',
        firstName: 'John',
        lastName: 'Kamau',
        companyName: 'Kamau Transport Ltd',
        phone: '+254712345678'
      },
      {
        email: 'mary.wanjiku@logistics.com',
        firstName: 'Mary',
        lastName: 'Wanjiku',
        companyName: 'Wanjiku Logistics',
        phone: '+254723456789'
      },
      {
        email: 'peter.ochieng@freight.com',
        firstName: 'Peter',
        lastName: 'Ochieng',
        companyName: 'Ochieng Freight Services',
        phone: '+254734567890'
      }
    ];

    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('👥 Creating truck owners...');

    for (const owner of truckOwners) {
      const userId = uuidv4();
      const profileId = uuidv4();

      // Create user
      await pool.query(`
        INSERT INTO users (id, email, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'TRUCK_OWNER', 'ACTIVE', $4, NOW(), NOW())
      `, [userId, owner.email, hashedPassword, tenantId]);

      // Create user profile
      await pool.query(`
        INSERT INTO user_profiles (id, "userId", "firstName", "lastName", "companyName", phone, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [profileId, userId, owner.firstName, owner.lastName, owner.companyName, owner.phone]);

      console.log(`✅ Created: ${owner.firstName} ${owner.lastName} (${owner.email})`);
    }

    console.log('\n🎉 Successfully created truck owners for tenant!');
    console.log('💡 You can now refresh the Truck Owners & Credits page to see them.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

seedTruckOwnersForTenant();