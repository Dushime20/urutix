import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { UserProfile, KycStatus } from '../entities/user-profile.entity';
import { Tenant } from '../entities/tenant.entity';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'urutix',
  entities: [User, UserProfile, Tenant],
  synchronize: false,
  logging: true,
});

async function createAdminUser() {
  try {
    console.log('👑 Creating SUPER_ADMIN user...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    const userRepo = dataSource.getRepository(User);
    const profileRepo = dataSource.getRepository(UserProfile);
    const tenantRepo = dataSource.getRepository(Tenant);

    const email = process.env.ADMIN_EMAIL || 'admin@urutix.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';

    // Ensure a global/admin tenant exists
    let tenant = await tenantRepo.findOne({ where: { name: 'Admin Global' } });
    if (!tenant) {
      console.log('🏢 Creating Admin Global tenant...');
      tenant = tenantRepo.create({
        name: 'Admin Global',
        subdomain: 'admin',
        isActive: true,
        settings: { timezone: 'UTC', language: 'en' },
      });
      tenant = await tenantRepo.save(tenant);
      console.log('✅ Tenant created:', tenant.id);
    }

    // Check if admin already exists
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      console.log('ℹ️ Admin user already exists:');
      console.log(`   Email: ${email}`);
      console.log('   Role: SUPER_ADMIN');
      await dataSource.destroy();
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = userRepo.create({
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      tenantId: tenant.id,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    });
    const saved = await userRepo.save(user);
    console.log('✅ Admin user created:', saved.id);

    // Create profile
    const profile = profileRepo.create({
      userId: saved.id,
      tenantId: tenant.id,
      firstName: 'System',
      lastName: 'Administrator',
      companyName: 'UrutiX',
      kycStatus: KycStatus.VERIFIED,
      kycVerifiedAt: new Date(),
    });
    await profileRepo.save(profile);
    console.log('✅ Admin profile created');

    console.log('\n🎉 SUPER_ADMIN ready to use');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('👤 Role: SUPER_ADMIN');
    console.log('🏢 Tenant: Admin Global');
  } catch (err: any) {
    console.error('❌ Failed to create admin user:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy().catch(() => undefined);
  }
}

async function createAdmin() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const email = 'admin@urutix.com';
  const plainPassword = 'admin1234';
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const tenantId = '00000000-0000-0000-0000-000000000001';

  let admin = await userRepo.findOne({ where: { email, tenantId } });
  if (admin) {
    admin.passwordHash = passwordHash;
    admin.role = UserRole.ADMIN;
    admin.status = UserStatus.ACTIVE;
    await userRepo.save(admin);
    console.log('✅ Admin password reset:', email);
    await AppDataSource.destroy();
    return;
  }

  admin = userRepo.create({
    email,
    passwordHash,
    tenantId,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  });

  await userRepo.save(admin);
  console.log('✅ Admin user created:', email);
  await AppDataSource.destroy();
}

async function resetCargoUserPassword() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const email = 'cargo@test.com';
  const plainPassword = 'admin1234';
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const tenantId = '00000000-0000-0000-0000-000000000001';

  let user = await userRepo.findOne({ where: { email, tenantId } });
  if (user) {
    user.passwordHash = passwordHash;
    user.status = UserStatus.ACTIVE;
    await userRepo.save(user);
    console.log('✅ Password reset for:', email);
    await AppDataSource.destroy();
    return;
  }

  console.log('❌ User not found:', email);
  await AppDataSource.destroy();
}

createAdminUser().catch(console.error);
createAdmin().catch(console.error);
resetCargoUserPassword().catch(console.error);
