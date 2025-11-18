import axios from 'axios';

export async function getMarketRates() {
  const res = await axios.get('/api/pricing/market-rates');
  return res.data;
}

export async function getCompetitorRates() {
  const res = await axios.get('/api/pricing/competitor-rates');
  return res.data;
}

export async function getHistoricalRates() {
  const res = await axios.get('/api/pricing/historical-rates');
  return res.data;
}

export async function estimatePrice(payload: any) {
  const res = await axios.post('/api/pricing/estimate', payload);
  return res.data;
}
