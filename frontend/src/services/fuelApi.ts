import api from './api';

export interface FuelLog {
    id: string;
    truckId: string;
    driverId?: string;
    fuelDate: string;
    gallons: number;
    pricePerGallon: number;
    totalCost: number;
    location: string;
    odometer?: number;
    status: 'VERIFIED' | 'PENDING' | 'FLAGGED' | 'REJECTED';
    receiptNumber?: string;
    paymentMethod?: string;
    notes?: string;
    isFlagged: boolean;
    flagReason?: string;
    createdAt: string;
    updatedAt: string;
    truck?: {
        id: string;
        plateNumber: string;
    };
    driver?: {
        id: string;
        firstName: string;
        lastName: string;
    };
}

export interface FuelStatistics {
    totalSpend: number;
    totalVolume: number;
    avgPricePerGallon: number;
    fleetEfficiency: number;
    fraudAlerts: number;
    totalLogs: number;
    dailyTrend?: Array<{ name: string; cost: number }>;
    truckEfficiency?: Array<{ plate: string; mpg: number }>;
}

export interface CreateFuelLogData {
    truckId: string;
    driverId?: string;
    tripId?: string;
    fuelDate: string;
    gallons: number;
    pricePerGallon: number;
    location: string;
    odometer?: number;
    receiptNumber?: string;
    paymentMethod?: string;
    notes?: string;
    receiptFile?: File;
    odometerVerificationFile?: File;
}

