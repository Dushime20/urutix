import api from './api';
import type { 
  LoanRequest, 
  CreateLoanRequestDto, 
  CreateCargoLoanRequestDto 
} from '../types/loanRequest';

// Re-export types for convenience
export type { 
  LoanRequest, 
  CreateLoanRequestDto, 
  CreateCargoLoanRequestDto,
  BeneficiaryDto,
  RepaymentRequest
} from '../types/loanRequest';

class LoanRequestService {
  private baseUrl = '/lending';

  async createLoanRequest(data: CreateLoanRequestDto): Promise<LoanRequest> {
    const response = await api.post(`${this.baseUrl}/loan-requests`, data);
    return response.data;
  }

  async createLoanRequestForCargo(cargoId: string, data: CreateCargoLoanRequestDto & { lender_id?: string }): Promise<LoanRequest> {
    const response = await api.post(`${this.baseUrl}/cargo/${cargoId}/loan-request`, data);
    return response.data;
  }

  async getLoanRequest(loanId: string): Promise<LoanRequest> {
    const response = await api.get(`${this.baseUrl}/loan-requests/${loanId}`);
    return response.data;
  }

  async getTenantLoans(tenantId: string, status?: string): Promise<LoanRequest[]> {
    const params = status ? { status } : {};
    const response = await api.get(`${this.baseUrl}/tenant/${tenantId}/loans`, { params });
    return response.data;
  }

  async processRepayment(loanId: string, finalPaymentAmount: number): Promise<any> {
    const response = await api.post(`${this.baseUrl}/repayments/${loanId}`, {
      final_payment_amount: finalPaymentAmount
    });
    return response.data;
  }

  async getLenderDashboard(lenderId: string, dateFrom?: string, dateTo?: string): Promise<any> {
    const params: any = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    
    const response = await api.get(`${this.baseUrl}/dashboard/${lenderId}`, { params });
    return response.data;
  }
}

export const loanRequestService = new LoanRequestService();

// Also export as default for easier importing
export default loanRequestService;
