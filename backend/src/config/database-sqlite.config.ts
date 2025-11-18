import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Load } from '../entities/load.entity';
import { Location } from '../entities/location.entity';
import { Truck } from '../entities/truck.entity';
import { Driver } from '../entities/driver.entity';
import { Trip } from '../entities/trip.entity';
import { Payment } from '../entities/payment.entity';
import { Notification } from '../entities/notification.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import { Tenant } from '../entities/tenant.entity';
import { TripLocation } from '../modules/tracking/entities/trip-location.entity';
import { DriverAlert } from '../modules/tracking/entities/driver-alert.entity';
import { TripEvent } from '../modules/tracking/entities/trip-event.entity';
import { Bid } from '../entities/bid.entity';
import { Auction } from '../entities/auction.entity';
import { Lender } from '../entities/Lender';
import { LenderPolicy } from '../entities/LenderPolicy';
import { LoanRequest } from '../entities/LoanRequest';
import { LoanDisbursement } from '../entities/LoanDisbursement';
import { LoanRepayment } from '../entities/LoanRepayment';

export const sqliteDatabaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [
    User,
    UserProfile,
    Load,
    Location,
    Truck,
    Driver,
    Trip,
    Payment,
    Notification,
    RefreshToken,
    PasswordResetToken,
    EmailVerificationToken,
    Tenant,
    TripLocation,
    DriverAlert,
    TripEvent,
    Bid,
    Auction,
    Lender,
    LenderPolicy,
    LoanRequest,
    LoanDisbursement,
    LoanRepayment,
  ],
  synchronize: true, // For development only
  logging: true,
};