export const fuelApi = {
    /**
     * Create a new fuel log
     */
    createFuelLog: async (data: CreateFuelLogData): Promise<FuelLog> => {
        try {
            const formData = new FormData();
            
            // Append all non-file fields
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'receiptFile' && key !== 'odometerVerificationFile' && value !== undefined && value !== null) {
                    formData.append(key, value.toString());
                }
            });

            // Append files if they exist
            if (data.receiptFile) {
                formData.append('receiptFile', data.receiptFile);
            }
            if (data.odometerVerificationFile) {
                formData.append('odometerVerificationFile', data.odometerVerificationFile);
            }

            const response = await api.post('/fuel/logs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('📦 createFuelLog response:', JSON.stringify(response.data));
            if (response.data.success === false) {
                throw new Error(response.data.message || 'Failed to create fuel log');
            }
            return response.data.data;
        } catch (error: any) {
            console.error('Error creating fuel log:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get all fuel logs with optional filters
     */
    getFuelLogs: async (params?: {
        truckId?: string;
        driverId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<FuelLog[]> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.truckId) queryParams.append('truckId', params.truckId);
            if (params?.driverId) queryParams.append('driverId', params.driverId);
            if (params?.status) queryParams.append('status', params.status);
            if (params?.startDate) queryParams.append('startDate', params.startDate);
            if (params?.endDate) queryParams.append('endDate', params.endDate);

            const url = `/fuel/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            const response = await api.get(url);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching fuel logs:', error);
            throw error;
        }
    },

    /**
     * Get fuel log by ID
     */
    getFuelLogById: async (id: string): Promise<FuelLog> => {
        try {
            const response = await api.get(`/fuel/logs/${id}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching fuel log:', error);
            throw error;
        }
    },

    /**
     * Update fuel log
     */
    updateFuelLog: async (
        id: string,
        data: {
            status?: 'VERIFIED' | 'PENDING' | 'FLAGGED' | 'REJECTED';
            flagReason?: string;
            notes?: string;
        }
    ): Promise<FuelLog> => {
        try {
            const response = await api.put(`/fuel/logs/${id}`, data);
            return response.data.data;
        } catch (error) {
            console.error('Error updating fuel log:', error);
            throw error;
        }
    },

    /**
     * Delete fuel log
     */
    deleteFuelLog: async (id: string): Promise<void> => {
        try {
            await api.delete(`/fuel/logs/${id}`);
        } catch (error) {
            console.error('Error deleting fuel log:', error);
            throw error;
        }
    },

    /**
     * Get fuel statistics
     */
    getFuelStatistics: async (): Promise<FuelStatistics> => {
        try {
            const response = await api.get('/fuel/statistics');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching fuel statistics:', error);
            throw error;
        }
    },

    /**
     * Get fuel statistics for a specific driver
     */
    getDriverFuelStatistics: async (driverId: string): Promise<any> => {
        try {
            const response = await api.get(`/fuel/statistics/${driverId}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching driver fuel statistics:', error);
            throw error;
        }
    },

    // ===== WALLET =====

    getWallet: async (id: string) => {
        const response = await api.get(`/fuel/wallets/${id}`);
        return response.data.data;
    },

    getMyWallet: async () => {
        const response = await api.get('/fuel/wallets/my-wallet');
        console.log('📦 getMyWallet full response:', JSON.stringify(response.data));
        if (response.data.success === false) {
            throw new Error(response.data.message || 'Failed to get wallet');
        }
        return response.data.data;
    },

    getDriverWallet: async (driverId: string) => {
        const response = await api.get(`/fuel/wallets/driver/${driverId}`);
        return response.data.data;
    },

    addWalletCredit: async (id: string, amount: number, description: string, metadata?: any) => {
        const response = await api.post(`/fuel/wallets/${id}/credit`, {
            amount,
            description,
            metadata
        });
        console.log('📦 addWalletCredit response:', JSON.stringify(response.data));
        if (response.data.success === false) {
            throw new Error(response.data.message || 'Failed to add credit');
        }
        return response.data.data;
    },

    getWalletTransactions: async (id: string, limit?: number, offset?: number) => {
        const queryParams = new URLSearchParams();
        if (limit) queryParams.append('limit', limit.toString());
        if (offset) queryParams.append('offset', offset.toString());

        const url = `/fuel/wallets/${id}/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(url);
        return { transactions: response.data.data, total: response.data.total };
    },

    getWalletStats: async () => {
        const response = await api.get('/fuel/wallets/stats/overview');
        return response.data.data;
    },

    // ===== BUDGET =====

    createBudget: async (tripId: string, truckId: string, budgetedAmount: number, alertThreshold?: number) => {
        const response = await api.post('/fuel/budgets', { tripId, truckId, budgetedAmount, alertThreshold });
        return response.data.data;
    },

    getBudget: async (id: string) => {
        const response = await api.get(`/fuel/budgets/${id}`);
        return response.data.data;
    },

    recordFuelExpense: async (id: string, fuelCost: number) => {
        const response = await api.post(`/fuel/budgets/${id}/record-expense`, { fuelCost });
        return response.data.data;
    },

    getBudgetAnalysis: async (tripId: string) => {
        const response = await api.get(`/fuel/budgets/analysis/${tripId}`);
        return response.data.data;
    },

    getOverBudgetTrips: async () => {
        const response = await api.get('/fuel/budgets/status/over-budget');
        return response.data.data;
    },

    // ===== ADVANCES =====

    requestAdvance: async (tripId: string, advanceAmount: number, notes?: string) => {
        const response = await api.post('/fuel/advances/request', { tripId, advanceAmount, notes });
        return response.data.data;
    },

    getAdvance: async (id: string) => {
        const response = await api.get(`/fuel/advances/${id}`);
        return response.data.data;
    },

    getDriverAdvances: async (driverId: string, status?: string) => {
        const url = `/fuel/advances/driver/${driverId}${status ? `?status=${status}` : ''}`;
        const response = await api.get(url);
        return response.data.data;
    },

    approveAdvance: async (id: string) => {
        const response = await api.put(`/fuel/advances/${id}/approve`);
        return response.data.data;
    },

    rejectAdvance: async (id: string, rejectionReason: string) => {
        const response = await api.put(`/fuel/advances/${id}/reject`, { rejectionReason });
        return response.data.data;
    },

    reconcileAdvance: async (id: string, reconciliationAmount: number, reconciliationNotes?: string) => {
        const response = await api.put(`/fuel/advances/${id}/reconcile`, { reconciliationAmount, reconciliationNotes });
        return response.data.data;
    },

    getPendingAdvances: async () => {
        const response = await api.get('/fuel/advances/pending/all');
        return response.data.data;
    },

    getPendingAdvancesForMyDrivers: async () => {
        const response = await api.get('/fuel/advances/pending/my-drivers');
        return response.data.data;
    },

    getAllAdvancesForMyDrivers: async () => {
        const response = await api.get('/fuel/advances/my-drivers/all');
        return response.data.data;
    },

    getAdvanceStats: async () => {
        const response = await api.get('/fuel/advances/stats/overview');
        return response.data.data;
    },

    getDriverAdvanceBalance: async (driverId: string) => {
        const response = await api.get(`/fuel/advances/driver/${driverId}/balance`);
        return response.data.data.balance;
    },
};
