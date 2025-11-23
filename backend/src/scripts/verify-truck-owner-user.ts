import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus, UserRole } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'urutix_database',
  entities: [User, UserProfile],
  synchronize: false,
});

async function verifyOrCreateTruckOwner() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const userRepository = dataSource.getRepository(User);
    const profileRepository = dataSource.getRepository(UserProfile);

    const email = 'truck.owner@test.com';
    const password = 'test123';
    const tenantId =
      process.env.TENANT_ID || '00000000-0000-0000-0000-000000000001';

    // Check if user exists
    let user = await userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });

    if (!user) {
      console.log('👤 User does not exist. Creating truck owner user...');

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      user = new User();
      user.email = email;
      user.phone = '+1-555-0102';
      user.passwordHash = passwordHash;
      user.role = UserRole.TRUCK_OWNER;
      user.status = UserStatus.ACTIVE;
      user.tenantId = tenantId;

      user = await userRepository.save(user);
      console.log('✅ User created:', user.id);

      // Create profile
      const profile = new UserProfile();
      profile.userId = user.id;
      profile.tenantId = tenantId;
      profile.firstName = 'Truck';
      profile.lastName = 'Owner';
      profile.companyName = 'Test Trucking Company';

      await profileRepository.save(profile);
      console.log('✅ Profile created');
    } else {
      console.log('✅ User exists:', user.id);
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Status:', user.status);

      // Verify password
      if (user.passwordHash) {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        console.log('   Password valid:', isValid);

        if (!isValid) {
          console.log('⚠️  Password does not match. Updating password...');
          const newPasswordHash = await bcrypt.hash(password, 10);
          user.passwordHash = newPasswordHash;
          await userRepository.save(user);
          console.log('✅ Password updated');
        }
      } else {
        console.log('⚠️  No password hash found. Setting password...');
        const passwordHash = await bcrypt.hash(password, 10);
        user.passwordHash = passwordHash;
        await userRepository.save(user);
        console.log('✅ Password set');
      }

      // Ensure user is active
      if (user.status !== UserStatus.ACTIVE) {
        console.log('⚠️  User is not active. Activating...');
        user.status = UserStatus.ACTIVE;
        await userRepository.save(user);
        console.log('✅ User activated');
      }

      // Ensure user has correct role
      if (user.role !== UserRole.TRUCK_OWNER) {
        console.log('⚠️  User role is incorrect. Updating...');
        user.role = UserRole.TRUCK_OWNER;
        await userRepository.save(user);
        console.log('✅ Role updated to TRUCK_OWNER');
      }
    }

    console.log('\n📝 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Role:', UserRole.TRUCK_OWNER);
    console.log('   Status:', UserStatus.ACTIVE);
    console.log('\n✅ Truck owner user is ready!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Run the script
if (require.main === module) {
  verifyOrCreateTruckOwner()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { verifyOrCreateTruckOwner };
