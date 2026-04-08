import api from './api';

export interface FinancialReport {
  id: string;
  type: 'portfolio_summary' | 'pl_statement' | 'cash_flow' | 'balance_sheet';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  data: any;
  generatedBy: string;
  createdAt: string;
  format?: 'pdf' | 'excel' | 'csv';
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'portfolio' | 'financial' | 'risk' | 'performance';
  type: 'summary' | 'detailed' | 'analytical';
  frequency: 'on-demand' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'csv';
  icon?: any;
  estimatedTime?: string;
  dataPoints?: string[];
  isScheduled?: boolean;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  category: string;
  generatedAt: string;
  generatedBy: string;
  format: string;
  size: string;
  status: 'completed' | 'pending' | 'failed';
}

export const financialReportsApi = {
  async getReportTemplates(): Promise<{ templates: ReportTemplate[] }> {
    const response = await api.get('/financial/reports/templates');
    return response.data.data;
  },

  async getFinancialReports(params?: {
    type?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{ reports: FinancialReport[] }> {
    const response = await api.get('/financial/reports', { params });
    return response.data.data;
  },

  async generateFinancialReport(data: {
    type: string;
    period: string;
    startDate: string;
    endDate: string;
  }): Promise<FinancialReport> {
    const response = await api.post('/financial/reports', data);
    return response.data.data.report;
  },

  async downloadReport(reportId: string): Promise<Blob> {
    const response = await api.get(`/financial/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
