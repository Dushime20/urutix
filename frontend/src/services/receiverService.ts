import api from './api';
import type { 
  Receiver, 
  CreateReceiverDto, 
  AssignCargoDto 
} from '../types/receiver';

// Re-export types for convenience
export type { 
  Receiver, 
  CreateReceiverDto, 
  AssignCargoDto 
} from '../types/receiver';

class ReceiverService {
  async createReceiver(data: CreateReceiverDto): Promise<{ receiver: Receiver; message: string }> {
    const response = await api.post('/receivers', data);
    return response.data;
  }

  async getReceivers(): Promise<Receiver[]> {
    const response = await api.get('/receivers');
    return response.data;
  }

  async getReceiver(receiverId: string): Promise<Receiver> {
    const response = await api.get(`/receivers/${receiverId}`);
    return response.data;
  }

  async updateReceiver(receiverId: string, data: Partial<CreateReceiverDto>): Promise<Receiver> {
    const response = await api.put(`/receivers/${receiverId}`, data);
    return response.data;
  }

  async deleteReceiver(receiverId: string): Promise<void> {
    await api.delete(`/receivers/${receiverId}`);
  }

  async getCargosForAssignment(): Promise<any[]> {
    const response = await api.get('/receivers/cargos/available');
    return response.data;
  }

  async assignCargoToReceiver(cargoId: string, receiverId: string): Promise<any> {
    const response = await api.post(`/receivers/cargos/${cargoId}/assign`, { receiverId });
    return response.data;
  }

  async unassignCargoFromReceiver(cargoId: string): Promise<any> {
    const response = await api.post(`/receivers/cargos/${cargoId}/unassign`);
    return response.data;
  }

  async getCargosByReceiver(receiverId: string): Promise<any[]> {
    const response = await api.get(`/receivers/${receiverId}/cargos`);
    return response.data;
  }

  async getMyCargos(): Promise<any[]> {
    const response = await api.get('/receivers/my/cargos');
    return response.data;
  }

  async getCargoForInspection(cargoId: string): Promise<any> {
    const response = await api.get(`/receivers/cargos/${cargoId}/inspect`);
    return response.data;
  }

  async submitCargoInspection(cargoId: string, inspectionData: any): Promise<any> {
    const response = await api.post(`/receivers/cargos/${cargoId}/inspect`, inspectionData);
    return response.data;
  }

  async getCargoInspection(cargoId: string): Promise<any> {
    const response = await api.get(`/receivers/cargos/${cargoId}/inspection`);
    return response.data;
  }
}

const receiverService = new ReceiverService();
export default receiverService;

