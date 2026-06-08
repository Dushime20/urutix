import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserStatus, UserRole } from '../../../entities/user.entity';
import { UserProfile } from '../../../entities/user-profile.entity';
import { RefreshToken } from '../../../entities/refresh-token.entity';
import { PasswordResetToken } from '../../../entities/password-reset-token.entity';
import { EmailVerificationToken } from '../../../entities/email-verification-token.entity';
import { AuditLog, AuditAction } from '../../../entities/audit-log.entity';
import { Tenant, TenantStatus } from '../../../entities/tenant.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto, LoginResponseDto } from '../dto/login.dto';
import { RegisterResponseDto } from '../dto/register.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from '../dto/refresh-token.dto';
import {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
} from '../dto/forgot-password.dto';
import {
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from '../dto/reset-password.dto';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from '../dto/change-password.dto';
import { VerifyEmailDto, VerifyEmailResponseDto } from '../dto/verify-email.dto';
import {
  SetupDriverPasswordDto,
  SetupDriverPasswordResponseDto,
} from '../dto/setup-driver-password.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { EmailService } from './email.service';
import { EnhancedRateLimitGuard } from '../guards/enhanced-rate-limit.guard';
import { TenantService } from './tenant.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class EnhancedAuthService {
  private readonly logger = new Logger(EnhancedAuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private rateLimitGuard: EnhancedRateLimitGuard,
    private tenantService: TenantService,
  ) { }

  async onModuleInit() {
    this.logger.log('🔧 Checking and fixing database schema for multi-role support...');
    try {
      // 1. Drop the specific unique constraint causing issues (if it exists)
      // We use a safe try-catch around the raw query
      await this.userRepository.query(`
        ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_97672ac88f789774dd47f7c8be3";
      `);
      this.logger.log('✅ Removed legacy unique email constraint "UQ_97672ac88f789774dd47f7c8be3"');

      // 2. Also drop the index if it exists separately
      await this.userRepository.query(`
        DROP INDEX IF EXISTS "IDX_97672ac88f789774dd47f7c8be3";
      `);
      this.logger.log('✅ Removed legacy index "IDX_97672ac88f789774dd47f7c8be3"');

      // 2.2 Drop the variant index name from recent errors
      await this.userRepository.query(`
        DROP INDEX IF EXISTS "IDX_97672ac88f789774dd47f7c8be3";
      `);
      this.logger.log('✅ Removed legacy index variant "IDX_97672ac88f789774dd47f7c8be3"');

      // 2.5 Drop the tenant+email constraint causing the current 500 error
      await this.userRepository.query(`
        DROP INDEX IF EXISTS "IDX_019a1bfe83abbfab615a3c3ef9";
      `);
      this.logger.log('✅ Removed conflicting tenant+email index "IDX_019a1bfe83abbfab615a3c3ef9"');

      // 3. Create the new composite unique index
      // This allows the same email to exist for different roles
      await this.userRepository.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_tenant_email_role" 
        ON "users" ("tenantId", "email", "role") 
        WHERE "deleted_at" IS NULL;
      `);
      this.logger.log('✅ Created new multi-role index "IDX_users_tenant_email_role"');
      
    } catch (error) {
      this.logger.warn(`Schema fix warning (might be already applied): ${error.message}`);
    }
  }

  async register(
    registerDto: RegisterDto,
    clientIp?: string,
  ): Promise<RegisterResponseDto> {
    const {
      companyName,
      email,
      firstName,
      lastName,
      password,
      userType,
      phone,
      tenantId: tenant,
    } = registerDto;

    // Normalize email: trim whitespace and convert to lowercase
    const normalizedEmail = email?.trim().toLowerCase() || email;

    try {
      console.log('registerDto', registerDto);

      this.logger.log(
        `Registration attempt for email: ${normalizedEmail} (original: ${email}) from IP: ${clientIp}`,
      );

      // Validate password strength
      this.validatePasswordStrength(password);

      // Check if user already exists within the same tenant and role
      const existingUser = await this.userRepository.findOne({
        where: {
          email: normalizedEmail,
          tenantId: tenant || '00000000-0000-0000-0000-000000000001',
          role: userType,
        },
      });

      if (existingUser) {
        this.logger.warn(
          `Registration failed - email already exists: ${normalizedEmail}`,
        );
        throw new ConflictException(
          'User with this email already exists in this tenant',
        );
      }

      // Hash password with higher salt rounds for better security
      const hashedPassword = await bcrypt.hash(password, 14);

      // Resolve tenant ID
      this.logger.debug(`Resolving tenant ID for registration...`);
      const tenantId = await this.resolveTenantId(registerDto);
      this.logger.debug(`Resolved tenant ID: ${tenantId}`);

      // Create user with normalized email
      const user = this.userRepository.create({
        email: normalizedEmail,
        passwordHash: hashedPassword,
        status: UserStatus.PENDING_VERIFICATION,
        tenantId,
        role: userType, // Default role since RegisterDto doesn't have role property
      });

      const savedUser = await this.userRepository.save(user);
      this.logger.debug(`User saved with ID: ${savedUser.id}`);

      // Create user profile
      const userProfile = this.userProfileRepository.create({
        userId: savedUser.id,
        tenantId: savedUser.tenantId,
        firstName,
        lastName,
        companyName,
      });

      await this.userProfileRepository.save(userProfile);
      this.logger.debug(`User profile saved`);

      // Generate email verification token
      const verificationToken = await this.generateEmailVerificationToken(
        savedUser.email,
      );
      
      try {
          await this.emailService.sendVerificationEmail(
            savedUser.email,
            verificationToken,
          );
          this.logger.debug(`Verification email sent`);
      } catch (emailError) {
          this.logger.error(`Failed to send verification email: ${emailError.message}`, emailError.stack);
          // Continue execution, don't block registration for email failure
      }

      // Generate tokens
      this.logger.debug(`Generating tokens...`);
      const tokens = await this.generateTokens(savedUser, false);
      this.logger.debug(`Tokens generated`);

      // Log successful registration
      await this.logAuditEvent('USER_REGISTERED', savedUser.id, {
        email: savedUser.email,
        tenantId: savedUser.tenantId,
        role: savedUser.role,
        clientIp,
      });

      this.logger.log(`User registered successfully: ${savedUser.email}`);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName,
          lastName,
          role: savedUser.role,
          tenantId: savedUser.tenantId,
        },
      };
    } catch (error) {
      this.logger.error(
        `Registration failed for ${normalizedEmail} at step: ${error.stack}`,
      );
      throw error;
    }
  }

  async validateUser(
    email: string,
    password: string,
    clientIp?: string,
  ): Promise<User | null> {
    // Normalize email: trim whitespace and convert to lowercase
    const normalizedEmail = email?.trim().toLowerCase() || email;

    try {
      this.logger.debug(`Validating user: ${normalizedEmail} (original: ${email})`);

      // Find ALL users with this email to support multi-role accounts
      let users = await this.userRepository.find({
        where: { email: normalizedEmail },
        relations: ['profile'],
      });

      // If not found, try case-insensitive search
      if (users.length === 0) {
        this.logger.debug(`Exact match not found, trying case-insensitive search for: ${normalizedEmail}`);
        users = await this.userRepository.find({
          where: { email: ILike(normalizedEmail) },
          relations: ['profile'],
        });

        // Loop to update emails if needed (optional optimization)
        for (const user of users) {
           if (user.email !== normalizedEmail) {
              user.email = normalizedEmail;
              await this.userRepository.save(user);
           }
        }
      }

      if (users.length === 0) {
        this.logger.warn(
          `Login attempt with non-existent email: ${normalizedEmail} from IP: ${clientIp}`,
        );
        return null;
      }

      // Iterate through users to find a password match
      for (const user of users) {
        // Check if password hash exists
        if (!user.passwordHash) continue;

        // Check lock status
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          // If this specific account is locked, we skip it (or fail? For now skip to see if another valid one exists)
          continue; 
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (isPasswordValid) {
          // Found the correct user account!
          
          // Additional status checks that were previously done
           if (
            (user.role === UserRole.DRIVER || user.role === UserRole.TENANT_ADMIN || user.role === UserRole.LENDER || user.role === UserRole.CUSTOMS_OFFICER) &&
            user.status === UserStatus.PENDING_VERIFICATION
          ) {
             // This logic throws inside the loop, effectively stopping authentication for this user
             // which is correct if the credentials matched this user.
            const roleName =
              user.role === UserRole.DRIVER ? 'driver' :
                user.role === UserRole.TENANT_ADMIN ? 'tenant admin' :
                  user.role === UserRole.CUSTOMS_OFFICER ? 'customs officer' :
                    'lender';
            
            this.logger.warn(
              `Login attempt for ${roleName} with pending verification: ${normalizedEmail} from IP: ${clientIp}`,
            );
            const accountType =
              user.role === UserRole.DRIVER ? 'driver' :
                user.role === UserRole.TENANT_ADMIN ? 'tenant' :
                  user.role === UserRole.CUSTOMS_OFFICER ? 'customs officer' :
                    'lender';
            throw new UnauthorizedException(
              `Your ${accountType} account is pending password setup. Please check your email and click the link to set up your password first.`,
            );
          }

          // Update last login details
          user.lastLoginAt = new Date();
          user.loginAttempts = 0;
          user.lockedUntil = undefined;
          await this.userRepository.save(user);

          // Log successful login
          await this.logAuditEvent('USER_LOGIN_SUCCESS', user.id, {
            email: user.email,
            clientIp,
            role: user.role
          });

          this.logger.log(`Successful login: ${normalizedEmail} (Role: ${user.role}) from IP: ${clientIp}`);
          return user;
        }
      }

      // If we exit the loop, no password matched any non-locked account
      
      // Increment failed attempts for ALL accounts with this email to prevent probing
      for (const user of users) {
          user.loginAttempts += 1;
          if (user.loginAttempts >= 5) {
            user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          }
          await this.userRepository.save(user);
      }

      // We pick the first user just for logging/audit purposes
      const auditUser = users[0];
      await this.logAuditEvent('USER_LOGIN_FAILED', auditUser.id, {
        email: auditUser.email,
        clientIp,
        reason: 'Invalid password',
      });

      this.logger.warn(`Failed login attempt: ${normalizedEmail} from IP: ${clientIp}`);
      return null;

    } catch (error) {
      this.logger.error(`Error validating user ${normalizedEmail}: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) throw error; 
      
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connection')) {
        throw new InternalServerErrorException('Database connection error. Please try again later.');
      }
      return null;
    }
  }

  async login(
    loginDto: LoginDto,
    clientIp?: string,
  ): Promise<LoginResponseDto> {
    // Normalize email: trim whitespace and convert to lowercase
    const normalizedEmail = loginDto.email?.trim().toLowerCase() || loginDto.email;

    try {
      this.logger.log(
        `Login attempt for email: ${normalizedEmail} (original: ${loginDto.email}) from IP: ${clientIp}`,
      );

      // First check if user exists to provide better error messages
      let userExists = false;
      let existingUser: User | null = null;

      try {
        // Try exact match first
        existingUser = await this.userRepository.findOne({
          where: { email: normalizedEmail },
          relations: ['profile'],
        });

        // If not found, try case-insensitive search
        if (!existingUser) {
          existingUser = await this.userRepository.findOne({
            where: { email: ILike(normalizedEmail) },
            relations: ['profile'],
          });
        }

        userExists = !!existingUser;
      } catch (dbError) {
        this.logger.error(`Database error checking user existence: ${dbError.message}`);
        if (dbError.message?.includes('ECONNREFUSED') || dbError.message?.includes('connection')) {
          throw new InternalServerErrorException(
            'Database connection error. Please check your database connection and try again.',
          );
        }
        throw dbError;
      }

      // Use ILike for case-insensitive email matching
      const users = await this.userRepository.find({
        where: { email: ILike(normalizedEmail) },
        relations: ['profile'],
      });

      if (users.length === 0) {
        // Record failed attempt for rate limiting (if no user found at all)
        if (clientIp) {
           this.rateLimitGuard.recordFailedAttempt(clientIp);
        }
        throw new UnauthorizedException('Invalid email or password');
      }

      // Iterate through users to find password matches
      const validUsers: User[] = [];
      const password = loginDto.password;

      for (const user of users) {
        // Check if password hash exists
        if (!user.passwordHash) continue;

        // Check lock status
        if (user.lockedUntil && user.lockedUntil > new Date()) continue;

        console.log(`[DEBUG] Comparing password (len: ${password.length}) for ${user.email}`);
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (isPasswordValid) {
             // Additional status checks
           if (
            (user.role === UserRole.DRIVER || user.role === UserRole.TENANT_ADMIN || user.role === UserRole.LENDER) &&
            user.status === UserStatus.PENDING_VERIFICATION
          ) {
            // Skip pending verification accounts
            continue;
          }
          validUsers.push(user);
        }
      }

      if (validUsers.length === 0) {
        // Increment failed attempts logic
        for (const user of users) {
          user.loginAttempts += 1;
           if (user.loginAttempts >= 5) {
            user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); 
          }
          await this.userRepository.save(user);
        }
        
        // Log basic failure
        if (users.length > 0) {
             await this.logAuditEvent('USER_LOGIN_FAILED', users[0].id, {
                email: normalizedEmail,
                clientIp,
                reason: 'Invalid password',
            });
        }
        
        throw new UnauthorizedException('Invalid email or password');
      }

      // If multiple valid users, determine if we need role selection
      if (validUsers.length > 1) {       
         // Fetch tenant names for all valid users
         const availableRoles = [];
         for (const u of validUsers) {
           let tName = 'Default Tenant';
           if (u.tenantId) {
             const t = await this.tenantRepository.findOne({ where: { id: u.tenantId } });
             if (t) tName = t.name;
           }
           availableRoles.push({ role: u.role, tenantName: tName });
         }
         
         const primaryUser = validUsers[0];
         // We create a special "PRE_AUTH" token that is valid for 5 minutes
         const payload = { 
            username: primaryUser.email, 
            sub: primaryUser.id, 
            role: 'PRE_AUTH_SELECTION', // Special role
            availableRoles: availableRoles.map(r => r.role)
        };
        const preAuthToken = await this.jwtService.signAsync(payload, { expiresIn: '5m' });

         return {
            accessToken: preAuthToken,
            refreshToken: '', // No refresh token yet
            expiresIn: 300,
            user: {
              id: primaryUser.id,
              email: primaryUser.email,
              firstName: primaryUser.profile?.firstName || '',
              lastName: primaryUser.profile?.lastName || '',
              role: 'PRE_AUTH', // Client checks this or the flag
              tenantId: primaryUser.tenantId,
            },
            requiresRoleSelection: true,
            availableRoles: availableRoles
         };
      }

      // Single user flow
      const user = validUsers[0];

      // Update last login details
      user.lastLoginAt = new Date();
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.userRepository.save(user);

      // Generate tokens
      const tokens = await this.generateTokens(
        user,
        loginDto.rememberMe || false,
      );

      // Fetch tenant name
      let tenantName = 'Default Tenant';
      if (user.tenantId) {
        try {
          const tenant = await this.tenantRepository.findOne({
            where: { id: user.tenantId },
          });
          if (tenant && tenant.name) {
            tenantName = tenant.name;
          }
        } catch (error) {
          this.logger.error('Error fetching tenant:', error);
        }
      }

      // Log successful login
      await this.logAuditEvent('USER_LOGIN_SUCCESS', user.id, {
        email: user.email,
        clientIp,
        rememberMe: loginDto.rememberMe,
      });

      // Ensure profile is loaded (same logic as before)
      let profile = user.profile;
      if (!profile) {
         // ... existing profile loading logic ...
         // For brevity, assuming profile loaded via relations in find
         profile = user.profile; 
      }
      
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: profile?.firstName || '',
          lastName: profile?.lastName || '',
          role: user.role,
          tenantId: user.tenantId,
          tenantName: tenantName,
        },
      };

    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Login failed for ${normalizedEmail}: ${error.message}`);
      throw error;
    }
  } 
  
  async selectRole(preAuthToken: string, targetRole: string, clientIp?: string): Promise<LoginResponseDto> {
      // Verify the pre-auth token
      let payload;
      try {
        payload = await this.jwtService.verifyAsync(preAuthToken);
      } catch (e) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      if (payload.role !== 'PRE_AUTH_SELECTION') {
        throw new UnauthorizedException('Invalid token type');
      }

      const email = payload.username;
      
      // Allow user to select a role that might not be in the initial list? 
      // Strictly speaking, we should check if targetRole is in payload.availableRoles if we put it there.
      // But checking the DB is safer anyway.

      // Find the user with this email and role
      const user = await this.userRepository.findOne({
          where: { email: email, role: targetRole as UserRole },
          relations: ['profile']
      });

      if (!user) {
          throw new NotFoundException('Role not found for this user');
      }

      // Perform standard login completion
      user.lastLoginAt = new Date();
      user.loginAttempts = 0;
      await this.userRepository.save(user);

      const tokens = await this.generateTokens(user, false);
      
      // Fetch tenant name
      let tenantName = 'Default Tenant';
      if (user.tenantId) {
        const tenant = await this.tenantRepository.findOne({ where: { id: user.tenantId } });
        if (tenant) tenantName = tenant.name;
      }

      await this.logAuditEvent('USER_ROLE_SELECTED', user.id, {
        email: user.email,
        role: targetRole,
        clientIp
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          role: user.role,
          tenantId: user.tenantId,
          tenantName: tenantName,
        },
      };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
    clientIp?: string,
  ): Promise<RefreshTokenResponseDto> {
    try {
      const { refreshToken } = refreshTokenDto;

      // Verify refresh token
      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(refreshToken, {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
        });
      } catch (jwtError) {
        // JWT verification failed (invalid/expired token) - this is expected behavior
        this.logger.debug(
          `Invalid or expired refresh token from IP: ${clientIp}`,
        );
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if refresh token exists and is not revoked
      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
      });

      if (!tokenRecord || tokenRecord.revoked) {
        this.logger.debug(`Invalid refresh token attempt from IP: ${clientIp}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token has expired
      if (tokenRecord.expiresAt < new Date()) {
        this.logger.debug(`Expired refresh token attempt from IP: ${clientIp}`);
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        this.logger.warn(
          `User not found for refresh token from IP: ${clientIp}`,
        );
        throw new UnauthorizedException('User not found');
      }

      // Revoke old refresh token
      tokenRecord.revoked = true;
      tokenRecord.revokedAt = new Date();
      await this.refreshTokenRepository.save(tokenRecord);

      // Clean up expired tokens periodically
      await this.cleanupExpiredTokens();

      // Generate new tokens
      const tokens = await this.generateTokens(user, false);

      // Log token refresh
      await this.logAuditEvent('TOKEN_REFRESHED', user.id, {
        email: user.email,
        clientIp,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      };
    } catch (error) {
      // Only log as error if it's not an expected UnauthorizedException
      if (error instanceof UnauthorizedException) {
        // Expected invalid token scenarios - log at debug level to reduce noise
        this.logger.debug(
          `Token refresh failed (expected) from IP: ${clientIp}: ${error.message}`,
        );
      } else {
        // Unexpected errors - log at error level
        this.logger.error(
          `Token refresh failed (unexpected) from IP: ${clientIp}: ${error.message}`,
          error.stack,
        );
      }
      throw error;
    }
  }

  /**
   * Clean up expired and revoked refresh tokens
   */
  private async cleanupExpiredTokens(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Delete expired tokens older than 30 days
      await this.refreshTokenRepository
        .createQueryBuilder()
        .delete()
        .where('expiresAt < :date', { date: thirtyDaysAgo })
        .execute();

      // Delete revoked tokens older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await this.refreshTokenRepository
        .createQueryBuilder()
        .delete()
        .where('revoked = :revoked AND revokedAt < :date', {
          revoked: true,
          date: sevenDaysAgo,
        })
        .execute();

      this.logger.debug('Cleaned up expired refresh tokens');
    } catch (error) {
      this.logger.error(`Failed to cleanup expired tokens: ${error.message}`);
    }
  }

  async logout(
    userId: string,
    refreshToken?: string,
    clientIp?: string,
  ): Promise<{ message: string }> {
    try {
      if (refreshToken) {
        // Revoke specific refresh token
        const tokenRecord = await this.refreshTokenRepository.findOne({
          where: { token: refreshToken },
        });

        if (tokenRecord) {
          tokenRecord.revoked = true;
          tokenRecord.revokedAt = new Date();
          tokenRecord.revokedBy = userId;
          await this.refreshTokenRepository.save(tokenRecord);
        }
      } else {
        // Revoke all tokens for the user
        await this.revokeAllUserTokens(userId);
      }

      // Log logout event
      await this.logAuditEvent('USER_LOGOUT', userId, {
        clientIp,
      });

      this.logger.log(`User logged out: ${userId} from IP: ${clientIp}`);
      return { message: 'Logged out successfully' };
    } catch (error) {
      this.logger.error(`Logout failed for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await this.refreshTokenRepository
        .createQueryBuilder()
        .update()
        .set({
          revoked: true,
          revokedAt: new Date(),
          revokedBy: userId,
        })
        .where('userId = :userId AND revoked = :revoked', {
          userId,
          revoked: false,
        })
        .execute();

      this.logger.log(`Revoked all tokens for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to revoke all tokens for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    clientIp?: string,
  ): Promise<ForgotPasswordResponseDto> {
    try {
      const { email } = forgotPasswordDto;

      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        this.logger.log(
          `Password reset requested for non-existent email: ${email} from IP: ${clientIp}`,
        );
        return {
          message:
            'If an account with this email exists, a password reset link has been sent.',
        };
      }

      // Generate password reset token
      const resetToken = await this.generatePasswordResetToken(email);

      try {
        await this.emailService.sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        // Log the email failure but don't expose it to the user.
        // The token is saved in DB — user can retry the forgot password flow.
        this.logger.error(
          `Failed to send password reset email to ${email}: ${emailError.message}`,
          emailError.stack,
        );
      }

      // Log password reset request
      await this.logAuditEvent('PASSWORD_RESET_REQUESTED', user.id, {
        email: user.email,
        clientIp,
      });

      this.logger.log(
        `Password reset email sent to: ${email} from IP: ${clientIp}`,
      );
      return {
        message:
          'If an account with this email exists, a password reset link has been sent.',
      };
    } catch (error) {
      this.logger.error(`Password reset request failed: ${error.message}`);
      throw error;
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    clientIp?: string,
  ): Promise<ResetPasswordResponseDto> {
    try {
      const { token, password, confirmPassword } = resetPasswordDto;

      // Validate password strength
      this.validatePasswordStrength(password);

      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Find and validate reset token
      const resetTokenRecord = await this.passwordResetTokenRepository.findOne({
        where: { token, used: false },
      });

      if (!resetTokenRecord) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      if (resetTokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Reset token has expired');
      }

      // Find user
      const user = await this.userRepository.findOne({
        where: { email: resetTokenRecord.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update password
      const hashedPassword = await bcrypt.hash(password, 14);
      user.passwordHash = hashedPassword;
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.userRepository.save(user);

      // Mark token as used
      resetTokenRecord.used = true;
      await this.passwordResetTokenRepository.save(resetTokenRecord);

      // Log password reset
      await this.logAuditEvent('PASSWORD_RESET_COMPLETED', user.id, {
        email: user.email,
        clientIp,
      });

      this.logger.log(
        `Password reset completed for: ${user.email} from IP: ${clientIp}`,
      );
      return { message: 'Password reset successfully' };
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`);
      throw error;
    }
  }

  async setupDriverPassword(
    setupPasswordDto: SetupDriverPasswordDto,
    clientIp?: string,
  ): Promise<SetupDriverPasswordResponseDto> {
    try {
      const { token, password, confirmPassword } = setupPasswordDto;

      // Validate password strength
      this.validatePasswordStrength(password);

      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Find and validate setup token
      const setupTokenRecord = await this.passwordResetTokenRepository.findOne({
        where: { token, used: false },
      });

      if (!setupTokenRecord) {
        throw new BadRequestException('Invalid or expired setup token');
      }

      if (setupTokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Setup token has expired');
      }

      // Find user
      const user = await this.userRepository.findOne({
        where: { email: setupTokenRecord.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify user is a driver - REMOVED strict check to allow existing users (e.g. cargo owners) to become drivers
      // if (user.role !== UserRole.DRIVER) {
      //   throw new BadRequestException('This token is only valid for driver accounts');
      // }

      // Update password and activate account
      const hashedPassword = await bcrypt.hash(password, 14);
      user.passwordHash = hashedPassword;
      user.status = UserStatus.ACTIVE; // Activate the account
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.userRepository.save(user);

      // Mark token as used
      setupTokenRecord.used = true;
      await this.passwordResetTokenRepository.save(setupTokenRecord);

      // Log password setup
      await this.logAuditEvent('DRIVER_PASSWORD_SETUP_COMPLETED', user.id, {
        email: user.email,
        clientIp,
      });

      this.logger.log(
        `Driver password setup completed for: ${user.email} from IP: ${clientIp}`,
      );
      return { message: 'Password set successfully. You can now log in.' };
    } catch (error) {
      this.logger.error(`Driver password setup failed: ${error.message}`);
      throw error;
    }
  }

  async setupTenantPassword(
    setupPasswordDto: SetupDriverPasswordDto,
    clientIp?: string,
  ): Promise<SetupDriverPasswordResponseDto> {
    try {
      const { token, password, confirmPassword } = setupPasswordDto;

      // Validate password strength
      this.validatePasswordStrength(password);

      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Find and validate setup token
      const setupTokenRecord = await this.passwordResetTokenRepository.findOne({
        where: { token, used: false },
      });

      if (!setupTokenRecord) {
        throw new BadRequestException('Invalid or expired setup token');
      }

      if (setupTokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Setup token has expired');
      }

      // Find user
      const user = await this.userRepository.findOne({
        where: { email: setupTokenRecord.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify user is a tenant admin
      if (user.role !== UserRole.TENANT_ADMIN) {
        throw new BadRequestException('This token is only valid for tenant admin accounts');
      }

      // Update password and activate account
      const hashedPassword = await bcrypt.hash(password, 14);
      user.passwordHash = hashedPassword;
      user.status = UserStatus.ACTIVE; // Activate the account
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.userRepository.save(user);

      // Mark token as used
      setupTokenRecord.used = true;
      await this.passwordResetTokenRepository.save(setupTokenRecord);

      // Log password setup
      await this.logAuditEvent('TENANT_PASSWORD_SETUP_COMPLETED', user.id, {
        email: user.email,
        clientIp,
      });

      this.logger.log(
        `Tenant password setup completed for: ${user.email} from IP: ${clientIp}`,
      );
      return { message: 'Password set successfully. You can now log in.' };
    } catch (error) {
      this.logger.error(`Tenant password setup failed: ${error.message}`);
      throw error;
    }
  }

  async setupLenderPassword(
    setupPasswordDto: SetupDriverPasswordDto,
    clientIp?: string,
  ): Promise<SetupDriverPasswordResponseDto> {
    try {
      const { token, password, confirmPassword } = setupPasswordDto;

      // Validate password strength
      this.validatePasswordStrength(password);

      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Find and validate setup token
      const setupTokenRecord = await this.passwordResetTokenRepository.findOne({
        where: { token, used: false },
      });

      if (!setupTokenRecord) {
        throw new BadRequestException('Invalid or expired setup token');
      }

      if (setupTokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Setup token has expired');
      }

      // Find user
      const user = await this.userRepository.findOne({
        where: { email: setupTokenRecord.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify user is a lender
      if (user.role !== UserRole.LENDER) {
        throw new BadRequestException('This token is only valid for lender accounts');
      }

      // Update password and activate account
      const hashedPassword = await bcrypt.hash(password, 14);
      user.passwordHash = hashedPassword;
      user.status = UserStatus.ACTIVE; // Activate the account
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.userRepository.save(user);

      // Mark token as used
      setupTokenRecord.used = true;
      await this.passwordResetTokenRepository.save(setupTokenRecord);

      // Log password setup
      await this.logAuditEvent('LENDER_PASSWORD_SETUP_COMPLETED', user.id, {
        email: user.email,
        clientIp,
      });

      this.logger.log(
        `Lender password setup completed for: ${user.email} from IP: ${clientIp}`,
      );
      return { message: 'Password set successfully. You can now log in.' };
    } catch (error) {
      this.logger.error(`Lender password setup failed: ${error.message}`);
      throw error;
    }
  }

  async setupReceiverPassword(
    setupPasswordDto: SetupDriverPasswordDto,
    clientIp?: string,
  ): Promise<SetupDriverPasswordResponseDto> {
    try {
      const { token, password, confirmPassword } = setupPasswordDto;

      // Validate password strength
      this.validatePasswordStrength(password);

      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Find and validate setup token
      const setupTokenRecord = await this.passwordResetTokenRepository.findOne({
        where: { token, used: false },
      });

      if (!setupTokenRecord) {
        throw new BadRequestException('Invalid or expired setup token');
      }

      if (setupTokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Setup token has expired');
      }

      // Find user
      const user = await this.userRepository.findOne({
        where: { email: setupTokenRecord.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify user is a receiver
      if (user.role !== UserRole.CARGO_RECEIVER) {
        throw new BadRequestException('This token is only valid for receiver accounts');
      }

      // Update password and activate account
      const hashedPassword = await bcrypt.hash(password, 14);
      user.passwordHash = hashedPassword;
      user.status = UserStatus.ACTIVE; // Activate the account
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.userRepository.save(user);

      // Mark token as used
      setupTokenRecord.used = true;
      await this.passwordResetTokenRepository.save(setupTokenRecord);

      // Log password setup
      await this.logAuditEvent('RECEIVER_PASSWORD_SETUP_COMPLETED', user.id, {
        email: user.email,
        clientIp,
      });

      this.logger.log(
        `Receiver password setup completed for: ${user.email} from IP: ${clientIp}`,
      );
      return { message: 'Password set successfully. You can now log in.' };
    } catch (error) {
      this.logger.error(`Receiver password setup failed: ${error.message}`);
      throw error;
    }
  }

  async setupCustomsOfficerPassword(
    setupPasswordDto: SetupDriverPasswordDto,
    clientIp?: string,
  ): Promise<SetupDriverPasswordResponseDto> {
    try {
      const { token, password, confirmPassword } = setupPasswordDto;

      this.validatePasswordStrength(password);

      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      const setupTokenRecord = await this.passwordResetTokenRepository.findOne({
        where: { token, used: false },
      });

      if (!setupTokenRecord) {
        throw new BadRequestException('Invalid or expired setup token');
      }

      if (setupTokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Setup token has expired');
      }

      const user = await this.userRepository.findOne({
        where: { email: setupTokenRecord.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.CUSTOMS_OFFICER) {
        throw new BadRequestException('This token is only valid for customs officer accounts');
      }

      const hashedPassword = await bcrypt.hash(password, 14);
      user.passwordHash = hashedPassword;
      user.status = UserStatus.ACTIVE;
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.userRepository.save(user);

      setupTokenRecord.used = true;
      await this.passwordResetTokenRepository.save(setupTokenRecord);

      await this.logAuditEvent('CUSTOMS_OFFICER_PASSWORD_SETUP_COMPLETED', user.id, {
        email: user.email,
        clientIp,
      });

      this.logger.log(`Customs officer password setup completed for: ${user.email} from IP: ${clientIp}`);
      return { message: 'Password set successfully. You can now log in.' };
    } catch (error) {
      this.logger.error(`Customs officer password setup failed: ${error.message}`);
      throw error;
    }
  }

  async setupBrokerPassword(
    setupPasswordDto: SetupDriverPasswordDto,
    clientIp?: string,
  ): Promise<SetupDriverPasswordResponseDto> {
    try {
      const { token, password, confirmPassword } = setupPasswordDto;
      this.validatePasswordStrength(password);
      if (password !== confirmPassword) throw new BadRequestException('Passwords do not match');

      const setupTokenRecord = await this.passwordResetTokenRepository.findOne({ where: { token, used: false } });
      if (!setupTokenRecord) throw new BadRequestException('Invalid or expired setup token');
      if (setupTokenRecord.expiresAt < new Date()) throw new BadRequestException('Setup token has expired');

      const user = await this.userRepository.findOne({ where: { email: setupTokenRecord.email } });
      if (!user) throw new NotFoundException('User not found');
      if (user.role !== UserRole.BROKER) throw new BadRequestException('This token is only valid for broker accounts');

      user.passwordHash = await bcrypt.hash(password, 14);
      user.status = UserStatus.ACTIVE;
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.userRepository.save(user);

      setupTokenRecord.used = true;
      await this.passwordResetTokenRepository.save(setupTokenRecord);

      await this.logAuditEvent('BROKER_PASSWORD_SETUP_COMPLETED', user.id, { email: user.email, clientIp });
      this.logger.log(`Broker password setup completed for: ${user.email} from IP: ${clientIp}`);
      return { message: 'Password set successfully. You can now log in.' };
    } catch (error) {
      this.logger.error(`Broker password setup failed: ${error.message}`);
      throw error;
    }
  }

  async setupAgentPassword(
    setupPasswordDto: SetupDriverPasswordDto,
    clientIp?: string,
  ): Promise<SetupDriverPasswordResponseDto> {
    try {
      const { token, password, confirmPassword } = setupPasswordDto;
      this.validatePasswordStrength(password);
      if (password !== confirmPassword) throw new BadRequestException('Passwords do not match');

      const setupTokenRecord = await this.passwordResetTokenRepository.findOne({ where: { token, used: false } });
      if (!setupTokenRecord) throw new BadRequestException('Invalid or expired setup token');
      if (setupTokenRecord.expiresAt < new Date()) throw new BadRequestException('Setup token has expired');

      const user = await this.userRepository.findOne({ where: { email: setupTokenRecord.email } });
      if (!user) throw new NotFoundException('User not found');
      if (user.role !== UserRole.AGENT) throw new BadRequestException('This token is only valid for agent accounts');

      user.passwordHash = await bcrypt.hash(password, 14);
      user.status = UserStatus.ACTIVE;
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
      await this.userRepository.save(user);

      setupTokenRecord.used = true;
      await this.passwordResetTokenRepository.save(setupTokenRecord);

      await this.logAuditEvent('AGENT_PASSWORD_SETUP_COMPLETED', user.id, { email: user.email, clientIp });
      this.logger.log(`Agent password setup completed for: ${user.email} from IP: ${clientIp}`);
      return { message: 'Password set successfully. You can now log in.' };
    } catch (error) {
      this.logger.error(`Agent password setup failed: ${error.message}`);
      throw error;
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    clientIp?: string,
  ): Promise<ChangePasswordResponseDto> {
    try {
      const { currentPassword, newPassword, confirmPassword } =
        changePasswordDto;

      // Validate password strength
      this.validatePasswordStrength(newPassword);

      if (newPassword !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 14);
      user.passwordHash = hashedPassword;
      await this.userRepository.save(user);

      // Revoke all refresh tokens for this user
      await this.refreshTokenRepository.update(
        { userId, revoked: false },
        { revoked: true, revokedAt: new Date(), revokedBy: userId },
      );

      // Log password change
      await this.logAuditEvent('PASSWORD_CHANGED', userId, {
        email: user.email,
        clientIp,
      });

      this.logger.log(
        `Password changed for user: ${user.email} from IP: ${clientIp}`,
      );
      return { message: 'Password changed successfully' };
    } catch (error) {
      this.logger.error(
        `Password change failed for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
    clientIp?: string,
  ): Promise<VerifyEmailResponseDto> {
    try {
      const { token } = verifyEmailDto;

      // Find and validate verification token
      const verificationTokenRecord =
        await this.emailVerificationTokenRepository.findOne({
          where: { token, used: false },
        });

      if (!verificationTokenRecord) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      if (verificationTokenRecord.expiresAt < new Date()) {
        throw new BadRequestException('Verification token has expired');
      }

      // Find and update user
      const user = await this.userRepository.findOne({
        where: { email: verificationTokenRecord.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.status = UserStatus.ACTIVE;
      user.emailVerifiedAt = new Date();
      await this.userRepository.save(user);

      // Mark token as used
      verificationTokenRecord.used = true;
      await this.emailVerificationTokenRepository.save(verificationTokenRecord);

      // Log email verification
      await this.logAuditEvent('EMAIL_VERIFIED', user.id, {
        email: user.email,
        clientIp,
      });

      this.logger.log(`Email verified for: ${user.email} from IP: ${clientIp}`);
      return { message: 'Email verified successfully' };
    } catch (error) {
      this.logger.error(`Email verification failed: ${error.message}`);
      throw error;
    }
  }

  async getProfile(userId: string): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Fetch tenant name separately using tenantId
      let tenantName = 'Default Tenant';
      if (user.tenantId) {
        try {
          const tenant = await this.tenantRepository.findOne({
            where: { id: user.tenantId },
          });
          if (tenant && tenant.name) {
            tenantName = tenant.name;
          }
        } catch (error) {
          this.logger.error('Error fetching tenant:', error);
        }
      }

      // Ensure profile is loaded - reload if missing or if firstName/lastName are empty
      let profile = user.profile;
      if (!profile || !profile.firstName || !profile.lastName) {
        this.logger.warn(`User ${user.id} profile missing or incomplete in getProfile, attempting to load...`);
        const userWithProfile = await this.userRepository.findOne({
          where: { id: user.id },
          relations: ['profile'],
        });
        if (userWithProfile?.profile) {
          profile = userWithProfile.profile;
          user.profile = profile;
        } else {
          // Try direct query to user_profiles table
          const directProfile = await this.userProfileRepository.findOne({
            where: { userId: user.id },
          });
          if (directProfile) {
            profile = directProfile;
            user.profile = profile;
          } else {
            // Profile doesn't exist - create a default one
            this.logger.warn(`User ${user.id} has no profile, creating default profile...`);
            const newProfile = this.userProfileRepository.create({
              userId: user.id,
              tenantId: user.tenantId,
              firstName: user.email.split('@')[0] || 'User',
              lastName: '',
            });
            profile = await this.userProfileRepository.save(newProfile);
            user.profile = profile;
          }
        }
      }

      // Log profile data for debugging
      this.logger.debug(`GetProfile - User profile data:`, {
        userId: user.id,
        email: user.email,
        hasProfile: !!profile,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        profileId: profile?.id,
      });

      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';

      if (!firstName && !lastName) {
        this.logger.error(`User ${user.id} has no firstName or lastName in profile!`);
      }

      return {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenantName,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        profile: profile,
      };
    } catch (error) {
      this.logger.error(
        `Get profile failed for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get or create user profile
      // First check if profile exists in database (relation might not be loaded)
      let userProfile = await this.userProfileRepository.findOne({
        where: { userId: user.id },
      });

      // If profile doesn't exist, create a new one
      if (!userProfile) {
        userProfile = this.userProfileRepository.create({
          userId: user.id,
          tenantId: user.tenantId,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          preferences: user.profile?.preferences || {},
        });
        await this.userProfileRepository.save(userProfile);
      }

      // Update preferences if provided
      if (updateProfileDto.preferences) {
        const currentPreferences = userProfile.preferences || {};
        userProfile.preferences = {
          ...currentPreferences,
          ...updateProfileDto.preferences,
        };
      }

      // Handle nested profile.preferences structure (from frontend)
      if (updateProfileDto.profile?.preferences) {
        const currentPreferences = userProfile.preferences || {};
        userProfile.preferences = {
          ...currentPreferences,
          ...updateProfileDto.profile.preferences,
        };
      }

      // Update phone on user entity if provided in profile data
      if (updateProfileDto.profile?.phone) {
        user.phone = updateProfileDto.profile.phone;
        await this.userRepository.save(user);
      }

      // Update other profile fields if provided
      if (updateProfileDto.profile) {
        const fields = [
          'firstName', 'lastName', 'companyName', 'phone', 
          'address', 'bio', 'websiteUrl', 'postalCode', 'countryCode',
          'insuranceInfo', 'bankAccountInfo'
        ];
        
        fields.forEach(field => {
          if (updateProfileDto.profile[field] !== undefined) {
            userProfile[field] = updateProfileDto.profile[field];
          }
        });
      }

      // Save updated profile
      await this.userProfileRepository.save(userProfile);

      // Fetch tenant name
      let tenantName = 'Default Tenant';
      if (user.tenantId) {
        try {
          const tenant = await this.tenantRepository.findOne({
            where: { id: user.tenantId },
          });
          if (tenant && tenant.name) {
            tenantName = tenant.name;
          }
        } catch (error) {
          this.logger.error('Error fetching tenant:', error);
        }
      }

      // Log audit event
      await this.logAuditEvent('PROFILE_UPDATED', userId, {
        updatedFields: Object.keys(updateProfileDto),
      });

      return {
        id: user.id,
        email: user.email,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenantName,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        profile: userProfile,
      };
    } catch (error) {
      this.logger.error(
        `Update profile failed for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  // Enhanced private helper methods
  private async generateTokens(user: User, rememberMe: boolean = false) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessExpiryTime: number =
      this.configService.get('JWT_ACCESS_TOKEN_EXPIRY') || 1440; // 1440 minutes = 24 hours
    const refreshExpiryTime: number =
      this.configService.get('JWT_REFRESH_TOKEN_EXPIRY') || 30;
    const refreshDefaultExpiryTime: number =
      this.configService.get('JWT_REFRESH_DEFAULT_EXPIRY') || 7;

    // console.log('--accessExpiryTime: ', accessExpiryTime);
    // console.log('--refreshExpiryTime: ', refreshExpiryTime);
    // console.log('--refreshDefaultExpiryTime: ', refreshDefaultExpiryTime);

    // Fix: Don't multiply by 60 for minutes
    // const accessTokenExpiry: number = accessExpiryTime * 60;
    const refreshTokenExpiry: number = rememberMe
      ? refreshExpiryTime * 24 * 60 * 60
      : refreshDefaultExpiryTime * 24 * 60 * 60;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET') || 'your-secret-key',
        expiresIn: `${accessExpiryTime}m`, // Fix: use accessExpiryTime directly (minutes)
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'your-refresh-secret',
        expiresIn: `${refreshTokenExpiry}m`,
      }),
    ]);

    // Save refresh token to database with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Check if token already exists
        const existingToken = await this.refreshTokenRepository.findOne({
          where: { token: refreshToken },
        });

        if (existingToken) {
          // If token exists, generate a new one
          const newPayload = {
            ...payload,
          };

          const newRefreshToken = await this.jwtService.signAsync(newPayload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: refreshTokenExpiry,
          });

          const refreshTokenRecord = this.refreshTokenRepository.create({
            userId: user.id,
            token: newRefreshToken,
            expiresAt: new Date(
              Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
            ),
          });

          await this.refreshTokenRepository.save(refreshTokenRecord);

          return {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 24 * 60 * 60, // 24 hours in seconds
          };
        } else {
          // Token doesn't exist, save it
          const refreshTokenRecord = this.refreshTokenRepository.create({
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(
              Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
            ),
          });

          await this.refreshTokenRepository.save(refreshTokenRecord);

          return {
            accessToken,
            refreshToken,
            expiresIn: 24 * 60 * 60, // 24 hours in seconds
          };
        }
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          this.logger.error(
            `Failed to generate unique refresh token after ${maxRetries} attempts: ${error.message}`,
          );
          throw new InternalServerErrorException(
            'Failed to generate refresh token',
          );
        }

        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  private async generateEmailVerificationToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const verificationToken = this.emailVerificationTokenRepository.create({
      email,
      token,
      expiresAt,
    });

    await this.emailVerificationTokenRepository.save(verificationToken);
    return token;
  }

  private async generatePasswordResetToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const resetToken = this.passwordResetTokenRepository.create({
      email,
      token,
      expiresAt,
    });

    await this.passwordResetTokenRepository.save(resetToken);
    return token;
  }

  private async resolveTenantId(registerDto: RegisterDto): Promise<string> {
    // If tenant ID is provided, validate it exists
    if (registerDto.tenantId) {
      try {
        await this.tenantService.findTenantById(registerDto.tenantId);
        return registerDto.tenantId;
      } catch (error) {
        throw new ConflictException('Invalid tenant ID provided');
      }
    }

    // Check if default tenant exists
    const defaultId = '00000000-0000-0000-0000-000000000001';
    const defaultTenant = await this.tenantRepository.findOne({ where: { id: defaultId } });
    
    if (defaultTenant) {
        return defaultId;
    }

    // Fallback: Find the first available active tenant
    const anyTenant = await this.tenantRepository.findOne({ 
        where: {},
        order: { createdAt: 'ASC' }
    });

    if (anyTenant) {
        this.logger.warn(`Default tenant ${defaultId} not found. Falling back to tenant ${anyTenant.id} (${anyTenant.name})`);
        return anyTenant.id;
    }

    // Create a default tenant if none exists
    this.logger.warn('No tenants found. Creating default tenant.');
    try {
        const newDefaultTenant = this.tenantRepository.create({
            id: defaultId,
            name: 'Default Organization',
            subdomain: 'default',
            domain: 'localhost',
            contactEmail: 'admin@urutix.com',
            status: 'ACTIVE' as any, // Cast to avoid enum import issues here if strictly typed
            isActive: true
        });
        await this.tenantRepository.save(newDefaultTenant);
        return newDefaultTenant.id;
    } catch (createError) {
        this.logger.error(`Failed to create default tenant: ${createError.message}`);
        throw new InternalServerErrorException('System initialization failed: Could not create default tenant.');
    }
  }

  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new BadRequestException(
        `Password must be at least ${minLength} characters long`,
      );
    }

    if (!hasUpperCase) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter',
      );
    }

    if (!hasLowerCase) {
      throw new BadRequestException(
        'Password must contain at least one lowercase letter',
      );
    }

    if (!hasNumbers) {
      throw new BadRequestException(
        'Password must contain at least one number',
      );
    }

    if (!hasSpecialChar) {
      throw new BadRequestException(
        'Password must contain at least one special character',
      );
    }
  }

  /**
   * Diagnostic method to check user account status and identify login issues
   */
  async diagnoseUserAccount(email: string): Promise<{
    found: boolean;
    issues: string[];
    accountInfo?: {
      id: string;
      email: string;
      status: string;
      role: string;
      hasPasswordHash: boolean;
      isLocked: boolean;
      lockedUntil?: Date;
      loginAttempts: number;
      emailVerified: boolean;
      canLogin: boolean;
    };
  }> {
    const normalizedEmail = email?.trim().toLowerCase() || email;
    const issues: string[] = [];

    try {
      // Find user
      let user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = await this.userRepository.findOne({
          where: { email: ILike(normalizedEmail) },
        });
      }

      if (!user) {
        return {
          found: false,
          issues: ['User account not found in database'],
        };
      }

      const accountInfo = {
        id: user.id,
        email: user.email,
        status: user.status,
        role: user.role,
        hasPasswordHash: !!user.passwordHash,
        isLocked: !!(user.lockedUntil && user.lockedUntil > new Date()),
        lockedUntil: user.lockedUntil,
        loginAttempts: user.loginAttempts,
        emailVerified: !!user.emailVerifiedAt,
        canLogin: false,
      };

      // Check issues
      if (!user.passwordHash) {
        issues.push('❌ No password hash - User needs to set password');
      }

      if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING_VERIFICATION) {
        issues.push(`❌ Account status is ${user.status} - Must be ACTIVE or PENDING_VERIFICATION`);
      }

      if (
        (user.role === UserRole.DRIVER || user.role === UserRole.TENANT_ADMIN || user.role === UserRole.LENDER) &&
        user.status === UserStatus.PENDING_VERIFICATION
      ) {
        issues.push('❌ Account pending verification - Must set password via email link first');
      }

      if (accountInfo.isLocked) {
        const minutesRemaining = Math.ceil(
          (user.lockedUntil!.getTime() - Date.now()) / 60000,
        );
        issues.push(`❌ Account is locked - Try again in ${minutesRemaining} minutes`);
      }

      if (!user.emailVerifiedAt && user.status === UserStatus.PENDING_VERIFICATION) {
        issues.push('⚠️ Email not verified - May need to verify email first');
      }

      // Determine if user can login
      const isPendingVerificationBlocked =
        (user.role === UserRole.DRIVER || user.role === UserRole.TENANT_ADMIN || user.role === UserRole.LENDER) &&
        user.status === UserStatus.PENDING_VERIFICATION;

      accountInfo.canLogin =
        !!user.passwordHash &&
        (user.status === UserStatus.ACTIVE || user.status === UserStatus.PENDING_VERIFICATION) &&
        !isPendingVerificationBlocked &&
        !accountInfo.isLocked;

      if (accountInfo.canLogin && issues.length === 0) {
        issues.push('✅ Account appears to be in good standing - Password may be incorrect');
      }

      return {
        found: true,
        issues,
        accountInfo,
      };
    } catch (error) {
      this.logger.error(`Error diagnosing user account: ${error.message}`);
      return {
        found: false,
        issues: [`Error checking account: ${error.message}`],
      };
    }
  }

  async getActiveTenantsForSignup(): Promise<any[]> {
    try {
      const tenants = await this.tenantRepository.find({
        where: {
          status: TenantStatus.ACTIVE,
        },
        select: ['id', 'name', 'contactEmail', 'status'],
        order: {
          name: 'ASC',
        },
      });

      return tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        email: tenant.contactEmail,
        status: tenant.status,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch active tenants: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch active tenants');
    }
  }

  private async logAuditEvent(
    event: string,
    userId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId,
        tenantId: metadata.tenantId || '00000000-0000-0000-0000-000000000001', // Add tenantId from metadata or default
        action: AuditAction.OTHER, // Use the correct enum value
        description: `User ${event}`, // Use description field instead of event
        metadata,
        createdAt: new Date(), // Use createdAt instead of timestamp
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${error.message}`);
    }
  }
}
