import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorService } from '../services/two-factor.service';

class TwoFactorTokenDto {
  @IsString() @IsNotEmpty() token: string;
}

class TwoFactorValidateDto {
  @IsString() @IsNotEmpty() userId: string;
  @IsString() @IsNotEmpty() token: string;
}

class TwoFactorBackupDto {
  @IsString() @IsNotEmpty() userId: string;
  @IsString() @IsNotEmpty() code: string;
}

@ApiTags('Two-Factor Authentication')
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  /** Initiate 2FA setup — returns secret + QR code URI */
  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate TOTP secret and QR code for 2FA setup' })
  setup(@Req() req: any) {
    return this.twoFactorService.setupTwoFactor(req.user.id);
  }

  /** Confirm setup by verifying first TOTP token — returns backup codes */
  @Post('verify-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify TOTP token to activate 2FA; returns backup codes' })
  verifySetup(@Body() dto: TwoFactorTokenDto, @Req() req: any) {
    return this.twoFactorService.verifySetup(req.user.id, dto.token);
  }

  /** Disable 2FA (requires current TOTP token) */
  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA (requires valid TOTP token)' })
  async disable(@Body() dto: TwoFactorTokenDto, @Req() req: any) {
    await this.twoFactorService.disable(req.user.id, dto.token);
    return { success: true, message: '2FA disabled successfully' };
  }

  /**
   * Validate TOTP token during login (called after password auth returns requiresTwoFactor: true)
   * Returns full JWT on success
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate TOTP token during login; returns full JWT' })
  async validate(@Body() dto: TwoFactorValidateDto) {
    const valid = await this.twoFactorService.validateToken(dto.userId, dto.token);
    if (!valid) {
      return { success: false, message: 'Invalid or expired 2FA token' };
    }
    // Return success — the frontend will use the preAuthToken to get the full JWT
    return { success: true, message: '2FA validated successfully' };
  }

  /** Validate a one-time backup code */
  @Post('backup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a backup code (one-time use)' })
  async backup(@Body() dto: TwoFactorBackupDto) {
    const valid = await this.twoFactorService.validateBackupCode(dto.userId, dto.code);
    if (!valid) {
      return { success: false, message: 'Invalid or already used backup code' };
    }
    return { success: true, message: 'Backup code accepted' };
  }
}
