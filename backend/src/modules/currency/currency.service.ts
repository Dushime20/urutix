import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ExchangeRate } from '../../entities/exchange-rate.entity';
import { Currency } from '../../entities/currency.entity';
import { BASE_CURRENCY, RateMap } from './constants/currencies';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateCurrencyDto {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimals?: number;
  flag?: string;
  isActive?: boolean;
  manualRate?: number | null;
}

export interface UpdateCurrencyDto {
  name?: string;
  symbol?: string;
  locale?: string;
  decimals?: number;
  flag?: string;
  isActive?: boolean;
  manualRate?: number | null;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  /** In-memory cache: code → rate. Refreshed every hour. */
  private rateCache: RateMap = {};
  private cacheUpdatedAt: Date | null = null;

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepo: Repository<ExchangeRate>,
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
  ) {
    // Seed default currencies on startup, then load rates
    this.seedDefaultCurrencies().then(() => this.loadRatesFromDb());
  }

  // ─── Scheduled refresh every hour ────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledRateRefresh(): Promise<void> {
    this.logger.log('🔄 Scheduled exchange rate refresh started');
    await this.fetchAndStoreRates();
  }

  // ─── Supported Currencies (DB-driven) ────────────────────────────────────

  /** Return all active currencies from the database. */
  async getSupportedCurrencies(): Promise<Currency[]> {
    return this.currencyRepo.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }

  /** Return ALL currencies (active and inactive) — for admin management. */
  async getAllCurrencies(): Promise<Currency[]> {
    return this.currencyRepo.find({ order: { code: 'ASC' } });
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async createCurrency(dto: CreateCurrencyDto): Promise<Currency> {
    const code = dto.code.toUpperCase().trim();
    if (code.length !== 3) {
      throw new BadRequestException('Currency code must be exactly 3 characters');
    }
    const existing = await this.currencyRepo.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Currency '${code}' already exists`);
    }
    const currency = this.currencyRepo.create({
      ...dto,
      code,
      decimals: dto.decimals ?? 2,
      flag: dto.flag ?? '🏳',
      isActive: dto.isActive ?? true,
      manualRate: dto.manualRate ?? null,
    });
    const saved = await this.currencyRepo.save(currency);
    // Immediately try to fetch rate for the new currency
    this.fetchSingleRate(code).catch(() => {});
    return saved;
  }

  async updateCurrency(code: string, dto: UpdateCurrencyDto): Promise<Currency> {
    const upper = code.toUpperCase();
    const currency = await this.currencyRepo.findOne({ where: { code: upper } });
    if (!currency) {
      throw new NotFoundException(`Currency '${upper}' not found`);
    }
    Object.assign(currency, dto);
    const saved = await this.currencyRepo.save(currency);

    // If manual rate changed, update in-memory cache immediately
    if (dto.manualRate !== undefined) {
      if (dto.manualRate !== null) {
        this.rateCache[upper] = Number(dto.manualRate);
      } else {
        // Manual rate cleared — reload from DB rate
        await this.loadRatesFromDb();
      }
    }
    // If re-activated, fetch rate if missing
    if (dto.isActive === true && !this.rateCache[upper]) {
      this.fetchSingleRate(upper).catch(() => {});
    }
    return saved;
  }

  async deleteCurrency(code: string): Promise<{ message: string }> {
    const upper = code.toUpperCase();
    if (upper === BASE_CURRENCY) {
      throw new BadRequestException(`Cannot delete base currency '${BASE_CURRENCY}'`);
    }
    const currency = await this.currencyRepo.findOne({ where: { code: upper } });
    if (!currency) {
      throw new NotFoundException(`Currency '${upper}' not found`);
    }
    await this.currencyRepo.remove(currency);
    delete this.rateCache[upper];
    return { message: `Currency '${upper}' deleted` };
  }

  // ─── Public Rate API ──────────────────────────────────────────────────────

  /**
   * Get the current rate map (base = USD).
   * Manual overrides take precedence over fetched rates.
   */
  async getRates(): Promise<RateMap> {
    if (Object.keys(this.rateCache).length === 0) {
      await this.loadRatesFromDb();
    }
    if (Object.keys(this.rateCache).length === 0) {
      await this.fetchAndStoreRates();
    }
    return { ...this.rateCache, USD: 1 };
  }

  async getRate(targetCurrency: string): Promise<number | null> {
    if (targetCurrency === BASE_CURRENCY) return 1;
    const rates = await this.getRates();
    return rates[targetCurrency] ?? null;
  }

  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    targetCurrency: string;
    exchangeRate: number;
    baseAmountUSD: number;
    convertedAt: Date;
  }> {
    const rates = await this.getRates();
    const fromRate = fromCurrency === BASE_CURRENCY ? 1 : (rates[fromCurrency] ?? 1);
    const toRate   = toCurrency   === BASE_CURRENCY ? 1 : (rates[toCurrency]   ?? 1);
    const baseAmountUSD = amount / fromRate;
    const convertedAmount = baseAmountUSD * toRate;
    const exchangeRate = toRate / fromRate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      targetCurrency: toCurrency,
      exchangeRate,
      baseAmountUSD: Math.round(baseAmountUSD * 100) / 100,
      convertedAt: new Date(),
    };
  }

  async getAllRates(): Promise<{ base: string; rates: RateMap; updatedAt: Date | null }> {
    const rates = await this.getRates();
    return { base: BASE_CURRENCY, rates, updatedAt: this.cacheUpdatedAt };
  }

  async forceRefresh(): Promise<{ message: string; rates: RateMap }> {
    await this.fetchAndStoreRates();
    return { message: 'Exchange rates refreshed', rates: this.rateCache };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Load rates from DB into in-memory cache. Manual overrides win. */
  private async loadRatesFromDb(): Promise<void> {
    try {
      const rates = await this.exchangeRateRepo
        .createQueryBuilder('er')
        .distinctOn(['er.targetCurrency'])
        .where('er.baseCurrency = :base', { base: BASE_CURRENCY })
        .orderBy('er.targetCurrency')
        .addOrderBy('er.fetchedAt', 'DESC')
        .getMany();

      rates.forEach(r => {
        this.rateCache[r.targetCurrency] = Number(r.rate);
      });

      // Apply manual overrides from currencies table
      const currencies = await this.currencyRepo.find();
      currencies.forEach(c => {
        if (c.manualRate !== null && c.manualRate !== undefined) {
          this.rateCache[c.code] = Number(c.manualRate);
        }
      });

      if (rates.length > 0) {
        this.cacheUpdatedAt = rates[0].fetchedAt;
        this.logger.log(`✅ Loaded ${rates.length} exchange rates from DB`);
      } else {
        // DB has no rates yet — apply bootstrap so the API doesn't return empty
        this.applyBootstrapRates();
      }
    } catch (err) {
      this.logger.warn(`Could not load rates from DB: ${err.message}`);
      this.applyBootstrapRates();
    }
  }

  /** Fetch rates for all active DB currencies from external provider. */
  private async fetchAndStoreRates(): Promise<void> {
    try {
      const activeCurrencies = await this.currencyRepo.find({ where: { isActive: true } });
      const targetCodes = activeCurrencies
        .map(c => c.code)
        .filter(code => code !== BASE_CURRENCY);

      if (targetCodes.length === 0) return;

      let fetchedRates: RateMap = {};
      let source = 'unknown';

      // Provider 1: open.er-api.com (free, no key required)
      try {
        const res = await axios.get(
          `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`,
          { timeout: 8000 },
        );
        if (res.data?.result === 'success' && res.data?.rates) {
          fetchedRates = res.data.rates;
          source = 'open.er-api.com';
        }
      } catch { /* try next */ }

      // Provider 2: fawazahmed0 currency API (free, no key required, GitHub CDN)
      if (Object.keys(fetchedRates).length === 0) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const res2 = await axios.get(
            `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${today}/v1/currencies/${BASE_CURRENCY.toLowerCase()}.json`,
            { timeout: 8000 },
          );
          const nested = res2.data?.[BASE_CURRENCY.toLowerCase()];
          if (nested && typeof nested === 'object') {
            // Convert keys to uppercase to match our convention
            Object.entries(nested).forEach(([k, v]) => {
              fetchedRates[k.toUpperCase()] = Number(v);
            });
            source = 'fawazahmed0-cdn';
          }
        } catch { /* try next */ }
      }

      // Provider 3: frankfurter.app (free, ECB rates, no key required)
      if (Object.keys(fetchedRates).length === 0) {
        try {
          const res3 = await axios.get(
            `https://api.frankfurter.app/latest?from=${BASE_CURRENCY}`,
            { timeout: 8000 },
          );
          if (res3.data?.rates) {
            fetchedRates = { ...res3.data.rates };
            source = 'frankfurter.app';
          }
        } catch (err3) {
          this.logger.warn(`All rate providers failed: ${err3.message}. Using cached/bootstrap rates.`);
          // Apply bootstrap rates for currencies missing from cache
          this.applyBootstrapRates();
          return;
        }
      }

      if (Object.keys(fetchedRates).length === 0) {
        this.logger.warn('No rates returned from provider');
        return;
      }

      const entities: Partial<ExchangeRate>[] = targetCodes
        .filter(code => fetchedRates[code] != null)
        .map(code => ({
          baseCurrency: BASE_CURRENCY,
          targetCurrency: code,
          rate: fetchedRates[code],
          source,
        }));

      await this.exchangeRateRepo.save(entities);

      // Update cache — but respect manual overrides
      const currencies = await this.currencyRepo.find();
      const manualOverrides = new Map(
        currencies
          .filter(c => c.manualRate !== null && c.manualRate !== undefined)
          .map(c => [c.code, Number(c.manualRate)]),
      );

      entities.forEach(e => {
        if (!manualOverrides.has(e.targetCurrency!)) {
          this.rateCache[e.targetCurrency!] = Number(e.rate);
        }
      });
      // Apply manual overrides
      manualOverrides.forEach((rate, code) => {
        this.rateCache[code] = rate;
      });

      this.cacheUpdatedAt = new Date();
      this.logger.log(`✅ Fetched & stored ${entities.length} exchange rates from ${source}`);
    } catch (err) {
      this.logger.error(`Failed to fetch exchange rates: ${err.message}`, err.stack);
    }
  }

  /** Fetch rate for a single currency (used after adding a new one). */
  private async fetchSingleRate(code: string): Promise<void> {
    try {
      // Try primary provider first
      const res = await axios.get(
        `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`,
        { timeout: 8000 },
      );
      if (res.data?.result === 'success' && res.data?.rates?.[code]) {
        const rate = res.data.rates[code];
        await this.exchangeRateRepo.save({
          baseCurrency: BASE_CURRENCY,
          targetCurrency: code,
          rate,
          source: 'open.er-api.com',
        });
        this.rateCache[code] = rate;
        this.logger.log(`✅ Fetched rate for new currency ${code}: ${rate}`);
        return;
      }
    } catch { /* fall through */ }

    // Fallback: fawazahmed0 CDN
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res2 = await axios.get(
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${today}/v1/currencies/${BASE_CURRENCY.toLowerCase()}.json`,
        { timeout: 8000 },
      );
      const nested = res2.data?.[BASE_CURRENCY.toLowerCase()];
      const rate = nested?.[code.toLowerCase()];
      if (rate != null) {
        await this.exchangeRateRepo.save({
          baseCurrency: BASE_CURRENCY,
          targetCurrency: code,
          rate,
          source: 'fawazahmed0-cdn',
        });
        this.rateCache[code] = Number(rate);
        this.logger.log(`✅ Fetched rate for ${code} from fawazahmed0: ${rate}`);
      }
    } catch (err) {
      this.logger.warn(`Could not fetch rate for ${code}: ${err.message}`);
    }
  }

  /**
   * Apply approximate bootstrap rates for currencies not yet in cache.
   * Used only as a last resort when all live providers are unreachable.
   * These are approximate mid-market rates vs USD — updated periodically.
   */
  private applyBootstrapRates(): void {
    const bootstrap: RateMap = {
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.50,
      CHF: 0.90,
      AUD: 1.53,
      CAD: 1.36,
      CNY: 7.24,
      RWF: 1469.00,
      KES: 132.00,
      UGX: 3750.00,
      TZS: 2650.00,
      ZAR: 18.60,
      NGN: 1580.00,
      EGP: 48.50,
      INR: 83.20,
      AED: 3.67,
      SAR: 3.75,
    };
    let applied = 0;
    Object.entries(bootstrap).forEach(([code, rate]) => {
      if (!this.rateCache[code]) {
        this.rateCache[code] = rate;
        applied++;
      }
    });
    if (applied > 0) {
      this.logger.warn(`⚠️ Applied ${applied} bootstrap fallback rates (live APIs unreachable)`);
    }
  }

  /**
   * Seed the currencies table from the hardcoded list on first startup.
   * Runs only if the table is empty — safe to run on every boot.
   */
  private async seedDefaultCurrencies(): Promise<void> {
    try {
      const count = await this.currencyRepo.count();
      if (count > 0) return;

      const defaults = [
        { code: 'USD', name: 'US Dollar',          symbol: '$',    locale: 'en-US', decimals: 2, flag: '🇺🇸' },
        { code: 'EUR', name: 'Euro',               symbol: '€',    locale: 'de-DE', decimals: 2, flag: '🇪🇺' },
        { code: 'GBP', name: 'British Pound',      symbol: '£',    locale: 'en-GB', decimals: 2, flag: '🇬🇧' },
        { code: 'JPY', name: 'Japanese Yen',       symbol: '¥',    locale: 'ja-JP', decimals: 0, flag: '🇯🇵' },
        { code: 'CHF', name: 'Swiss Franc',        symbol: 'CHF',  locale: 'de-CH', decimals: 2, flag: '🇨🇭' },
        { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$',   locale: 'en-AU', decimals: 2, flag: '🇦🇺' },
        { code: 'CAD', name: 'Canadian Dollar',    symbol: 'C$',   locale: 'en-CA', decimals: 2, flag: '🇨🇦' },
        { code: 'CNY', name: 'Chinese Yuan',       symbol: '¥',    locale: 'zh-CN', decimals: 2, flag: '🇨🇳' },
        { code: 'RWF', name: 'Rwandan Franc',      symbol: 'FRw',  locale: 'rw-RW', decimals: 0, flag: '🇷🇼' },
        { code: 'KES', name: 'Kenyan Shilling',    symbol: 'KSh',  locale: 'sw-KE', decimals: 0, flag: '🇰🇪' },
        { code: 'UGX', name: 'Ugandan Shilling',   symbol: 'USh',  locale: 'sw-UG', decimals: 0, flag: '🇺🇬' },
        { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh',  locale: 'sw-TZ', decimals: 0, flag: '🇹🇿' },
        { code: 'ZAR', name: 'South African Rand', symbol: 'R',    locale: 'en-ZA', decimals: 2, flag: '🇿🇦' },
        { code: 'NGN', name: 'Nigerian Naira',     symbol: '₦',    locale: 'en-NG', decimals: 2, flag: '🇳🇬' },
        { code: 'EGP', name: 'Egyptian Pound',     symbol: 'E£',   locale: 'ar-EG', decimals: 2, flag: '🇪🇬' },
        { code: 'INR', name: 'Indian Rupee',       symbol: '₹',    locale: 'en-IN', decimals: 2, flag: '🇮🇳' },
        { code: 'AED', name: 'UAE Dirham',         symbol: 'AED',  locale: 'ar-AE', decimals: 2, flag: '🇦🇪' },
        { code: 'SAR', name: 'Saudi Riyal',        symbol: 'SAR',  locale: 'ar-SA', decimals: 2, flag: '🇸🇦' },
      ];

      await this.currencyRepo.save(
        defaults.map(d => this.currencyRepo.create({ ...d, isActive: true, manualRate: null })),
      );
      this.logger.log(`✅ Seeded ${defaults.length} default currencies into DB`);
    } catch (err) {
      this.logger.warn(`Could not seed default currencies: ${err.message}`);
    }
  }
}
