import { AppDataSource } from './data-source';
import { User, UserStatus } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

async function resetAll() {
  const emails = [
    'superadmin@urutix.com',
    'admin@urutix.com'
  ];
  const pwd = 'UrutiX2026!';

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    const repo = AppDataSource.getRepository(User);
    for (const email of emails) {
      const user = await repo.findOne({ where: { email } });
      if (user) {
        user.passwordHash = await bcrypt.hash(pwd, 14); // 14 rounds
        user.status = UserStatus.ACTIVE;
        user.loginAttempts = 0;
        await repo.save(user);
        console.log(`✅ Reset ${email}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await AppDataSource.destroy();
  }
}

resetAll();
