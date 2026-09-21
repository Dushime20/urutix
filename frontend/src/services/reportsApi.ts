import api from './api';

export interface RoleReportResult {
  title: string;
  category: string;
  headers: string[];
  rows: Record<string, string | number>[];
  total: number;
}

export const reportsApi = {
  getMyReport: async (params: {
    category: string;
    status?: string;
    priority?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<RoleReportResult> => {
    const response = await api.get('/reports', { params });
    return response.data.data;
  },
};
