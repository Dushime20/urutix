import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Tenant } from '../entities/tenant.entity';
import { Load } from '../entities/load.entity';
import { Truck } from '../entities/truck.entity';
import { Bid } from '../entities/bid.entity';
import * as bcrypt from 'bcryptjs';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'urutix',
  // Include related entities referenced by User to avoid metadata errors
  entities: [User, UserProfile, Tenant, Load, Truck, Bid],
  synchronize: false,
  logging: true,
});

async function run() {
  const email = process.env.TARGET_EMAIL;
  const newPassword = process.env.NEW_PASSWORD;
  const makeAdmin =
    (process.env.MAKE_ADMIN || 'false').toLowerCase() === 'true';

  if (!email || !newPassword) {
    console.error('❌ TARGET_EMAIL and NEW_PASSWORD env vars are required');
    process.exit(1);
  }

  try {
    await dataSource.initialize();
    const repo = dataSource.getRepository(User);
    const user = await repo.findOne({ where: { email } });
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.status = UserStatus.ACTIVE;
    if (makeAdmin) {
      user.role = UserRole.SUPER_ADMIN;
    }
    await repo.save(user);
    console.log('✅ Password updated successfully');
    console.log(`👤 Email: ${email}`);
    console.log(`🔐 Role: ${user.role}`);
    console.log(`📊 Status: ${user.status}`);
  } catch (err: any) {
    console.error('❌ Error updating password:', err?.message || err);
    process.exit(1);
  } finally {
    await dataSource.destroy().catch(() => undefined);
  }
}

run().catch(console.error);
