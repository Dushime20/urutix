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
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.email || !payload.role || !payload.tenantId) {
      throw new Error('Invalid JWT payload - missing required fields');
    }

    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
  }
}
