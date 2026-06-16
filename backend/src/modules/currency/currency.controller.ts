import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrencyService, CreateCurrencyDto, UpdateCurrencyDto } from './currency.service';
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

  // ─── Public endpoints ─────────────────────────────────────────────────────

  /** Get all active supported currencies from DB */
  @Get('supported')
  @ApiOperation({ summary: 'Get list of all active supported currencies' })
  async getSupportedCurrencies() {
    try {
      const currencies = await this.currencyService.getSupportedCurrencies();
      return { currencies };
    } catch (err) {
      // DB not ready yet (table not migrated, connection issue, etc.)
      // Return the bootstrap list so the frontend can still function.
      return {
        currencies: [
          { code: 'USD', name: 'US Dollar',          symbol: '$',    locale: 'en-US', decimals: 2, flag: '🇺🇸', isActive: true },
          { code: 'EUR', name: 'Euro',               symbol: '€',    locale: 'de-DE', decimals: 2, flag: '🇪🇺', isActive: true },
          { code: 'GBP', name: 'British Pound',      symbol: '£',    locale: 'en-GB', decimals: 2, flag: '🇬🇧', isActive: true },
          { code: 'RWF', name: 'Rwandan Franc',      symbol: 'FRw',  locale: 'rw-RW', decimals: 0, flag: '🇷🇼', isActive: true },
          { code: 'KES', name: 'Kenyan Shilling',    symbol: 'KSh',  locale: 'sw-KE', decimals: 0, flag: '🇰🇪', isActive: true },
          { code: 'UGX', name: 'Ugandan Shilling',   symbol: 'USh',  locale: 'sw-UG', decimals: 0, flag: '🇺🇬', isActive: true },
          { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh',  locale: 'sw-TZ', decimals: 0, flag: '🇹🇿', isActive: true },
          { code: 'ZAR', name: 'South African Rand', symbol: 'R',    locale: 'en-ZA', decimals: 2, flag: '🇿🇦', isActive: true },
          { code: 'NGN', name: 'Nigerian Naira',     symbol: '₦',    locale: 'en-NG', decimals: 2, flag: '🇳🇬', isActive: true },
        ],
      };
    }
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

  // ─── Authenticated user preference ───────────────────────────────────────

  @Get('preference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated user's preferred currency" })
  async getPreference(@Request() req) {
    const profile = await this.profileRepo.findOne({ where: { userId: req.user.id } });
    const currency = profile?.preferences?.preferredCurrency ?? 'USD';
    return { preferredCurrency: currency };
  }

  @Patch('preference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Set the authenticated user's preferred currency" })
  async setPreference(
    @Request() req,
    @Body() body: { preferredCurrency: string },
  ) {
    const code = body.preferredCurrency?.toUpperCase();
    const supported = await this.currencyService.getSupportedCurrencies();
    if (!supported.find(c => c.code === code)) {
      return { error: `Currency '${code}' is not supported` };
    }
    const profile = await this.profileRepo.findOne({ where: { userId: req.user.id } });
    if (!profile) return { error: 'User profile not found' };
    profile.preferences = { ...(profile.preferences ?? {}), preferredCurrency: code };
    await this.profileRepo.save(profile);
    return { message: 'Preferred currency updated', preferredCurrency: code };
  }

  // ─── Admin-only: force refresh ────────────────────────────────────────────

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Force refresh exchange rates from external provider' })
  async forceRefresh() {
    return this.currencyService.forceRefresh();
  }

  // ─── Super-admin CRUD ─────────────────────────────────────────────────────

  /** Get ALL currencies (active + inactive) — super admin only */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Get all currencies including inactive' })
  async getAllCurrencies(@Request() req) {
    this.assertAdmin(req.user);
    const currencies = await this.currencyService.getAllCurrencies();
    return { currencies };
  }

  /** Create a new currency */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a new supported currency' })
  async createCurrency(@Request() req, @Body() dto: CreateCurrencyDto) {
    this.assertAdmin(req.user);
    const currency = await this.currencyService.createCurrency(dto);
    return { message: `Currency '${currency.code}' created`, currency };
  }

  /** Update an existing currency */
  @Patch(':code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update a currency (name, symbol, active status, manual rate, etc.)' })
  async updateCurrency(
    @Request() req,
    @Param('code') code: string,
    @Body() dto: UpdateCurrencyDto,
  ) {
    this.assertAdmin(req.user);
    const currency = await this.currencyService.updateCurrency(code, dto);
    return { message: `Currency '${currency.code}' updated`, currency };
  }

  /** Delete a currency */
  @Delete(':code')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Delete a currency (cannot delete USD base currency)' })
  async deleteCurrency(@Request() req, @Param('code') code: string) {
    this.assertAdmin(req.user);
    return this.currencyService.deleteCurrency(code);
  }

  // ─── Helper ──────────────────────────────────────────────────────────────

  private assertAdmin(user: any): void {
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user?.role)) {
      throw new Error('Forbidden: admin access required');
    }
  }
}
