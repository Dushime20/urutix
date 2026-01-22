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
}

export interface CreateFuelLogData {
    truckId: string;
    driverId?: string;
    fuelDate: string;
    gallons: number;
    pricePerGallon: number;
    location: string;
    odometer?: number;
    receiptNumber?: string;
    paymentMethod?: string;
    notes?: string;
}

export const fuelApi = {
    /**
     * Create a new fuel log
     */
    createFuelLog: async (data: CreateFuelLogData): Promise<FuelLog> => {
        try {
            const response = await api.post('/fuel/logs', data);
            return response.data.data;
        } catch (error) {
            console.error('Error creating fuel log:', error);
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
};
