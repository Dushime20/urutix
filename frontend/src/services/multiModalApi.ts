import api from './api';

export interface MultiModalLeg {
  id: string;
  shipmentId: string;
  mode: 'TRUCK' | 'RAIL' | 'SEA' | 'AIR';
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DELAYED';
  carrierName?: string;
  vesselName?: string;
  voyageNumber?: string;
  trackingNumber?: string;
  originHub?: string;
  destinationHub?: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  currentLat?: number;
  currentLng?: number;
  sequence: number;
}

export interface MultiModalShipment {
  id: string;
  shipmentNumber: string;
  status: 'PLANNING' | 'BOOKED' | 'IN_TRANSIT' | 'ARRIVED_AT_HUB' | 'COMPLETED' | 'DELAYED';
  estimatedArrival?: string;
  actualArrival?: string;
  legs: MultiModalLeg[];
  load?: any;
}

export const multiModalApi = {
  createShipment: async (loadId: string): Promise<any> => {
    const response = await api.post('/multi-modal/shipments', { loadId });
    return response.data;
  },

  getAllShipments: async (): Promise<any> => {
    const response = await api.get('/multi-modal/shipments');
    return response.data;
  },

  getShipmentDetails: async (id: string): Promise<any> => {
    const response = await api.get(`/multi-modal/shipments/${id}`);
    return response.data;
  },

  updateLegStatus: async (legId: string, status: string): Promise<any> => {
    const response = await api.put(`/multi-modal/legs/${legId}/status`, { status });
    return response.data;
  },

  getStrategies: async (id: string): Promise<any> => {
    const response = await api.get(`/multi-modal/shipments/${id}/strategies`);
    return response.data;
  },

  executeStrategy: async (id: string): Promise<any> => {
    const response = await api.post(`/multi-modal/shipments/${id}/execute`);
    return response.data;
  },
};
