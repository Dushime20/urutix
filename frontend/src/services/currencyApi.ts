import api from './api';

export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
  flag: string;
}

export interface RateMap {
  [code: string]: number;
}

export interface ConvertResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  baseAmountUSD: number;
  convertedAt: string;
}

const currencyApi = {
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
};

export default currencyApi;
