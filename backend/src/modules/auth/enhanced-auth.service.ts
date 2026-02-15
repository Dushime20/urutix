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
import { User, UserStatus, UserRole } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { PasswordResetToken } from '../../entities/password-reset-token.entity';
import { EmailVerificationToken } from '../../entities/email-verification-token.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { Tenant } from '../../entities/tenant.entity';
import { SecurityEvent, SecurityEventType, SecuritySeverity } from '../../entities/security-event.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from './dto/refresh-token.dto';
import {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
} from './dto/forgot-password.dto';
import {
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from './dto/reset-password.dto';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './dto/change-password.dto';
import { VerifyEmailDto, VerifyEmailResponseDto } from './dto/verify-email.dto';
import {
  SetupDriverPasswordDto,
  SetupDriverPasswordResponseDto,
} from './dto/setup-driver-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmailService } from './email.service';
import { EnhancedRateLimitGuard } from './enhanced-rate-limit.guard';
import { TenantService } from './tenant.service';
import { ActivityLogService } from '../../services/activity-log.service';
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
    @InjectRepository(SecurityEvent)
    private readonly securityEventRepository: Repository<SecurityEvent>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private rateLimitGuard: EnhancedRateLimitGuard,
    private tenantService: TenantService,
    private activityLogService: ActivityLogService,
  ) {}

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

      // Check if user already exists within the same tenant
      const existingUser = await this.userRepository.findOne({
        where: {
          email: normalizedEmail,
          tenantId: tenant || '00000000-0000-0000-0000-000000000001',
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
      const tenantId = await this.resolveTenantId(registerDto);

      // Create user with normalized email
      const user = this.userRepository.create({
        email: normalizedEmail,
        passwordHash: hashedPassword,
        status: UserStatus.PENDING_VERIFICATION,
        tenantId,
        role: userType, // Default role since RegisterDto doesn't have role property
      });

      const savedUser = await this.userRepository.save(user);

      // Create user profile
      const userProfile = this.userProfileRepository.create({
        userId: savedUser.id,
        tenantId: savedUser.tenantId,
        firstName,
        lastName,
        companyName,
      });

      await this.userProfileRepository.save(userProfile);

      // Generate email verification token
      const verificationToken = await this.generateEmailVerificationToken(
        savedUser.email,
      );
      await this.emailService.sendVerificationEmail(
        savedUser.email,
        verificationToken,
      );

      // Generate tokens
      const tokens = await this.generateTokens(savedUser, false);

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
        `Registration failed for ${normalizedEmail}: ${error.message}`,
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
      
      // Try exact match first with normalized email
      let user = await this.userRepository.findOne({
        where: { email: normalizedEmail },
        relations: ['profile'],
      });

      // If not found, try case-insensitive search (for existing users with different casing)
      if (!user) {
        this.logger.debug(`Exact match not found, trying case-insensitive search for: ${normalizedEmail}`);
        user = await this.userRepository.findOne({
          where: { email: ILike(normalizedEmail) },
          relations: ['profile'],
        });
        
        // If found with case-insensitive search, log a warning and update the email to normalized version
        if (user) {
          this.logger.warn(
            `User found with case-insensitive match. Updating email from "${user.email}" to "${normalizedEmail}" for consistency.`
          );
          user.email = normalizedEmail;
          await this.userRepository.save(user);
        }
      }

      if (!user) {
        this.logger.warn(
          `Login attempt with non-existent email: ${normalizedEmail} from IP: ${clientIp}`,
        );
        return null;
      }

      this.logger.debug(`User found: ${user.id}, status: ${user.status}, email verified: ${!!user.emailVerifiedAt}`);
      
      // Enhanced diagnostic logging
      this.logger.debug(`Login diagnostic for ${normalizedEmail}:`, {
        userId: user.id,
        email: user.email,
        status: user.status,
        role: user.role,
        hasPasswordHash: !!user.passwordHash,
        lockedUntil: user.lockedUntil,
        loginAttempts: user.loginAttempts,
        emailVerified: !!user.emailVerifiedAt,
      });

      // Check if password hash exists
      if (!user.passwordHash) {
        this.logger.error(`User ${normalizedEmail} has no password hash`);
        return null;
      }

      // For drivers, tenant admins, and lenders with PENDING_VERIFICATION status, they must set password first
      // Other user types might be able to login with PENDING_VERIFICATION
      if (
        (user.role === UserRole.DRIVER || user.role === UserRole.TENANT_ADMIN || user.role === UserRole.LENDER) &&
        user.status === UserStatus.PENDING_VERIFICATION
      ) {
        const roleName = 
          user.role === UserRole.DRIVER ? 'driver' : 
          user.role === UserRole.TENANT_ADMIN ? 'tenant admin' : 
          'lender';
        this.logger.warn(
          `Login attempt for ${roleName} with pending verification: ${normalizedEmail} from IP: ${clientIp}. ${roleName} needs to set password first via email link.`,
        );
        const accountType = 
          user.role === UserRole.DRIVER ? 'driver' : 
          user.role === UserRole.TENANT_ADMIN ? 'tenant' : 
          'lender';
        throw new UnauthorizedException(
          `Your ${accountType} account is pending password setup. Please check your email and click the link to set up your password first.`,
        );
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const minutesRemaining = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 60000,
        );
        this.logger.warn(
          `Login attempt for locked account: ${normalizedEmail} from IP: ${clientIp}. Locked for ${minutesRemaining} more minutes.`,
        );
        throw new UnauthorizedException(
          `Account is locked. Please try again in ${minutesRemaining} minutes.`,
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (isPasswordValid) {
        // Update last login and reset login attempts
        user.lastLoginAt = new Date();
        user.loginAttempts = 0;
        user.lockedUntil = undefined;
        await this.userRepository.save(user);

        // Log successful login
        await this.logAuditEvent('USER_LOGIN_SUCCESS', user.id, {
          email: user.email,
          clientIp,
        });

        this.logger.log(`Successful login: ${normalizedEmail} from IP: ${clientIp}`);
        return user;
      } else {
        // Increment failed login attempts
        user.loginAttempts += 1;

        // Implement account lockout after 5 failed attempts
        if (user.loginAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          this.logger.warn(
            `Account locked for 30 minutes: ${normalizedEmail} from IP: ${clientIp}`,
          );
        }

        await this.userRepository.save(user);

        // Log failed login attempt
        await this.logAuditEvent('USER_LOGIN_FAILED', user.id, {
          email: user.email,
          clientIp,
          reason: 'Invalid password',
        });

        // Create security event for failed login
        await this.createSecurityEvent({
          userId: user.id,
          tenantId: user.tenantId,
          eventType: SecurityEventType.FAILED_LOGIN,
          severity: user.loginAttempts >= 3 ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM,
          ipAddress: clientIp,
          details: {
            email: user.email,
            loginAttempts: user.loginAttempts,
            reason: 'Invalid password',
          },
        });

        this.logger.warn(`Failed login attempt: ${normalizedEmail} from IP: ${clientIp} (attempt ${user.loginAttempts})`);
        this.logger.debug(`Password comparison failed for user ${normalizedEmail}. Password hash exists: ${!!user.passwordHash}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error validating user ${normalizedEmail}: ${error.message}`, error.stack);
      // Check if it's a database connection error
      if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connection')) {
        this.logger.error('Database connection error during user validation');
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

      const user = await this.validateUser(
        normalizedEmail,
        loginDto.password,
        clientIp,
      );

      if (!user) {
        // Record failed attempt for rate limiting
        if (clientIp) {
          this.rateLimitGuard.recordFailedAttempt(clientIp);
        }
        
        // Provide more helpful error message if user exists but password is wrong
        if (userExists && existingUser) {
          if (existingUser.status !== UserStatus.ACTIVE && existingUser.status !== UserStatus.PENDING_VERIFICATION) {
            throw new UnauthorizedException(
              'Account is not active. Please verify your email first.',
            );
          }
          if (existingUser.lockedUntil && existingUser.lockedUntil > new Date()) {
            const remainingTime = Math.ceil(
              (existingUser.lockedUntil.getTime() - Date.now()) / 1000 / 60,
            );
            throw new UnauthorizedException(
              `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingTime} minutes.`,
            );
          }
        }
        
        throw new UnauthorizedException(
          'Invalid email or password. Please check your credentials and try again.',
        );
      }

      // Check if user is active or pending verification (allow both to login)
      if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING_VERIFICATION) {
        throw new UnauthorizedException(
          'Account is not active. Please verify your email first.',
        );
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingTime = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 1000 / 60,
        );
        throw new UnauthorizedException(
          `Account is temporarily locked. Please try again in ${remainingTime} minutes.`,
        );
      }

      // Generate tokens
      const tokens = await this.generateTokens(
        user,
        loginDto.rememberMe || false,
      );

      // Create user session
      try {
        const sessionId = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + (loginDto.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000);
        
        // Note: userAgent should be passed from the controller via request headers
        // For now, we'll use undefined and it can be added later
        await this.activityLogService.upsertSession(sessionId, user.id, {
          ipAddress: clientIp,
          userAgent: undefined, // TODO: Pass from controller via @Headers('user-agent')
          deviceInfo: undefined, // Will be parsed from userAgent when available
          expiresAt,
        });

        this.logger.debug(`Session created for user ${user.email}: ${sessionId}`);
      } catch (sessionError) {
        // Log error but don't fail login if session creation fails
        this.logger.error(`Failed to create session for user ${user.email}: ${sessionError.message}`);
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

      // Log successful login
      await this.logAuditEvent('USER_LOGIN_SUCCESS', user.id, {
        email: user.email,
        clientIp,
        rememberMe: loginDto.rememberMe,
      });

      // Ensure profile is loaded - reload if missing or if firstName/lastName are empty
      let profile = user.profile;
      if (!profile || !profile.firstName || !profile.lastName) {
        this.logger.warn(`User ${user.id} profile missing or incomplete, attempting to load...`);
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
      this.logger.debug(`Login - User profile data:`, {
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
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          firstName,
          lastName,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: tenantName,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed for ${normalizedEmail}: ${error.message}`);
      throw error;
    }
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
      await this.emailService.sendPasswordResetEmail(email, resetToken);

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

      // Verify user is a driver
      if (user.role !== UserRole.DRIVER) {
        throw new BadRequestException('This token is only valid for driver accounts');
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

      // Update other profile fields if provided
      if (updateProfileDto.profile) {
        if (updateProfileDto.profile.firstName) {
          userProfile.firstName = updateProfileDto.profile.firstName;
        }
        if (updateProfileDto.profile.lastName) {
          userProfile.lastName = updateProfileDto.profile.lastName;
        }
        if (updateProfileDto.profile.companyName) {
          userProfile.companyName = updateProfileDto.profile.companyName;
        }
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
      this.configService.get('JWT_ACCESS_TOKEN_EXPIRY') || 15;
    const refreshExpiryTime: number =
      this.configService.get('JWT_REFRESH_TOKEN_EXPIRY') || 30;
    const refreshDefaultExpiryTime: number =
      this.configService.get('JWT_REFRESH_DEFAULT_EXPIRY') || 7;

    // console.log('--accessExpiryTime: ', accessExpiryTime);
    // console.log('--refreshExpiryTime: ', refreshExpiryTime);
    // console.log('--refreshDefaultExpiryTime: ', refreshDefaultExpiryTime);

    const accessTokenExpiry: number = accessExpiryTime * 60;
    const refreshTokenExpiry: number = rememberMe
      ? refreshExpiryTime * 24 * 60 * 60
      : refreshDefaultExpiryTime * 24 * 60 * 60;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: `${accessTokenExpiry}m`,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
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
            expiresIn: 15 * 60, // 15 minutes in seconds
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
            expiresIn: 15 * 60, // 15 minutes in seconds
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

    // TODO: Implement proper tenant discovery based on:
    // 1. Subdomain from request headers
    // 2. Organization code in registration
    // 3. Invitation token
    // 4. Default tenant for public registration

    // For now, use default tenant
    return '00000000-0000-0000-0000-000000000001';
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

  /**
   * Create a security event
   */
  private async createSecurityEvent(data: {
    userId: string;
    tenantId: string;
    eventType: SecurityEventType;
    severity: SecuritySeverity;
    ipAddress?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      const securityEvent = this.securityEventRepository.create({
        userId: data.userId,
        tenantId: data.tenantId,
        eventType: data.eventType,
        severity: data.severity,
        ipAddress: data.ipAddress,
        details: data.details,
      });

      await this.securityEventRepository.save(securityEvent);
    } catch (error) {
      this.logger.error(`Failed to create security event: ${error.message}`);
    }
  }

  /**
   * Parse user agent string to extract device info
   */
  private parseUserAgent(userAgent?: string): any {
    if (!userAgent) {
      return {
        browser: 'Unknown',
        os: 'Unknown',
        device: 'Unknown',
        isMobile: false,
      };
    }

    // Simple user agent parsing (in production, use a library like ua-parser-js)
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
    
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return {
      browser,
      os,
      device: isMobile ? 'Mobile' : 'Desktop',
      isMobile,
    };
  }
}
