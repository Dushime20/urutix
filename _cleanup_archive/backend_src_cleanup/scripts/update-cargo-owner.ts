import { DataSource } from 'typeorm';
import { Load } from '../entities/load.entity';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Tenant } from '../entities/tenant.entity';
import { Location } from '../entities/location.entity';
import { Truck } from '../entities/truck.entity';
import { Driver } from '../entities/driver.entity';
import { Trip } from '../entities/trip.entity';
import { Payment } from '../entities/payment.entity';
import { Notification } from '../entities/notification.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { Dispute } from '../entities/dispute.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { UserRating } from '../entities/user-rating.entity';
import { UserReward } from '../entities/user-reward.entity';
import { UserScore } from '../entities/user-score.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '123',
  database: 'urutix',
  entities: [
    Load,
    User,
    UserProfile,
    Tenant,
    Location,
    Truck,
    Driver,
    Trip,
    Payment,
    Notification,
    RefreshToken,
    PasswordResetToken,
    EmailVerificationToken,
    Dispute,
    AuditLog,
    UserRating,
    UserReward,
    UserScore,
  ],
  synchronize: false,
  logging: true,
});

async function updateCargoOwner() {
  try {
    console.log('🔍 Updating cargo owner...');

    await dataSource.initialize();
    console.log('✅ Database connected!');

    const loadRepository = dataSource.getRepository(Load);
    const userRepository = dataSource.getRepository(User);

    // Find the test user
    const testUser = await userRepository.findOne({
      where: { email: 'cargo@test.com' },
    });

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('✅ Found test user:', testUser.id);

    // Update all cargos to use the test user as owner
    const result = await loadRepository.update(
      { tenantId: '00000000-0000-0000-0000-000000000001' },
      { cargoOwnerId: testUser.id },
    );

    console.log('✅ Updated cargos:', result.affected, 'cargos updated');

    // Verify the update
    const cargos = await loadRepository.find({
      where: { tenantId: '00000000-0000-0000-0000-000000000001' },
    });

    console.log('📦 Current cargos:');
    cargos.forEach((cargo) => {
      console.log(`- ${cargo.title} (Owner: ${cargo.cargoOwnerId})`);
    });
  } catch (error) {
    console.error('❌ Error updating cargo owner:', error);
  } finally {
    await dataSource.destroy();
  }
}

updateCargoOwner();
