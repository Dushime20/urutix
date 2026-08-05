// Types for loan request operations
export interface LoanRequest {
  id: string;
  tenant_id: string;
  cargo_id: string;
  trip_id: string;
  lender_id?: string;
  requested_amount: number;
  approved_amount?: number;
  currency?: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'failed' | 'defaulted';
  idempotency_key: string;
  interest_amount?: number;
  due_date?: string;
  created_by: string;
  external_loan_ref?: string;
  rejection_reason?: string;
  requested_split?: any[];
  metadata?: any;
  created_at: string;
  updated_at: string;
  lender?: any;
  disbursements?: any[];
  repayments?: any[];
  purpose?: string;
  interest_rate?: number;
  loan_term_months?: number;
}

export interface CreateLoanRequestDto {
  tenant_id: string;
  cargo_id: string;
  trip_id: string;
  requested_amount: number;
  currency?: string;
  due_date?: string;
  requested_split?: any[];
  metadata?: any;
}

export interface CreateCargoLoanRequestDto {
  trip_id: string;
}

export interface BeneficiaryDto {
  beneficiary_id: string;
  percentage: number;
  role: string;
}

export interface RepaymentRequest {
  amount: number;
  payment_method: string;
  notes?: string;
}
