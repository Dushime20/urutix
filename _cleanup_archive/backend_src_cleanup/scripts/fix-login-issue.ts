import { AppDataSource } from '../data-source';
import { User } from '../entities/user.entity';
import { UserStatus } from '../entities/user.entity';

async function fixLoginIssue() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const email = process.argv[2];
    if (!email) {
      console.error('❌ Please provide an email address as argument');
      console.log('Usage: npm run fix:login <email>');
      process.exit(1);
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`🔍 Checking user: ${normalizedEmail}`);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      console.error(`❌ User with email ${normalizedEmail} not found`);
      process.exit(1);
    }

    console.log('\n📋 Current User Status:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Login Attempts: ${user.loginAttempts}`);
    console.log(`   Locked Until: ${user.lockedUntil || 'Not locked'}`);
    console.log(`   Email Verified: ${user.emailVerifiedAt ? 'Yes' : 'No'}`);
    console.log(`   Has Password Hash: ${!!user.passwordHash}`);

    // Fix issues
    let fixed = false;

    // 1. Unlock account if locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.log('\n🔓 Unlocking account...');
      user.lockedUntil = null;
      user.loginAttempts = 0;
      fixed = true;
    }

    // 2. Reset login attempts if > 0
    if (user.loginAttempts > 0) {
      console.log('\n🔄 Resetting login attempts...');
      user.loginAttempts = 0;
      fixed = true;
    }

    // 3. Activate account if not active
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING_VERIFICATION) {
      console.log('\n✅ Activating account...');
      user.status = UserStatus.ACTIVE;
      fixed = true;
    }

    if (fixed) {
      await userRepository.save(user);
      console.log('\n✅ User account fixed!');
      console.log('\n📋 Updated Status:');
      console.log(`   Status: ${user.status}`);
      console.log(`   Login Attempts: ${user.loginAttempts}`);
      console.log(`   Locked Until: ${user.lockedUntil || 'Not locked'}`);
      console.log('\n✅ You can now try logging in again!');
    } else {
      console.log('\n✅ No issues found. Account should be able to login.');
      console.log('\n⚠️  If login still fails, check:');
      console.log('   1. Password is correct');
      console.log('   2. Database connection is working');
      console.log('   3. Backend server is running');
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixLoginIssue();

