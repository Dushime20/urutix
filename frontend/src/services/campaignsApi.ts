import api from './api';

export interface CampaignCity {
  id?: string;
  name: string;
  country?: string;
  countryCode?: string;
  region?: string;
  lat: number;
  lng: number;
}

export interface CampaignPromptPayload {
  prompt: string;
  originText?: string;
  budgetCap?: number;
  goodsReady?: boolean;
  destinationCityIds?: string[];
  destinations?: CampaignCity[];
  preferSharedTrucks?: boolean;
  requireInsurance?: boolean;
  fundOnEscrow?: boolean;
}

const unwrap = <T>(payload: any): T => {
  if (Array.isArray(payload)) return payload as T;
  if (payload?.data && (payload.data.id || Array.isArray(payload.data))) {
    return payload.data as T;
  }
  return payload as T;
};

export const campaignsApi = {
  searchCities: (q: string) =>
    api.get('/campaigns/cities', { params: { q } }).then((r) => {
      const data = unwrap<any[]>(r.data);
      return Array.isArray(data) ? data : [];
    }),
  list: () =>
    api.get('/campaigns').then((r) => {
      const data = unwrap<any[]>(r.data);
      return Array.isArray(data) ? data : [];
    }),
  get: (id: string) => api.get(`/campaigns/${id}`).then((r) => unwrap(r.data)),
  suggest: (payload: CampaignPromptPayload) =>
    api.post('/campaigns/suggest', payload).then((r) => unwrap<{ origin?: any; suggestions: any[] }>(r.data)),
  create: (payload: CampaignPromptPayload) =>
    api.post('/campaigns', payload).then((r) => unwrap(r.data)),
  update: (id: string, payload: CampaignPromptPayload) =>
    api.put(`/campaigns/${id}`, payload).then((r) => unwrap(r.data)),
  approve: (id: string, payload: CampaignPromptPayload) =>
    api.post(`/campaigns/${id}/approve`, payload).then((r) => unwrap(r.data)),
  repeat: (id: string) => api.post(`/campaigns/${id}/repeat`).then((r) => unwrap(r.data)),
};
