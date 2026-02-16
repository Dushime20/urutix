import React, { useState, useMemo } from 'react';
import InterestTrackingEnlite, { type InterestEarning } from '../components/LenderDashboard/InterestTracking.enlite';
import { Download, RotateCcw } from 'lucide-react';

const InterestTrackingPage: React.FC = () => {
  const [loading] = useState(false);

  const [interestData] = useState<InterestEarning[]>([
    {
      id: 'INT-001',
      loanId: 'LOAN-2024-001',
      borrowerName: 'TransGlobal Logistics',
      principalAmount: 75000000,
      interestRate: 8.5,
      accruedInterest: 15650000,
      paidInterest: 12400000,
      outstandingInterest: 3250000,
      startDate: '2024-01-15',
      maturityDate: '2025-01-15',
      paymentFrequency: 'monthly',
      status: 'active',
      cargoType: 'Electronics',
      riskCategory: 'low',
      nextPaymentDate: '2024-08-15',
      daysActive: 210
    },
    {
      id: 'INT-002',
      loanId: 'LOAN-2024-002',
      borrowerName: 'Pacific Freight Solutions',
      principalAmount: 45000000,
      interestRate: 9.2,
      accruedInterest: 8280000,
      paidInterest: 6900000,
      outstandingInterest: 1380000,
      startDate: '2024-02-01',
      maturityDate: '2025-08-01',
      paymentFrequency: 'monthly',
      status: 'active',
      cargoType: 'Automotive Parts',
      riskCategory: 'low',
      nextPaymentDate: '2024-09-01',
      daysActive: 193
    },
    {
      id: 'INT-003',
      loanId: 'LOAN-2024-003',
      borrowerName: 'Coastal Shipping Corp',
      principalAmount: 120000000,
      interestRate: 7.8,
      accruedInterest: 18720000,
      paidInterest: 15600000,
      outstandingInterest: 3120000,
      startDate: '2024-01-10',
      maturityDate: '2026-01-10',
      paymentFrequency: 'monthly',
      status: 'active',
      cargoType: 'Machinery',
      riskCategory: 'medium',
      nextPaymentDate: '2024-08-10',
      daysActive: 215
    },
    {
      id: 'INT-004',
      loanId: 'LOAN-2024-004',
      borrowerName: 'Metro Transport LLC',
      principalAmount: 32000000,
      interestRate: 11.2,
      accruedInterest: 5376000,
      paidInterest: 3200000,
      outstandingInterest: 2176000,
      startDate: '2024-03-15',
      maturityDate: '2025-12-15',
      paymentFrequency: 'monthly',
      status: 'overdue',
      cargoType: 'Perishables',
      riskCategory: 'high',
      nextPaymentDate: '2024-07-15',
      daysActive: 150
    }
  ]);

  const metrics = useMemo(() => {
    const totalInterestEarned = interestData.reduce((sum, loan) => sum + loan.paidInterest, 0);
    const totalAccruedInterest = interestData.reduce((sum, loan) => sum + loan.accruedInterest, 0);
    const totalOutstandingInterest = interestData.reduce((sum, loan) => sum + loan.outstandingInterest, 0);
    const totalPrincipal = interestData.reduce((sum, loan) => sum + loan.principalAmount, 0);
    const averageInterestRate = totalPrincipal > 0
      ? interestData.reduce((sum, loan) => sum + (loan.interestRate * loan.principalAmount), 0) / totalPrincipal
      : 0;
    const collectionEfficiency = totalAccruedInterest > 0
      ? (totalInterestEarned / totalAccruedInterest) * 100
      : 0;

    return {
      totalInterestEarned,
      averageInterestRate,
      totalOutstandingInterest,
      collectionEfficiency
    };
  }, [interestData]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Interest Tracking</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Revenue auditing and yield performance monitoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
              <Download size={14} /> Revenue Report
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <RotateCcw size={14} /> Sync Metrics
            </button>
          </div>
        </div>

        <InterestTrackingEnlite
          loading={loading}
          data={interestData}
          metrics={metrics}
          onViewDetails={(loan) => alert(`Auditing revenue for ${loan.loanId}...`)}
        />
      </div>
    </div>
  );
};

export default InterestTrackingPage;
