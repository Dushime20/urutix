import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrencyService } from './currency.service';
import { SUPPORTED_CURRENCIES, RateMap } from './constants/currencies';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../../entities/user-profile.entity';

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(
    private readonly currencyService: CurrencyService,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
  ) {}

  /** Get all supported currencies with metadata */
  @Get('supported')
  @ApiOperation({ summary: 'Get list of all supported currencies' })
  getSupportedCurrencies() {
    return { currencies: SUPPORTED_CURRENCIES };
  }

  /** Get current exchange rates (base = USD) */
  @Get('rates')
  @ApiOperation({ summary: 'Get current exchange rates (base = USD)' })
  async getRates() {
    return this.currencyService.getAllRates();
  }

  /** Convert an amount between two currencies */
  @Get('convert')
  @ApiOperation({ summary: 'Convert amount between currencies' })
  @ApiQuery({ name: 'amount', type: Number })
  @ApiQuery({ name: 'from', type: String })
  @ApiQuery({ name: 'to', type: String })
  async convert(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.currencyService.convert(Number(amount), from?.toUpperCase(), to?.toUpperCase());
  }

  /** Force refresh rates from external provider (admin only) */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Force refresh exchange rates from external provider' })
  async forceRefresh() {
    return this.currencyService.forceRefresh();
  }

  /** Get authenticated user's preferred currency */
  @Get('preference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user's preferred currency" })
  async getPreference(@Request() req) {
    const profile = await this.profileRepo.findOne({ where: { userId: req.user.id } });
    const currency = profile?.preferences?.preferredCurrency ?? 'USD';
    return { preferredCurrency: currency };
  }

  /** Set authenticated user's preferred currency */
  @Patch('preference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Set the authenticated user's preferred currency" })
  async setPreference(
    @Request() req,
    @Body() body: { preferredCurrency: string },
  ) {
    const code = body.preferredCurrency?.toUpperCase();
    const supported = SUPPORTED_CURRENCIES.find(c => c.code === code);
    if (!supported) {
      return { error: `Currency '${code}' is not supported` };
    }

    const profile = await this.profileRepo.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      return { error: 'User profile not found' };
    }

    profile.preferences = { ...(profile.preferences ?? {}), preferredCurrency: code };
    await this.profileRepo.save(profile);

    return { message: 'Preferred currency updated', preferredCurrency: code };
  }
}
