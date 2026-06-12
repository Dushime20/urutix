import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { ExchangeRate } from '../../entities/exchange-rate.entity';
import { SUPPORTED_CURRENCIES, BASE_CURRENCY, RateMap } from './constants/currencies';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  /** In-memory cache: code → rate. Refreshed every hour. */
  private rateCache: RateMap = {};
  private cacheUpdatedAt: Date | null = null;

  constructor(
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepo: Repository<ExchangeRate>,
  ) {
    // Load from DB on startup so rates are available immediately
    this.loadRatesFromDb();
  }

  // ─── Scheduled refresh every hour ────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledRateRefresh(): Promise<void> {
    this.logger.log('🔄 Scheduled exchange rate refresh started');
    await this.fetchAndStoreRates();
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Get the current rate map (base = USD).
   * Returns from in-memory cache; fetches from DB/API if cache is empty.
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

  /**
   * Get the rate for a single currency pair.
   * Returns null if the currency is not supported.
   */
  async getRate(targetCurrency: string): Promise<number | null> {
    if (targetCurrency === BASE_CURRENCY) return 1;
    const rates = await this.getRates();
    return rates[targetCurrency] ?? null;
  }

  /**
   * Convert an amount from one currency to another.
   * All conversions go through USD as the intermediate base.
   */
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

    // Convert to USD first, then to target
    const baseAmountUSD = amount / fromRate;
    const convertedAmount = baseAmountUSD * toRate;
    const exchangeRate = toRate / fromRate; // direct from → to rate

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

  /**
   * Get all rates as an array (for the API response).
   */
  async getAllRates(): Promise<{ base: string; rates: RateMap; updatedAt: Date | null }> {
    const rates = await this.getRates();
    return { base: BASE_CURRENCY, rates, updatedAt: this.cacheUpdatedAt };
  }

  /**
   * Force a refresh of exchange rates from the external provider.
   */
  async forceRefresh(): Promise<{ message: string; rates: RateMap }> {
    await this.fetchAndStoreRates();
    return { message: 'Exchange rates refreshed', rates: this.rateCache };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async loadRatesFromDb(): Promise<void> {
    try {
      // Get the most recent rate per currency
      const rates = await this.exchangeRateRepo
        .createQueryBuilder('er')
        .distinctOn(['er.targetCurrency'])
        .where('er.baseCurrency = :base', { base: BASE_CURRENCY })
        .orderBy('er.targetCurrency')
        .addOrderBy('er.fetchedAt', 'DESC')
        .getMany();

      if (rates.length > 0) {
        rates.forEach(r => {
          this.rateCache[r.targetCurrency] = Number(r.rate);
        });
        this.cacheUpdatedAt = rates[0].fetchedAt;
        this.logger.log(`✅ Loaded ${rates.length} exchange rates from DB`);
      }
    } catch (err) {
      this.logger.warn(`Could not load rates from DB: ${err.message}`);
    }
  }

  private async fetchAndStoreRates(): Promise<void> {
    try {
      // Primary: exchangerate-api.com (free tier, no key required for open endpoint)
      const targetCodes = SUPPORTED_CURRENCIES
        .filter(c => c.code !== BASE_CURRENCY)
        .map(c => c.code);

      let fetchedRates: RateMap = {};
      let source = 'unknown';

      // Try exchangerate-api.com open endpoint (no API key needed)
      try {
        const res = await axios.get(
          `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`,
          { timeout: 8000 },
        );
        if (res.data?.result === 'success' && res.data?.rates) {
          fetchedRates = res.data.rates;
          source = 'open.er-api.com';
        }
      } catch {
        // Fallback: exchangerate.host (free, no key)
        try {
          const res2 = await axios.get(
            `https://api.exchangerate.host/latest?base=${BASE_CURRENCY}&symbols=${targetCodes.join(',')}`,
            { timeout: 8000 },
          );
          if (res2.data?.rates) {
            fetchedRates = res2.data.rates;
            source = 'exchangerate.host';
          }
        } catch (err2) {
          this.logger.warn(`Both rate providers failed: ${err2.message}. Using cached rates.`);
          return;
        }
      }

      if (Object.keys(fetchedRates).length === 0) {
        this.logger.warn('No rates returned from provider');
        return;
      }

      // Persist to DB and update in-memory cache
      const entities: Partial<ExchangeRate>[] = targetCodes
        .filter(code => fetchedRates[code] != null)
        .map(code => ({
          baseCurrency: BASE_CURRENCY,
          targetCurrency: code,
          rate: fetchedRates[code],
          source,
        }));

      await this.exchangeRateRepo.save(entities);

      // Update in-memory cache
      entities.forEach(e => {
        this.rateCache[e.targetCurrency!] = Number(e.rate);
      });
      this.cacheUpdatedAt = new Date();

      this.logger.log(`✅ Fetched & stored ${entities.length} exchange rates from ${source}`);
    } catch (err) {
      this.logger.error(`Failed to fetch exchange rates: ${err.message}`, err.stack);
    }
  }
}
