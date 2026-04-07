import api from './api';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  category: 'user' | 'cargo' | 'payment' | 'system' | 'security' | 'tenant' | 'document';
  description: string;
  status: 'success' | 'warning' | 'error' | 'info';
  ipAddress?: string;
  details?: any;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface ActivityStatsResponse {
  totalActivities: number;
  userActions: number;
  securityEvents: number;
  systemEvents: number;
}

export const activityLogsApi = {
  async getActivityLogs(params?: {
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ActivityLogsResponse> {
    const response = await api.get('/activity-logs', { params });
    return response.data;
  },

  async getActivityStats(): Promise<ActivityStatsResponse> {
    const response = await api.get('/activity-logs/stats');
    return response.data;
  },
};
