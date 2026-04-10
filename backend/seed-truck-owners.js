const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

// Database configuration
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
  synchronize: false,
  logging: true,
});

// Truck owner data
const truckOwners = [
  {
    email: 'truckowner1@demo.com',
    password: 'TruckOwner@123',
    firstName: 'John',
    lastName: 'Logistics',
    companyName: 'John Logistics Ltd',
    phone: '+250788123456',
  },
  {
    email: 'truckowner2@demo.com',
    password: 'TruckOwner@123',
    firstName: 'Sarah',
    lastName: 'Transport',
    companyName: 'East African Movers',
    phone: '+250788234567',
  },
  {
    email: 'truckowner3@demo.com',
    password: 'TruckOwner@123',
    firstName: 'Michael',
    lastName: 'Freight',
    companyName: 'Mombasa Road Transporters',
    phone: '+250788345678',
  },
  {
    email: 'truckowner4@demo.com',
    password: 'TruckOwner@123',
    firstName: 'David',
    lastName: 'Cargo',
    companyName: 'Swift Cargo Services',
    phone: '+250788456789',
  },
  {
    email: 'truckowner5@demo.com',
    password: 'TruckOwner@123',
    firstName: 'Grace',
    lastName: 'Haulage',
    companyName: 'Grace Haulage Co',
    phone: '+250788567890',
  },
];

async function seedTruckOwners() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Get the tenant ID from the tenant admin user
    const tenantAdminResult = await queryRunner.query(
      `SELECT u.id, u.email, u."tenantId", t.name as "tenantName" 
       FROM users u 
       LEFT JOIN tenants t ON u."tenantId" = t.id 
       WHERE u.id = $1 OR u.email = $2 
       LIMIT 1`,
      ['007eb9d5-a71b-42be-8c9e-1c968dd97c71', 'tenantadmin@demo.com']
    );

    if (tenantAdminResult.length === 0) {
      console.error('❌ Tenant admin (tenantadmin@demo.com) not found.');
      await queryRunner.release();
      await AppDataSource.destroy();
      process.exit(1);
    }

    const tenantId = tenantAdminResult[0].tenantId;
    const tenantName = tenantAdminResult[0].tenantName || 'Demo Tenant';
    const tenantAdminEmail = tenantAdminResult[0].email;
    console.log(`✅ Using tenant admin: ${tenantAdminEmail}`);
    console.log(`✅ Tenant: ${tenantName} (${tenantId})`);

    const createdUsers = [];

    for (const owner of truckOwners) {
      // Check if user already exists
      const existingUser = await queryRunner.query(
        `SELECT id, email FROM users WHERE email = $1 AND "tenantId" = $2`,
        [owner.email, tenantId]
      );

      if (existingUser.length > 0) {
        console.log(`⚠️  User already exists: ${owner.email}`);
        
        // Update to ensure they're active and verified
        await queryRunner.query(
          `UPDATE users SET status = $1, "emailVerifiedAt" = NOW() WHERE id = $2`,
          ['ACTIVE', existingUser[0].id]
        );
        
        createdUsers.push({
          ...owner,
          id: existingUser[0].id,
          existed: true,
        });
        continue;
      }

      // Create truck owner user
      console.log(`👤 Creating truck owner: ${owner.email}...`);
      const hashedPassword = await bcrypt.hash(owner.password, 10);

      const userResult = await queryRunner.query(
        `INSERT INTO users (
          email, 
          "passwordHash", 
          role, 
          status, 
          "tenantId",
          "emailVerifiedAt",
          "createdAt", 
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
        RETURNING id, email, role, status`,
        [
          owner.email,
          hashedPassword,
          'TRUCK_OWNER',
          'ACTIVE',
          tenantId
        ]
      );

      const user = userResult[0];
      console.log(`✅ User created: ${user.email} (${user.id})`);

      // Create user profile
      console.log(`📝 Creating user profile for ${owner.firstName} ${owner.lastName}...`);
      await queryRunner.query(
        `INSERT INTO user_profiles (
          "userId",
          "tenantId",
          "firstName",
          "lastName",
          "companyName",
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [user.id, tenantId, owner.firstName, owner.lastName, owner.companyName]
      );
      console.log('✅ User profile created');

      createdUsers.push({
        ...owner,
        id: user.id,
        existed: false,
      });
    }

    await queryRunner.release();

    // Display summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 TRUCK OWNERS SEEDED SUCCESSFULLY');
    console.log('='.repeat(80));
    console.log(`Tenant: ${tenantName}`);
    console.log(`Total Users: ${createdUsers.length}`);
    console.log('='.repeat(80));
    
    createdUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.companyName}`);
      console.log(`   Email:    ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role:     TRUCK_OWNER`);
      console.log(`   Name:     ${user.firstName} ${user.lastName}`);
      console.log(`   Phone:    ${user.phone}`);
      console.log(`   Status:   ${user.existed ? 'Already Existed (Updated)' : 'Newly Created'}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 NOTE: All users are ACTIVE and email verified');
    console.log('🔐 Default password for all: TruckOwner@123');
    console.log('='.repeat(80) + '\n');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding truck owners:', error);
    process.exit(1);
  }
}

// Run the seed
seedTruckOwners();
