import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('🔐 JWT Strategy Debug Info:');
    console.log('JWT Payload:', payload);

    if (!payload.sub || !payload.email || !payload.role || !payload.tenantId) {
      console.error('❌ JWT payload missing required fields:', {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
      });
      throw new Error('Invalid JWT payload - missing required fields');
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };

    console.log('✅ Extracted user info:', user);
    return user;
  }
}
