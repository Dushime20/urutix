import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Tenant } from '../entities/tenant.entity';
import { Load } from '../entities/load.entity';
import { Truck } from '../entities/truck.entity';
import { Bid } from '../entities/bid.entity';

const userId = process.argv[2];
const newPassword = process.argv[3] || 'Password123!';

if (!userId) {
  console.error('❌ Usage: ts-node reset-password-by-id.ts <userId> [newPassword]');
  console.error('   Example: ts-node reset-password-by-id.ts beeb08b9-8d2a-43a5-9ae7-a7b63fecfb07 Password123!');
  process.exit(1);
}

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'urutix',
  entities: [User, UserProfile, Tenant, Load, Truck, Bid],
  synchronize: false,
  logging: true,
});

async function run() {
  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    const userRepository = dataSource.getRepository(User);
    
    console.log(`🔍 Looking for user with ID: ${userId}`);
    const user = await userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!user) {
      console.error(`❌ User not found with ID: ${userId}`);
      process.exit(1);
    }

    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}\n`);

    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log('💾 Updating password...');
    user.passwordHash = hashedPassword;
    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    await userRepository.save(user);

    console.log('\n✅ Password reset successfully!');
    console.log(`👤 User: ${user.email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`📊 Status: ${user.status}`);
    console.log(`🔓 Login attempts reset: 0`);
    console.log(`🔓 Account unlocked\n`);

  } catch (err: any) {
    console.error('❌ Error resetting password:', err?.message || err);
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }
    process.exit(1);
  } finally {
    console.log('🔌 Closing database connection...');
    await dataSource.destroy().catch(() => undefined);
    console.log('✅ Done');
  }
}

run().catch(console.error);

