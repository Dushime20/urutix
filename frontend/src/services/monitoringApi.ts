import api from './api';

export interface SystemHealth {
    status: string;
    timestamp: string;
    uptime: {
        seconds: number;
        formatted: string;
    };
    services: {
        database: {
            status: string;
            responseTime: string;
        };
        api: {
            status: string;
            uptime: number;
        };
    };
    resources: {
        memory: {
            process: {
                rss: number;
                heapTotal: number;
                heapUsed: number;
                external: number;
            };
            system: {
                total: number;
                free: number;
                used: number;
                usagePercent: number;
            };
        };
        cpu: {
            cores: number;
            model: string;
            loadAverage: number[];
        };
    };
    platform: {
        os: string;
        arch: string;
        nodeVersion: string;
        hostname: string;
    };
}

export interface AuditLog {
    id: string;
    user_id: string;
    user_email: string;
    admin_id: string;
    admin_email: string;
    permission: string;
    action: string;
    reason: string;
    metadata: any;
    created_at: string;
}

export interface UserActivity {
    timestamp: string;
    activeUsers: {
        last24h: number;
        last7d: number;
        last30d: number;
    };
    usersByStatus: Array<{ status: string; count: number }>;
    usersByRole: Array<{ role: string; count: number }>;
    newUsers: {
        last30d: number;
    };
}

export interface PerformanceMetrics {
    timestamp: string;
    memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
    };
    uptime: number;
    requests: {
        total: number;
        perSecond: number;
        avgResponseTime: number;
    };
    errors: {
        total: number;
        rate: number;
    };
}

export interface DatabaseStats {
    timestamp: string;
    database: {
        size: string;
    };
    connections: {
        total: string;
        active: string;
        idle: string;
    };
    tables: Array<{
        schema: string;
        table: string;
        size: string;
        size_bytes: string;
    }>;
}

export const monitoringApi = {
    getSystemHealth: async (): Promise<SystemHealth> => {
        const response = await api.get('/admin/monitoring/health');
        return response.data;
    },

    getPerformanceMetrics: async (): Promise<PerformanceMetrics> => {
        const response = await api.get('/admin/monitoring/metrics');
        return response.data;
    },

    getAuditLogs: async (params?: {
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const response = await api.get('/admin/monitoring/audit-logs', { params });
        return response.data;
    },

    getUserActivity: async (): Promise<UserActivity> => {
        const response = await api.get('/admin/monitoring/user-activity');
        return response.data;
    },

    getDatabaseStats: async (): Promise<DatabaseStats> => {
        const response = await api.get('/admin/monitoring/database-stats');
        return response.data;
    }
};
