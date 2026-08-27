import React from 'react';
import { X, User, DollarSign, Calendar, MapPin, Package, FileText, AlertCircle, CheckCircle, TrendingUp, Percent, Receipt } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface LoanDetailModalProps {
  loan: any;
  onClose: () => void;
}

const LoanDetailModal: React.FC<LoanDetailModalProps> = ({ loan, onClose }) => {
  const { format } = useCurrencyFormat();
  if (!loan) return null;

  // Convert from the loan's stored currency to the user's preferred currency
  const loanCurrency = loan.currency || 'RWF';
  const fmt = (amount: number) => format(amount, loanCurrency);

  const borrowerName =
    loan.borrower_name ||
    loan.borrower?.contact_name ||
    loan.borrower?.company_name ||
    loan.borrower?.name ||
    null;
  const borrowerEmail = loan.borrower_email || loan.borrower?.email || null;
  const borrowerPhone = loan.borrower_phone || loan.borrower?.phone || null;
  const borrowerCompany = loan.borrower_company || loan.borrower?.company_name || null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (statusLower === 'approved') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (statusLower === 'disbursed') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (statusLower === 'rejected') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (statusLower === 'repaid') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full my-8 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Loan <span className="text-blue-600 dark:text-blue-400">Details</span>
            </h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
              Request ID: {loan.id?.substring(0, 8)}...
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status Badge */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider border ${getStatusColor(loan.status)}`}>
                {loan.status === 'approved' || loan.status === 'repaid' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : loan.status === 'rejected' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {loan.status}
              </span>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                (loan.financing_type || loan.metadata?.financing_type) === 'TRUCK_OWNER_TRIP'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {(loan.financing_type || loan.metadata?.financing_type) === 'TRUCK_OWNER_TRIP'
                  ? 'Truck Owner Trip Financing'
                  : 'Cargo Owner Financing'}
              </span>
            </div>
            {loan.risk_score && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Risk Score:</span>
                <span className={`text-lg font-black ${loan.risk_score >= 80 ? 'text-blue-600' : loan.risk_score >= 60 ? 'text-blue-400' : 'text-slate-500'}`}>
                  {loan.risk_score}%
                </span>
              </div>
            )}
          </div>

          {/* Borrower Information */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Borrower Information</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Applicant details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Name</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{borrowerName || 'N/A'}</p>
              </div>
              {borrowerCompany && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Company</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{borrowerCompany}</p>
                </div>
              )}
              {borrowerEmail && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{borrowerEmail}</p>
                </div>
              )}
              {borrowerPhone && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{borrowerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Loan Details */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Loan Details</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Requested Amount</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{fmt(loan.requested_amount || 0)}</p>
              </div>
              {loan.approved_amount && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Approved Amount</p>
                  <p className="text-xl font-black text-green-600 dark:text-green-400">{fmt(loan.approved_amount)}</p>
                </div>
              )}
              {loan.interest_rate && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nominal Rate</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{loan.interest_rate}%</p>
                </div>
              )}
              {loan.effective_annual_rate && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">APR (Effective Annual)</p>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400">{loan.effective_annual_rate}%</p>
                </div>
              )}
              {loan.loan_term_months && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Loan Term</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{loan.loan_term_months} months</p>
                </div>
              )}
              {loan.due_date && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Due Date</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(loan.due_date)}</p>
                </div>
              )}
              {(loan.purpose || loan.metadata?.purpose) && (
                <div className="md:col-span-3">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Purpose</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{loan.purpose || loan.metadata?.purpose}</p>
                </div>
              )}
            </div>
          </div>

          {/* Policy Terms — always rendered; values show '—' when not yet computed */}
          {(() => {
            const principal = loan.approved_amount || loan.requested_amount || 0;
            // Resolve rate from top-level enriched field, loanTerms snapshot, or metadata
            const rate: number | null =
              loan.interest_rate ??
              loan.loanTerms?.nominal_rate ??
              loan.metadata?.interest_rate ??
              null;
            const termMonths: number | null = loan.loan_term_months ?? loan.metadata?.loan_term_months ?? null;
            // originationFeeRate: sourced from immutable LoanTerms snapshot or metadata — never hardcoded
            const originationFeeRate: number | null =
              loan.loanTerms?.origination_fee_rate ??
              loan.metadata?.origination_fee_rate ??
              null;
            // effective_annual_rate from loanTerms snapshot or top-level
            const ear: number | null =
              loan.effective_annual_rate ??
              loan.loanTerms?.effective_annual_rate ??
              loan.metadata?.effective_annual_rate ??
              null;
            const totalInterest = rate != null && termMonths != null
              ? principal * (rate / 100) * (termMonths / 12) : null;
            const originationFee = originationFeeRate != null
              ? principal * (originationFeeRate / 100) : null;
            const totalRepayable = totalInterest != null
              ? principal + totalInterest + (originationFee ?? 0) : null;
            const monthlyInstalment = totalRepayable != null && termMonths != null && termMonths > 0
              ? totalRepayable / termMonths : null;
            const fmtMoney = (n: number) => fmt(n);
            const fmtNull = (n: number | null) => n != null ? fmtMoney(n) : '—';

            return (
              <div className="bg-gradient-to-br from-[#345E85]/5 to-indigo-50 dark:from-slate-800/50 dark:to-indigo-900/10 rounded-2xl p-6 border border-[#345E85]/10 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 bg-[#345E85]/10 dark:bg-blue-900/30 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-[#345E85] dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Loan Policy Terms</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Set by lender · Basel II / IFRS 9
                    </p>
                  </div>
                </div>

                {/* Rate row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Percent className="w-2.5 h-2.5" /> Nominal Rate
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {rate != null ? `${Number(rate).toFixed(2)}%` : '—'}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Per annum</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">APR / EAR</p>
                    <p className="text-lg font-black text-[#345E85] dark:text-blue-400">
                      {ear != null ? `${Number(ear).toFixed(2)}%` : '—'}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Monthly compounding</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Loan Term</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {termMonths != null ? `${termMonths} mo` : '—'}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{termMonths != null ? `${termMonths} instalments` : 'Pending approval'}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Score</p>
                    <p className={`text-lg font-black ${(loan.risk_score ?? 0) >= 75 ? 'text-emerald-600' : (loan.risk_score ?? 0) >= 55 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {loan.risk_score != null ? `${loan.risk_score}%` : '—'}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5 capitalize">{loan.risk_level ?? loan.metadata?.risk_level ?? 'N/A'}</p>
                  </div>
                </div>

                {/* Cost breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cost Breakdown</p>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-700">
                    {[
                      { label: 'Principal (Disbursed)', value: fmtMoney(principal), colour: 'text-slate-900 dark:text-white' },
                      { label: rate != null && termMonths != null ? `Interest (${rate}% × ${termMonths}m)` : 'Interest', value: fmtNull(totalInterest), colour: 'text-amber-600' },
                      { label: originationFeeRate != null ? `Origination Fee (${originationFeeRate}%)` : 'Origination Fee', value: fmtNull(originationFee), colour: 'text-rose-500' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center px-5 py-3">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{row.label}</span>
                        <span className={`text-sm font-black ${row.colour}`}>{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-5 py-4 bg-[#345E85]/5 dark:bg-blue-900/20">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Total Repayable</span>
                      <span className="text-2xl font-black text-[#345E85] dark:text-blue-400">{fmtNull(totalRepayable)}</span>
                    </div>
                    <div className="flex justify-between items-center px-5 py-3 border-t-2 border-dashed border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Monthly Instalment{termMonths != null ? ` × ${termMonths}` : ''}</span>
                      <span className="text-base font-black text-[#345E85] dark:text-blue-400">{fmtNull(monthlyInstalment)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Cargo Information */}
          {(loan.cargo_type || loan.pickup_location || loan.delivery_location) && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cargo Information</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shipment details</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loan.cargo_type && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cargo Type</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{loan.cargo_type}</p>
                  </div>
                )}
                {loan.cargo_weight && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Weight</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{loan.cargo_weight} kg</p>
                  </div>
                )}
                {loan.pickup_location && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Pickup Location
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{loan.pickup_location}</p>
                  </div>
                )}
                {loan.delivery_location && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Delivery Location
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{loan.delivery_location}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Timeline</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Important dates</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loan.created_at && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(loan.created_at)}</p>
                </div>
              )}
              {loan.updated_at && (
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Last Updated</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatDate(loan.updated_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          {loan.rejection_reason && (
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-800">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider">Rejection Reason</h3>
              </div>
              <p className="text-sm text-rose-800 dark:text-rose-300">{loan.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-bold uppercase tracking-wider text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LoanDetailModal;
