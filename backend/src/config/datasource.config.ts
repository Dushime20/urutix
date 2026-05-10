import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

// Import all entities
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Load } from '../entities/load.entity';
import { Location } from '../entities/location.entity';
import { Truck } from '../entities/truck.entity';
import { Driver } from '../entities/driver.entity';
import { Route } from '../entities/route.entity';
import { Trip } from '../entities/trip.entity';
import { Payment } from '../entities/payment.entity';
import { Tenant } from '../entities/tenant.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { Dispute } from '../entities/dispute.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { Notification } from '../entities/notification.entity';
import { Document } from '../entities/document.entity';
import { SystemSettings } from '../entities/system-settings.entity';

// Create and export the DataSource
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD || '1234'),
  database: process.env.DB_NAME || 'urutix',
  entities: [
    User,
    UserProfile,
    Load,
    Location,
    Truck,
    Driver,
    Route,
    Trip,
    Payment,
    Tenant,
    RefreshToken,
    PasswordResetToken,
    EmailVerificationToken,
    Dispute,
    AuditLog,
    Notification,
    Document,
    SystemSettings,
    // Add other entities as needed
  ],
  migrations: [
    'src/migrations/*.ts'
  ],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

export default AppDataSource;