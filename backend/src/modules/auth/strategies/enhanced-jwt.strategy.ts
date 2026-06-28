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
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error(
        '[EnhancedJwtStrategy] JWT_SECRET environment variable is not set. ' +
        'Add JWT_SECRET to your .env file and restart the server.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    try {
      if (
        !payload.sub ||
        !payload.email ||
        !payload.role ||
        !payload.tenantId
      ) {
        this.logger.error('Invalid JWT payload structure');
        throw new UnauthorizedException('Invalid token payload');
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new UnauthorizedException('Token has expired');
      }

      const clientIp = this.getClientIp(request);
      const userAgent = request.headers['user-agent'];

      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
        clientIp,
        userAgent,
        tokenIssuedAt: new Date(payload.iat * 1000),
        tokenExpiresAt: new Date(payload.exp * 1000),
        id: payload.sub,
      };
    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
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
