import api from './api';
import type { CurrencyMeta, RateMap } from '../contexts/CurrencyContext';

export interface ConvertResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  baseAmountUSD: number;
  convertedAt: string;
}

export interface AdminCurrency extends CurrencyMeta {
  isActive: boolean;
  manualRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCurrencyPayload {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
  flag: string;
  isActive?: boolean;
  manualRate?: number | null;
}

export interface UpdateCurrencyPayload {
  name?: string;
  symbol?: string;
  locale?: string;
  decimals?: number;
  flag?: string;
  isActive?: boolean;
  manualRate?: number | null;
}

const currencyApi = {
  // ─── Public ──────────────────────────────────────────────────────────────

  getSupportedCurrencies: async (): Promise<CurrencyMeta[]> => {
    const res = await api.get('/currency/supported');
    return res.data.currencies;
  },

  getRates: async (): Promise<{ base: string; rates: RateMap; updatedAt: string | null }> => {
    const res = await api.get('/currency/rates');
    return res.data;
  },

  convert: async (amount: number, from: string, to: string): Promise<ConvertResult> => {
    const res = await api.get('/currency/convert', { params: { amount, from, to } });
    return res.data;
  },

  getPreference: async (): Promise<string> => {
    const res = await api.get('/currency/preference');
    return res.data.preferredCurrency ?? 'USD';
  },

  setPreference: async (code: string): Promise<void> => {
    await api.patch('/currency/preference', { preferredCurrency: code });
  },

  forceRefresh: async (): Promise<void> => {
    await api.post('/currency/refresh');
  },

  // ─── Super-admin CRUD ─────────────────────────────────────────────────────

  /** Get ALL currencies (active + inactive) — super admin only */
  adminGetAll: async (): Promise<AdminCurrency[]> => {
    const res = await api.get('/currency/admin/all');
    return res.data.currencies;
  },

  adminCreate: async (payload: CreateCurrencyPayload): Promise<AdminCurrency> => {
    const res = await api.post('/currency', payload);
    return res.data.currency;
  },

  adminUpdate: async (code: string, payload: UpdateCurrencyPayload): Promise<AdminCurrency> => {
    const res = await api.patch(`/currency/${code}`, payload);
    return res.data.currency;
  },

  adminDelete: async (code: string): Promise<void> => {
    await api.delete(`/currency/${code}`);
  },
};

export default currencyApi;
