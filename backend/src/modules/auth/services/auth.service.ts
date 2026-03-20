import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserStatus } from '../../../entities/user.entity';
import { UserProfile } from '../../../entities/user-profile.entity';
import { RefreshToken } from '../../../entities/refresh-token.entity';
import { PasswordResetToken } from '../../../entities/password-reset-token.entity';
import { EmailVerificationToken } from '../../../entities/email-verification-token.entity';
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
import { EmailService } from './email.service';
import { RateLimitGuard } from '../../payments/guards/rate-limit.guard';
import { TenantService } from './tenant.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
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
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private rateLimitGuard: RateLimitGuard,
    private tenantService: TenantService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const {
      email,
      password,
      firstName,
      lastName,
      companyName,
      userType,
      tenantId: tenant,
    } = registerDto;

    console.log('--- registerDto', registerDto);

    // Check if user already exists within the same tenant
    const existingUser = await this.userRepository.findOne({
      where: {
        email,
        tenantId: tenant || '00000000-0000-0000-0000-000000000001', // Allow tenant specification
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists in this tenant',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Resolve tenant ID - implement proper tenant management
    const tenantId = await this.resolveTenantId(registerDto);

    // Check if user should be auto-verified (Truck Owners and Cargo Owners)
    const isAutoVerified = ['TRUCK_OWNER', 'CARGO_OWNER'].includes(userType);
    const initialStatus = isAutoVerified ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION;

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      status: initialStatus,
      emailVerifiedAt: isAutoVerified ? new Date() : null,
      tenantId,
      role: userType,
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

    // Generate email verification token only if user is not auto-verified
    if (!isAutoVerified) {
      const verificationToken = await this.generateEmailVerificationToken(
        savedUser.email,
      );
      await this.emailService.sendVerificationEmail(
        savedUser.email,
        verificationToken,
      );
    }

    // Generate tokens
    const tokens = await this.generateTokens(savedUser, false);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: savedUser.role,
        tenantId: savedUser.tenantId,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      // Update last login
      user.lastLoginAt = new Date();
      user.loginAttempts = 0;
      await this.userRepository.save(user);
      return user;
    }

    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active or pending verification (allow both to login)
    if (user.status !== UserStatus.ACTIVE && user.status !== UserStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException(
        'Account is not active. Please verify your email first.',
      );
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account is temporarily locked. Please try again later.',
      );
    }

    // Generate tokens
    const tokens = await this.generateTokens(
      user,
      loginDto.rememberMe || false,
    );

    // Fetch tenant and validate status
    let tenantName = 'Default Tenant';
    if (user.tenantId) {
      try {
        const tenant = await this.tenantRepository.findOne({
          where: { id: user.tenantId },
        });
        
        if (!tenant) {
          throw new UnauthorizedException('Tenant not found');
        }

        // Check tenant status - only ACTIVE tenants can access the system
        // Super admins can bypass this check
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
          if (tenant.status !== TenantStatus.ACTIVE) {
            let errorMessage = 'Your tenant account is not active.';
            if (tenant.status === TenantStatus.PENDING_ACTIVATION) {
              errorMessage = 'Your tenant account is pending activation. Please contact your administrator.';
            } else if (tenant.status === TenantStatus.SUSPENDED) {
              errorMessage = 'Your tenant account has been suspended. Please contact support.';
            } else if (tenant.status === TenantStatus.DEACTIVATED) {
              errorMessage = 'Your tenant account has been deactivated. Please contact support.';
            }
            throw new UnauthorizedException(errorMessage);
          }
        }

        if (tenant.name) {
          tenantName = tenant.name;
        }
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        console.error('Error fetching tenant:', error);
      }
    }

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
  ): Promise<RefreshTokenResponseDto> {
    const { refreshToken } = refreshTokenDto;

    // Verify refresh token
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret:
          this.configService.get('JWT_REFRESH_SECRET') || 'your-refresh-secret',
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token exists and is not revoked
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.revoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token has expired
    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Get user
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old refresh token
    tokenRecord.revoked = true;
    tokenRecord.revokedAt = new Date();
    await this.refreshTokenRepository.save(tokenRecord);

    // Generate new tokens
    const tokens = await this.generateTokens(user, false);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async logout(
    userId: string,
    refreshToken?: string,
  ): Promise<{ message: string }> {
    if (refreshToken) {
      // Revoke refresh token
      const tokenRecord = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken },
      });

      if (tokenRecord) {
        tokenRecord.revoked = true;
        tokenRecord.revokedAt = new Date();
        tokenRecord.revokedBy = userId;
        await this.refreshTokenRepository.save(tokenRecord);
      }
    }

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message:
          'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Generate password reset token
    const resetToken = await this.generatePasswordResetToken(email);
    await this.emailService.sendPasswordResetEmail(email, resetToken);

    return {
      message:
        'If an account with this email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
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

    // Update password with stronger hashing
    const hashedPassword = await bcrypt.hash(password, 14);
    user.passwordHash = hashedPassword;
    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    await this.userRepository.save(user);

    // Mark token as used
    resetTokenRecord.used = true;
    await this.passwordResetTokenRepository.save(resetTokenRecord);

    // Security: Invalidate all existing refresh tokens for this user
    // This forces re-login on all devices after password reset
    await this.refreshTokenRepository.update(
      { userId: user.id, revoked: false },
      { 
        revoked: true, 
        revokedAt: new Date(),
        revokedBy: user.id,
      },
    );

    return { message: 'Password reset successfully. Please log in again.' };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

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
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.passwordHash = hashedPassword;
    await this.userRepository.save(user);

    // Revoke all refresh tokens for this user
    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true, revokedAt: new Date(), revokedBy: userId },
    );

    return { message: 'Password changed successfully' };
  }

  async verifyEmail(
    verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponseDto> {
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

    return { message: 'Email verified successfully' };
  }

  async getProfile(userId: string): Promise<any> {
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
        console.error('Error fetching tenant:', error);
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      role: user.role,
      tenantId: user.tenantId,
      tenantName: tenantName,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  // Private helper methods
  private async generateTokens(user: User, rememberMe: boolean = false) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const accessTokenExpiry = '24h'; // 24 hours session duration
    const refreshTokenExpiry = rememberMe ? '30d' : '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET') || 'your-secret-key',
        expiresIn: accessTokenExpiry,
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get('JWT_REFRESH_SECRET') || 'your-refresh-secret',
        expiresIn: refreshTokenExpiry,
      }),
    ]);

    // Save refresh token to database
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
    // Invalidate any existing unused reset tokens for this email
    await this.passwordResetTokenRepository.update(
      { email, used: false },
      { used: true },
    );

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

  /**
   * Validate password strength
   * Requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   */
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
        'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)',
      );
    }
  }

  // Add tenant resolution method
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
}
