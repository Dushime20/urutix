import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  HttpException,
  Logger,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { EnhancedAuthService } from './enhanced-auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
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
import { JwtAuthGuard } from './jwt-auth.guard';
import { EnhancedRateLimitGuard } from './enhanced-rate-limit.guard';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Request } from 'express';

@ApiTags('Enhanced Authentication')
@Controller('auth')
export class EnhancedAuthController {
  private readonly logger = new Logger(EnhancedAuthController.name);

  constructor(
    private readonly authService: EnhancedAuthService,
    private readonly rateLimitGuard: EnhancedRateLimitGuard,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EnhancedRateLimitGuard)
  @ApiOperation({
    summary: 'User login with enhanced security',
    description:
      'Authenticate user with email and password with rate limiting and security logging',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Login credentials',
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account locked',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid credentials' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Too many failed attempts. Please try again later.',
        },
        statusCode: { type: 'number', example: 429 },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    try {
      const clientIp = this.getClientIp(req);
      this.logger.log(
        `Login attempt for ${loginDto.email} from IP: ${clientIp}`,
      );

      const result = await this.authService.login(loginDto, clientIp);

      // Record successful attempt to clear rate limiting
      this.rateLimitGuard.recordSuccessfulAttempt(clientIp);

      this.logger.log(
        `Successful login for ${loginDto.email} from IP: ${clientIp}`,
      );
      return result;
    } catch (error) {
      const clientIp = this.getClientIp(req);

      // Record failed attempt for rate limiting
      this.rateLimitGuard.recordFailedAttempt(
        clientIp,
        req.headers['user-agent'] as string,
      );

      this.logger.error(
        `Login failed for ${loginDto.email} from IP: ${clientIp}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User registration with enhanced security',
    description:
      'Register a new user account with password strength validation and security logging',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'Registration data',
  })
  @ApiCreatedResponse({
    description: 'Registration successful',
    type: RegisterResponseDto,
  })
  @ApiConflictResponse({
    description: 'User already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'User already exists' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or weak password',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Password must be at least 8 characters long',
        },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<RegisterResponseDto> {
    try {
      const clientIp = this.getClientIp(req);
      this.logger.log(
        `Registration attempt for ${registerDto.email} from IP: ${clientIp}`,
      );

      const result = await this.authService.register(registerDto, clientIp);

      this.logger.log(
        `Successful registration for ${registerDto.email} from IP: ${clientIp}`,
      );
      return result;
    } catch (error) {
      const clientIp = this.getClientIp(req);
      this.logger.error(
        `Registration failed for ${registerDto.email} from IP: ${clientIp}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token with enhanced security',
    description:
      'Get new access token using refresh token with security validation',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token',
  })
  @ApiOkResponse({
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid refresh token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Invalid refresh token' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<RefreshTokenResponseDto> {
    try {
      const clientIp = this.getClientIp(req);
      this.logger.log(`Token refresh attempt from IP: ${clientIp}`);

      const result = await this.authService.refreshToken(
        refreshTokenDto,
        clientIp,
      );

      this.logger.log(`Token refreshed successfully from IP: ${clientIp}`);
      return result;
    } catch (error) {
      const clientIp = this.getClientIp(req);
      this.logger.error(
        `Token refresh failed from IP: ${clientIp}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User logout with enhanced security',
    description: 'Logout user and revoke refresh token with security logging',
  })
  @ApiOkResponse({
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out successfully' },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  async logout(
    @Req() req: Request,
    @Body() body?: { refreshToken?: string },
  ): Promise<ApiResponseDto> {
    try {
      const clientIp = this.getClientIp(req);
      this.logger.log(
        `Logout attempt for user ${req?.user?.userId} from IP: ${clientIp}`,
      );

      const result = await this.authService.logout(
        req?.user?.userId,
        body?.refreshToken,
        clientIp,
      );

      this.logger.log(
        `Successful logout for user ${req?.user?.userId} from IP: ${clientIp}`,
      );
      return {
        success: true,
        message: result.message,
        statusCode: 200,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const clientIp = this.getClientIp(req);
      this.logger.error(
        `Logout failed for user ${req?.user?.userId} from IP: ${clientIp}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password with enhanced security',
    description: 'Send password reset email with security logging',
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'Email address',
  })
  @ApiOkResponse({
    description: 'Password reset email sent',
    type: ForgotPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Req() req: Request,
  ): Promise<ForgotPasswordResponseDto> {
    try {
      const clientIp = this.getClientIp(req);
      this.logger.log(
        `Password reset request for ${forgotPasswordDto.email} from IP: ${clientIp}`,
      );

      const result = await this.authService.forgotPassword(
        forgotPasswordDto,
        clientIp,
      );

      this.logger.log(
        `Password reset email sent to ${forgotPasswordDto.email} from IP: ${clientIp}`,
      );
      return result;
    } catch (error) {
      const clientIp = this.getClientIp(req);
      this.logger.error(
        `Password reset request failed from IP: ${clientIp}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with enhanced security',
    description:
      'Reset password using token from email with password strength validation',
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Reset password data',
  })
  @ApiOkResponse({
    description: 'Password reset successful',
    type: ResetPasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid token or weak password',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Password must be at least 8 characters long',
        },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<ResetPasswordResponseDto> {
    try {
      const clientIp = this.getClientIp(req);
      this.logger.log(`Password reset attempt from IP: ${clientIp}`);

      const result = await this.authService.resetPassword(
        resetPasswordDto,
        clientIp,
      );

      this.logger.log(`Password reset completed from IP: ${clientIp}`);
      return result;
    } catch (error) {
      const clientIp = this.getClientIp(req);
      this.logger.error(
        `Password reset failed from IP: ${clientIp}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change password with enhanced security',
    description:
      'Change user password with current password verification and strength validation',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Change password data',
  })
  @ApiOkResponse({
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid current password or weak new password',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Current password is incorrect' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  async changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    try {
      const clientIp = this.getClientIp(req);
      this.logger.log(
        `Password change attempt for user ${req?.user?.userId} from IP: ${clientIp}`,
      );

      const result = await this.authService.changePassword(
        req?.user?.userId,
        changePasswordDto,
        clientIp,
      );

      this.logger.log(
        `Password changed successfully for user ${req?.user?.userId} from IP: ${clientIp}`,
      );
      return result;
    } catch (error) {
      const clientIp = this.getClientIp(req);
      this.logger.error(
        `Password change failed for user ${req?.user?.userId} from IP: ${clientIp}: ${error.message}`,
      );
      throw error;
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with enhanced security',
    description: 'Verify email address using token with security logging',
  })
  @ApiBody({
    type: VerifyEmailDto,
    description: 'Email verification token',
  })
  @ApiOkResponse({
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Invalid or expired verification token',
        },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Req() req: Request,
  ): Promise<VerifyEmailResponseDto> {
    try {
      const clientIp = this.getClientIp(req);
      this.logger.log(`Email verification attempt from IP: ${clientIp}`);

      const result = await this.authService.verifyEmail(
        verifyEmailDto,
        clientIp,
      );

      this.logger.log(`Email verified successfully from IP: ${clientIp}`);
      return result;
    } catch (error) {
      const clientIp = this.getClientIp(req);
      this.logger.error(
        `Email verification failed from IP: ${clientIp}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile with enhanced security',
    description:
      'Retrieve current user profile information with security logging',
  })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Profile retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid' },
                email: { type: 'string', example: 'user@example.com' },
                firstName: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                role: { type: 'string', example: 'CARGO_OWNER' },
                tenantId: { type: 'string', example: 'tenant-uuid' },
                status: { type: 'string', example: 'ACTIVE' },
                emailVerifiedAt: {
                  type: 'string',
                  example: '2024-01-01T00:00:00.000Z',
                },
              },
            },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Unauthorized' },
        statusCode: { type: 'number', example: 401 },
      },
    },
  })
  async getProfile(@Req() req: Request): Promise<ApiResponseDto> {
    try {
      const clientIp = this.getClientIp(req);
      this.logger.log(
        `Profile request for user ${req?.user?.userId} from IP: ${clientIp}`,
      );

      const user = await this.authService.getProfile(req?.user?.userId);

      this.logger.log(
        `Profile retrieved successfully for user ${req?.user?.userId} from IP: ${clientIp}`,
      );
      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: { user },
        statusCode: 200,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const clientIp = this.getClientIp(req);
      this.logger.error(
        `Profile retrieval failed for user ${req?.user?.userId} from IP: ${clientIp}: ${error.message}`,
      );
      throw error;
    }
  }

  @Get('rate-limit-info')
  @ApiOperation({
    summary: 'Get rate limit information',
    description: 'Get current rate limit status for the requesting IP',
  })
  @ApiOkResponse({
    description: 'Rate limit information retrieved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            count: { type: 'number', example: 2 },
            remainingAttempts: { type: 'number', example: 3 },
            resetTime: { type: 'number', example: 1640995200000 },
            isBlocked: { type: 'boolean', example: false },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  async getRateLimitInfo(@Req() req: Request): Promise<ApiResponseDto> {
    const clientIp = this.getClientIp(req);
    const rateLimitInfo = this.rateLimitGuard.getRateLimitInfo(clientIp);
    const isBlocked = this.rateLimitGuard.isBlocked(clientIp);

    return {
      success: true,
      message: 'Rate limit information retrieved',
      data: {
        ...rateLimitInfo,
        isBlocked,
      },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  private getClientIp(request: Request): string {
    // Check for forwarded headers first (for proxy setups)
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      // Take the first IP in the list (original client IP)
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    // Fallback to connection info - use proper typing
    const remoteAddress =
      (request as any).connection?.remoteAddress ||
      (request as any).socket?.remoteAddress ||
      'unknown';

    // Handle IPv6 addresses
    if (remoteAddress.startsWith('::ffff:')) {
      return remoteAddress.substring(7);
    }

    return remoteAddress;
  }
}
