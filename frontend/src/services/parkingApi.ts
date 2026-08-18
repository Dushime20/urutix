import api from './api';
import type {
  CreateParkingReservationPayload,
  ParkingFacility,
  ParkingFeeSchedule,
  ParkingOfficer,
  ParkingPaymentMethod,
  ParkingReservation,
  ParkingReservationStats,
} from '../types/parking';

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  pagination?: { total: number; page: number; limit: number };
  possibleDuplicate?: boolean;
  emailSent?: boolean;
  emailedTo?: string[];
};

export type ParkingIshemaPayResult = {
  reservation: ParkingReservation;
  referenceId?: string;
  providerStatus: string;
  amount?: number;
  currency?: string;
  message?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  pagination?: { total: number; page: number; limit: number };
  possibleDuplicate?: boolean;
  emailSent?: boolean;
  emailedTo?: string[];
};

export interface ParkingListParams {
  search?: string;
  status?: string;
  companyName?: string;
  assignedToUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export const parkingApi = {
  create: async (payload: CreateParkingReservationPayload, idempotencyKey?: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(
      '/parking-reservations',
      payload,
      { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined },
    );
    return response.data;
  },

  lookup: async (reservationReference: string, email: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>('/parking-reservations/lookup', {
      reservationReference,
      email,
    });
    return response.data.data;
  },

  guestRespond: async (reservationReference: string, email: string, responseText: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>('/parking-reservations/lookup/respond', {
      reservationReference,
      email,
      response: responseText,
    });
    return response.data.data;
  },

  guestPay: async (payload: {
    reservationReference: string;
    email: string;
    paymentMethod: ParkingPaymentMethod;
    paymentReference: string;
    notes?: string;
  }) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>('/parking-reservations/lookup/pay', payload);
    return response.data.data;
  },

  guestPayNow: async (payload: { reservationReference: string; email: string; phoneNumber: string }) => {
    const response = await api.post<ApiEnvelope<ParkingIshemaPayResult>>('/parking-reservations/lookup/pay-now', payload);
    return response.data.data;
  },

  guestPayStatus: async (payload: { reservationReference: string; email: string; referenceId?: string }) => {
    const response = await api.post<ApiEnvelope<ParkingIshemaPayResult>>('/parking-reservations/lookup/pay-status', payload);
    return response.data.data;
  },

  list: async (params?: ParkingListParams) => {
    const response = await api.get<ApiEnvelope<ParkingReservation[]>>('/parking-reservations', { params });
    return {
      items: response.data.data || [],
      total: response.data.pagination?.total || 0,
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 10,
    };
  },

  stats: async () => {
    const response = await api.get<ApiEnvelope<ParkingReservationStats>>('/parking-reservations/stats');
    return response.data.data;
  },

  officers: async () => {
    const response = await api.get<ApiEnvelope<ParkingOfficer[]>>('/parking-reservations/officers');
    return response.data.data;
  },

  facility: async () => {
    const response = await api.get<ApiEnvelope<ParkingFacility>>('/parking-reservations/facility');
    return response.data.data;
  },

  fees: async () => {
    const response = await api.get<ApiEnvelope<ParkingFeeSchedule>>('/parking-reservations/fees');
    return response.data.data;
  },

  updateFees: async (payload: Partial<ParkingFeeSchedule>) => {
    const response = await api.patch<ApiEnvelope<ParkingFeeSchedule>>('/parking-reservations/fees', payload);
    return response.data.data;
  },

  get: async (id: string) => {
    const response = await api.get<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}`);
    return response.data.data;
  },

  startReview: async (id: string) => {
    const response = await api.patch<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/review`);
    return response.data.data;
  },

  assign: async (id: string, assignedToUserId: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/assign`, {
      assignedToUserId,
    });
    return response.data.data;
  },

  approve: async (id: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/approve`);
    return response.data.data;
  },

  reject: async (id: string, reason: string, additionalExplanation?: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/reject`, {
      reason,
      additionalExplanation,
    });
    return response.data.data;
  },

  requestInformation: async (id: string, informationRequired: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(
      `/parking-reservations/${id}/request-information`,
      { informationRequired },
    );
    return response.data.data;
  },

  reviewResponse: async (id: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/review-response`);
    return response.data.data;
  },

  respond: async (id: string, responseText: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/respond`, {
      response: responseText,
    });
    return response.data.data;
  },

  cancel: async (id: string, reason: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/cancel`, {
      reason,
    });
    return response.data.data;
  },

  addNote: async (id: string, note: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/notes`, {
      note,
    });
    return response.data.data;
  },

  pay: async (
    id: string,
    payload: { paymentMethod: ParkingPaymentMethod; paymentReference: string; notes?: string },
  ) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/pay`, payload);
    return response.data.data;
  },

  payNow: async (id: string, phoneNumber: string) => {
    const response = await api.post<ApiEnvelope<ParkingIshemaPayResult>>(`/parking-reservations/${id}/pay-now`, {
      phoneNumber,
    });
    return response.data.data;
  },

  payStatus: async (id: string, referenceId?: string) => {
    const response = await api.post<ApiEnvelope<ParkingIshemaPayResult>>(`/parking-reservations/${id}/pay-status`, {
      referenceId,
    });
    return response.data.data;
  },

  confirmPayment: async (
    id: string,
    payload: { paymentMethod: ParkingPaymentMethod; paymentReference: string; notes?: string },
  ) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(
      `/parking-reservations/${id}/confirm-payment`,
      payload,
    );
    return response.data.data;
  },

  waivePayment: async (id: string, reason: string) => {
    const response = await api.post<ApiEnvelope<ParkingReservation>>(`/parking-reservations/${id}/waive-payment`, {
      reason,
    });
    return response.data.data;
  },
};
