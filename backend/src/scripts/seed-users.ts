import { User, UserRole, UserStatus } from '../entities/user.entity';
import { UserProfile, KycStatus } from '../entities/user-profile.entity';
import { Tenant, TenantStatus, TenantType } from '../entities/tenant.entity';
import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

interface UserSeedData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  companyName?: string;
  phone?: string;
  status?: UserStatus;
}

const defaultPassword = 'Test123!@#';

const usersToSeed: UserSeedData[] = [
  // Admin Users
  {
    email: 'admin@urutix.com',
    password: defaultPassword,
    role: UserRole.SUPER_ADMIN,
    firstName: 'System',
    lastName: 'Administrator',
    companyName: 'UrutiX',
    phone: '+1-555-0001',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'admin2@urutix.com',
    password: defaultPassword,
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
    companyName: 'UrutiX',
    phone: '+1-555-0002',
    status: UserStatus.ACTIVE,
  },
  // Cargo Owners
  {
    email: 'cargo.owner@test.com',
    password: defaultPassword,
    role: UserRole.CARGO_OWNER,
    firstName: 'John',
    lastName: 'Doe',
    companyName: 'Electronics Co.',
    phone: '+1-555-0101',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'cargo.owner2@test.com',
    password: defaultPassword,
    role: UserRole.CARGO_OWNER,
    firstName: 'Mary',
    lastName: 'Smith',
    companyName: 'Farm Fresh Ltd',
    phone: '+1-555-0102',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'cargo.pending@test.com',
    password: defaultPassword,
    role: UserRole.CARGO_OWNER,
    firstName: 'Pending',
    lastName: 'User',
    companyName: 'Pending Company',
    phone: '+1-555-0103',
    status: UserStatus.PENDING_VERIFICATION,
  },
  // Truck Owners
  {
    email: 'truck.owner@test.com',
    password: defaultPassword,
    role: UserRole.TRUCK_OWNER,
    firstName: 'James',
    lastName: 'Mwangi',
    companyName: 'Test Trucking Company',
    phone: '+1-555-0201',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'truck.owner2@test.com',
    password: defaultPassword,
    role: UserRole.TRUCK_OWNER,
    firstName: 'Peter',
    lastName: 'Ochieng',
    companyName: 'Premium Transport Ltd',
    phone: '+1-555-0202',
    status: UserStatus.ACTIVE,
  },
  // Drivers
  {
    email: 'driver@test.com',
    password: defaultPassword,
    role: UserRole.DRIVER,
    firstName: 'David',
    lastName: 'Kamau',
    phone: '+1-555-0301',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'driver2@test.com',
    password: defaultPassword,
    role: UserRole.DRIVER,
    firstName: 'Sarah',
    lastName: 'Wanjiku',
    phone: '+1-555-0302',
    status: UserStatus.ACTIVE,
  },
  // Lenders
  {
    email: 'lender@test.com',
    password: defaultPassword,
    role: UserRole.LENDER,
    firstName: 'Finance',
    lastName: 'Manager',
    companyName: 'Quick Loans Inc',
    phone: '+1-555-0401',
    status: UserStatus.ACTIVE,
  },
  // Tenant Admin
  {
    email: 'tenant.admin@test.com',
    password: defaultPassword,
    role: UserRole.TENANT_ADMIN,
    firstName: 'Tenant',
    lastName: 'Admin',
    companyName: 'Test Tenant',
    phone: '+1-555-0501',
    status: UserStatus.ACTIVE,
  },
];

// Use AppDataSource which has all entities configured
const dataSource = AppDataSource;

