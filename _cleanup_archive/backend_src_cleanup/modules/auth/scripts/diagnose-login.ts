/**
 * Diagnostic script to check why login might be failing
 * Run this with: npx ts-node src/modules/auth/diagnose-login.ts <email>
 */

import { DataSource } from 'typeorm';
import { User, UserStatus, UserRole } from '../../entities/user.entity';
import * as bcrypt from 'bcryptjs';

async function diagnoseLogin(email: string) {
  // You'll need to configure your database connection
  // This is just a template - adjust based on your actual setup
  
  console.log(`\n🔍 Diagnosing login issue for: ${email}\n`);
  console.log('='.repeat(60));
  
  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();
  console.log(`📧 Normalized email: ${normalizedEmail}`);
  console.log(`📧 Original email: ${email}\n`);
  
  // Check points:
  console.log('✅ CHECK 1: Email normalization');
  console.log(`   - Original: "${email}"`);
  console.log(`   - Normalized: "${normalizedEmail}"`);
  console.log(`   - Match: ${email.toLowerCase().trim() === normalizedEmail ? '✅' : '❌'}\n`);
  
  // In a real scenario, you would:
  // 1. Connect to database
  // 2. Find user by normalized email
  // 3. Check user.status (must be ACTIVE or PENDING_VERIFICATION)
  // 4. Check user.lockedUntil (must be null or in the past)
  // 5. Check user.passwordHash exists
  // 6. Check if user.role is DRIVER/TENANT_ADMIN/LENDER with PENDING_VERIFICATION
  // 7. Test password hash comparison
  
  console.log('📋 Common reasons login fails with correct credentials:\n');
  console.log('1. ❌ Account Status: User must be ACTIVE or PENDING_VERIFICATION');
  console.log('   - Check: user.status === UserStatus.ACTIVE || user.status === UserStatus.PENDING_VERIFICATION');
  console.log('   - Fix: Verify email or activate account\n');
  
  console.log('2. ❌ Account Locked: Too many failed login attempts');
  console.log('   - Check: user.lockedUntil && user.lockedUntil > new Date()');
  console.log('   - Fix: Wait 30 minutes or reset lockedUntil in database\n');
  
  console.log('3. ❌ Password Hash Missing: User has no password set');
  console.log('   - Check: user.passwordHash !== null');
  console.log('   - Fix: User needs to set password via email link\n');
  
  console.log('4. ❌ Pending Verification for Drivers/Tenant Admins/Lenders');
  console.log('   - Check: role is DRIVER/TENANT_ADMIN/LENDER && status is PENDING_VERIFICATION');
  console.log('   - Fix: User must set password via email link first\n');
  
  console.log('5. ❌ Password Mismatch: bcrypt.compare fails');
  console.log('   - Check: Password hash in database vs provided password');
  console.log('   - Fix: Reset password or verify correct password\n');
  
  console.log('6. ❌ Email Case Sensitivity: Email in DB has different casing');
  console.log('   - Check: Database email vs normalized email');
  console.log('   - Fix: Email normalization should handle this, but check DB\n');
  
  console.log('='.repeat(60));
  console.log('\n💡 To check your specific account, run this query in your database:\n');
  console.log(`SELECT id, email, status, "lockedUntil", "loginAttempts", "passwordHash" IS NOT NULL as has_password, role`);
  console.log(`FROM users`);
  console.log(`WHERE LOWER(TRIM(email)) = '${normalizedEmail}';\n`);
}

// Run if called directly
if (require.main === module) {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node diagnose-login.ts <email>');
    process.exit(1);
  }
  diagnoseLogin(email);
}

export { diagnoseLogin };

