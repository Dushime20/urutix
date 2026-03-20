/**
 * Utility script to fix common login issues
 * This can be run directly or imported as a function
 * 
 * Usage: 
 *   npx ts-node -r tsconfig-paths/register src/modules/auth/fix-login-issues.ts uruticargo@gmail.com
 */

import { DataSource, ILike } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { User, UserStatus } from '../../entities/user.entity';

async function fixLoginIssues(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  
  console.log(`\n🔧 Fixing login issues for: ${normalizedEmail}\n`);
  console.log('='.repeat(60));

  try {
    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Database connected');
    }

    const userRepository = AppDataSource.getRepository(User);

    // Find user
    let user = await userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await userRepository.findOne({
        where: { email: ILike(normalizedEmail) },
      });
    }

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log(`✅ User found: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Has Password: ${!!user.passwordHash}`);
    console.log(`   Locked: ${!!(user.lockedUntil && user.lockedUntil > new Date())}`);
    console.log(`   Login Attempts: ${user.loginAttempts}\n`);

    let fixed = false;

    // Fix 1: Unlock account if locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      console.log('🔓 Unlocking account...');
      user.lockedUntil = null;
      user.loginAttempts = 0;
      fixed = true;
    }

    // Fix 2: Reset login attempts if too high
    if (user.loginAttempts >= 5) {
      console.log('🔄 Resetting login attempts...');
      user.loginAttempts = 0;
      fixed = true;
    }

    // Fix 3: Activate account if it's PENDING_VERIFICATION and should be active
    // (Only for CARGO_OWNER and TRUCK_OWNER - they can login with PENDING_VERIFICATION)
    // For other roles, we won't auto-activate

    // Fix 4: Ensure email is normalized
    if (user.email !== normalizedEmail) {
      console.log(`📧 Normalizing email from "${user.email}" to "${normalizedEmail}"...`);
      user.email = normalizedEmail;
      fixed = true;
    }

    if (fixed) {
      await userRepository.save(user);
      console.log('✅ Account issues fixed!\n');
    } else {
      console.log('ℹ️  No issues found that can be auto-fixed.\n');
      console.log('💡 Possible remaining issues:');
      if (!user.passwordHash) {
        console.log('   - No password hash (user needs to set password)');
      }
      if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING_VERIFICATION) {
        console.log(`   - Account status is ${user.status} (should be ACTIVE or PENDING_VERIFICATION)`);
      }
      if (
        (user.role === 'DRIVER' || user.role === 'TENANT_ADMIN' || user.role === 'LENDER') &&
        user.status === UserStatus.PENDING_VERIFICATION
      ) {
        console.log('   - Account needs password setup via email link');
      }
    }

    console.log('='.repeat(60));
    console.log('\n✅ Done! Try logging in again.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node -r tsconfig-paths/register src/modules/auth/fix-login-issues.ts <email>');
    process.exit(1);
  }
  fixLoginIssues(email);
}

export { fixLoginIssues };

