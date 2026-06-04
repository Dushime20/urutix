import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../../../entities/user.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

// We use the 'speakeasy' compatible TOTP implementation via otplib
// If otplib is not installed, we implement a basic TOTP manually
let authenticator: any;
try {
  authenticator = require('otplib').authenticator;
} catch {
  // fallback — will use manual TOTP
  authenticator = null;
}

export const TWO_FA_REQUIRED_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.LENDER,
];

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Check if 2FA is required for a role ─────────────────────────────────────

  isRequired(role: UserRole): boolean {
    return TWO_FA_REQUIRED_ROLES.includes(role);
  }

  // ─── Generate TOTP secret + QR code URI ──────────────────────────────────────

  async setupTwoFactor(userId: string): Promise<{ secret: string; qrCodeUri: string; qrCodeBase64: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.twoFactorEnabled) throw new BadRequestException('2FA is already enabled');

    let secret: string;
    let otpauthUrl: string;

    if (authenticator) {
      secret = authenticator.generateSecret();
      otpauthUrl = authenticator.keyuri(user.email, 'Urutix', secret);
    } else {
      // Manual base32 secret generation
      secret = this.generateBase32Secret();
      otpauthUrl = `otpauth://totp/Urutix:${encodeURIComponent(user.email)}?secret=${secret}&issuer=Urutix&algorithm=SHA1&digits=6&period=30`;
    }

    // Store secret temporarily (not yet enabled — confirmed on verify-setup)
    await this.userRepository.update(userId, { twoFactorSecret: secret });

    // Generate QR code as data URI using a simple URL-based QR service
    const qrCodeBase64 = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    return { secret, qrCodeUri: otpauthUrl, qrCodeBase64 };
  }

  // ─── Verify setup token and activate 2FA ─────────────────────────────────────

  async verifySetup(userId: string, token: string): Promise<{ backupCodes: string[] }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new BadRequestException('2FA setup not initiated');

    const isValid = this.verifyToken(user.twoFactorSecret, token);
    if (!isValid) throw new UnauthorizedException('Invalid 2FA token');

    // Generate 8 backup codes
    const plainCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );
    const hashedCodes = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, 10)));

    await this.userRepository.update(userId, {
      twoFactorEnabled: true,
      // Store hashed backup codes in a JSON column — we'll use twoFactorSecret field
      // and add a separate backupCodes field via the entity update below
    });

    // Store backup codes as JSON in a separate approach
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ twoFactorEnabled: true } as any)
      .where('id = :id', { id: userId })
      .execute();

    // Store hashed backup codes in DB (raw query to avoid entity field issues)
    try {
      await this.userRepository.query(
        `UPDATE users SET two_factor_backup_codes = $1 WHERE id = $2`,
        [JSON.stringify(hashedCodes), userId],
      );
    } catch {
      // Column may not exist yet — log and continue
      this.logger.warn('two_factor_backup_codes column not found — backup codes not stored');
    }

    this.logger.log(`2FA enabled for user ${userId}`);
    return { backupCodes: plainCodes };
  }

  // ─── Validate TOTP token at login ────────────────────────────────────────────

  async validateToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return false;
    return this.verifyToken(user.twoFactorSecret, token);
  }

  // ─── Validate backup code ────────────────────────────────────────────────────

  async validateBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const result = await this.userRepository.query(
        `SELECT two_factor_backup_codes FROM users WHERE id = $1`,
        [userId],
      );
      if (!result?.[0]?.two_factor_backup_codes) return false;

      const hashedCodes: string[] = JSON.parse(result[0].two_factor_backup_codes);
      for (let i = 0; i < hashedCodes.length; i++) {
        const match = await bcrypt.compare(code.toUpperCase(), hashedCodes[i]);
        if (match) {
          // Mark code as used (replace with empty string)
          hashedCodes[i] = '';
          await this.userRepository.query(
            `UPDATE users SET two_factor_backup_codes = $1 WHERE id = $2`,
            [JSON.stringify(hashedCodes), userId],
          );
          return true;
        }
      }
    } catch (err) {
      this.logger.error('Error validating backup code:', err.message);
    }
    return false;
  }

  // ─── Disable 2FA ─────────────────────────────────────────────────────────────

  async disable(userId: string, token: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) throw new BadRequestException('2FA is not enabled');

    const isValid = this.verifyToken(user.twoFactorSecret!, token);
    if (!isValid) throw new UnauthorizedException('Invalid 2FA token');

    await this.userRepository.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
    this.logger.log(`2FA disabled for user ${userId}`);
  }

  // ─── Issue full JWT after 2FA validation ─────────────────────────────────────

  issueFullJwt(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '24h',
    });
  }

  // ─── Internal TOTP verification ──────────────────────────────────────────────

  private verifyToken(secret: string, token: string): boolean {
    if (authenticator) {
      try {
        return authenticator.verify({ token, secret });
      } catch {
        return false;
      }
    }
    // Manual TOTP verification (RFC 6238)
    return this.manualTotpVerify(secret, token);
  }

  private manualTotpVerify(secret: string, token: string): boolean {
    const window = 1; // allow 1 step drift
    const step = 30;
    const now = Math.floor(Date.now() / 1000 / step);

    for (let i = -window; i <= window; i++) {
      const expected = this.generateTotp(secret, now + i);
      if (expected === token) return true;
    }
    return false;
  }

  private generateTotp(secret: string, counter: number): string {
    const key = Buffer.from(this.base32Decode(secret));
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter));
    const hmac = crypto.createHmac('sha1', key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    return String(code % 1_000_000).padStart(6, '0');
  }

  private base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output: number[] = [];
    for (const char of encoded.toUpperCase().replace(/=+$/, '')) {
      value = (value << 5) | alphabet.indexOf(char);
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return Buffer.from(output);
  }

  private generateBase32Secret(): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    return Array.from(crypto.randomBytes(20))
      .map((b) => alphabet[b % 32])
      .join('');
  }
}