async function getOrCreateDefaultTenant(): Promise<Tenant> {
  const tenantRepo = dataSource.getRepository(Tenant);
  
  // Try to find default tenant by ID first
  const defaultTenantId = '00000000-0000-0000-0000-000000000001';
  let tenant = await tenantRepo.findOne({
    where: { id: defaultTenantId },
  });

  if (tenant) {
    return tenant;
  }

  // Try to find any active tenant
  tenant = await tenantRepo.findOne({
    where: { isActive: true },
  });

  if (tenant) {
    return tenant;
  }

  // Create default tenant using raw SQL to set specific ID
  console.log('🏢 Creating default tenant...');
  await dataSource.query(
    `INSERT INTO tenants (
      id, name, subdomain, "isActive", status, type, settings, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING`,
    [
      defaultTenantId,
      'Default Tenant',
      'default',
      true,
      TenantStatus.ACTIVE,
      TenantType.SMALL_BUSINESS,
      JSON.stringify({ timezone: 'UTC', language: 'en' }),
    ],
  );

  tenant = await tenantRepo.findOne({
    where: { id: defaultTenantId },
  });

  if (!tenant) {
    // If still not found, try to find any tenant or create one without specific ID
    tenant = await tenantRepo.findOne({
      where: { isActive: true },
    });
    
    if (!tenant) {
      // Create tenant without specific ID
      tenant = tenantRepo.create({
        name: 'Default Tenant',
        subdomain: 'default',
        isActive: true,
        status: TenantStatus.ACTIVE,
        type: TenantType.SMALL_BUSINESS,
        settings: { timezone: 'UTC', language: 'en' },
      });
      tenant = await tenantRepo.save(tenant);
    }
  }

  console.log(`✅ Default tenant created: ${tenant.id}`);
  return tenant;
}

async function seedUsers() {
  try {
    console.log('🌱 Starting user seed...\n');
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    const userRepo = dataSource.getRepository(User);
    const profileRepo = dataSource.getRepository(UserProfile);
    const tenant = await getOrCreateDefaultTenant();

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const userData of usersToSeed) {
      try {
        // Check if user already exists
        const existingUser = await userRepo.findOne({
          where: { email: userData.email },
          relations: ['profile'],
        });

        if (existingUser) {
          // Update existing user
          const passwordHash = await bcrypt.hash(userData.password, 12);
          existingUser.passwordHash = passwordHash;
          existingUser.role = userData.role;
          existingUser.status = userData.status || UserStatus.ACTIVE;
          existingUser.tenantId = tenant.id;
          existingUser.emailVerifiedAt = userData.status === UserStatus.ACTIVE ? new Date() : undefined;
          
          if (userData.phone) {
            existingUser.phone = userData.phone;
          }

          await userRepo.save(existingUser);

          // Update or create profile
          let profile = existingUser.profile;
          if (!profile) {
            profile = profileRepo.create({
              userId: existingUser.id,
              tenantId: tenant.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              companyName: userData.companyName,
            });
          } else {
            profile.firstName = userData.firstName;
            profile.lastName = userData.lastName;
            profile.companyName = userData.companyName;
          }
          await profileRepo.save(profile);

          console.log(`🔄 Updated: ${userData.email} (${userData.role})`);
          updatedCount++;
          continue;
        }

        // Create new user
        const passwordHash = await bcrypt.hash(userData.password, 12);
        const user = userRepo.create({
          email: userData.email,
          passwordHash,
          role: userData.role,
          status: userData.status || UserStatus.ACTIVE,
          tenantId: tenant.id,
          emailVerifiedAt: userData.status === UserStatus.ACTIVE ? new Date() : undefined,
          phone: userData.phone,
        });

        const savedUser = await userRepo.save(user);

        // Create profile
        const profile = profileRepo.create({
          userId: savedUser.id,
          tenantId: tenant.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          companyName: userData.companyName,
          kycStatus: userData.status === UserStatus.ACTIVE ? KycStatus.VERIFIED : KycStatus.PENDING,
          kycVerifiedAt: userData.status === UserStatus.ACTIVE ? new Date() : undefined,
        });

        await profileRepo.save(profile);

        console.log(`✅ Created: ${userData.email} (${userData.role})`);
        createdCount++;
      } catch (error: any) {
        console.error(`❌ Failed to create/update ${userData.email}: ${error.message}`);
        skippedCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Seed Summary:');
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   🔄 Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📝 Total: ${usersToSeed.length}`);
    console.log('\n🔑 Default Password for all users: ' + defaultPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // List all created users
    console.log('📋 All Users:');
    const allUsers = await userRepo.find({
      relations: ['profile'],
      order: { email: 'ASC' },
    });

    allUsers.forEach((user, index) => {
      const name = user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : 'No profile';
      console.log(
        `   ${index + 1}. ${user.email} - ${user.role} (${user.status}) - ${name}`,
      );
    });

    console.log('\n✅ User seed completed successfully!');
  } catch (error: any) {
    console.error('❌ Error seeding users:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy().catch(() => undefined);
  }
}

seedUsers().catch(console.error);

