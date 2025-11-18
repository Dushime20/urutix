import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  iat: number;
  exp: number;
}

@Injectable()
export class EnhancedJwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(EnhancedJwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      passReqToCallback: true, // Allow access to request object
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    try {
      this.logger.debug('🔐 JWT Strategy Validation Started');
      this.logger.debug('JWT Payload:', {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
        iat: new Date(payload.iat * 1000).toISOString(),
        exp: new Date(payload.exp * 1000).toISOString(),
      });

      // Validate payload structure
      if (
        !payload.sub ||
        !payload.email ||
        !payload.role ||
        !payload.tenantId
      ) {
        this.logger.error('Invalid JWT payload structure');
        throw new UnauthorizedException('Invalid token payload');
      }

      // Validate token expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        this.logger.warn('JWT token has expired');
        throw new UnauthorizedException('Token has expired');
      }

      // Note: Removed token issuance time validation to prevent clock skew issues

      // Extract client information for security logging
      const clientIp = this.getClientIp(request);
      const userAgent = request.headers['user-agent'];

      this.logger.debug(
        `Token validation for user: ${payload.email} from IP: ${clientIp}`,
      );

      // Create user object with additional security context
      const user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
        clientIp,
        userAgent,
        tokenIssuedAt: new Date(payload.iat * 1000),
        tokenExpiresAt: new Date(payload.exp * 1000),
      };

      this.logger.debug('✅ JWT Strategy Validation Successful');
      this.logger.debug('Extracted user info:', {
        userId: user.userId,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        clientIp: user.clientIp,
      });

      return user;
    } catch (error) {
      this.logger.error(`JWT Strategy Validation Failed: ${error.message}`);
      throw error;
    }
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

    // Fallback to connection info
    const remoteAddress =
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown';

    // Handle IPv6 addresses
    if (remoteAddress.startsWith('::ffff:')) {
      return remoteAddress.substring(7);
    }

    return remoteAddress;
  }
}
