import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import CreditAssessmentEnlite, { type CreditApplication } from '../components/LenderDashboard/CreditAssessment.enlite';
import { Download, RotateCcw } from 'lucide-react';

const CreditAssessmentPage: React.FC = () => {
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Lender ID from context or auth
  const lenderId = "89fa1340-429e-448f-a19d-0e987679d7cd";

  // Mock data for fallback
  const mockApplications: CreditApplication[] = [
    {
      id: 'APP-7721',
      applicantName: 'Jean Baptiste',
      businessName: 'Smith Logistics LLC',
      applicationDate: '2024-01-15',
      requestedAmount: 15000000,
      purpose: 'Fleet expansion',
      status: 'pending',
      riskLevel: 'medium',
      creditScore: 720,
      industry: 'Transportation',
      businessAge: 5
    },
    {
      id: 'APP-8842',
      applicantName: 'Marie Claire',
      businessName: 'Garcia Freight Solutions',
      applicationDate: '2024-01-14',
      requestedAmount: 25000000,
      purpose: 'Warehouse acquisition',
      status: 'in-review',
      riskLevel: 'low',
      creditScore: 780,
      industry: 'Logistics',
      businessAge: 8
    }
  ];

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const loanRequests = await lendingApi.getLenderLoanRequests(lenderId, 'pending,in-review', 1, 100);

        if (loanRequests && loanRequests.length > 0) {
          const transformed: CreditApplication[] = loanRequests.map((loan: any) => ({
            id: loan.id?.substring(0, 8) || `APP-${Math.floor(Math.random() * 10000)}`,
            applicantName: loan.borrower_name || 'Unknown Applicant',
            businessName: loan.business_name || 'Business Entity',
            applicationDate: loan.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            requestedAmount: loan.requested_amount || 0,
            purpose: loan.purpose || 'Operations',
            status: (loan.status || 'pending') as any,
            riskLevel: (loan.risk_level || (loan.requested_amount > 20000000 ? 'high' : 'medium')) as any,
            creditScore: loan.credit_score || Math.floor(Math.random() * 200) + 600,
            industry: 'Logistics',
            businessAge: 4
          }));
          setApplications(transformed);
        } else {
          setApplications(mockApplications);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setApplications(mockApplications);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [lenderId]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Credit Assessment</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Risk analysis and borrower eligibility terminal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
              <Download size={14} /> Export Logs
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <RotateCcw size={14} /> Refresh Terminal
            </button>
          </div>
        </div>

        <CreditAssessmentEnlite
          loading={loading}
          applications={applications}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAssess={(app) => alert(`Initializing assessment for ${app.applicantName}...`)}
        />
      </div>
    </div>
  );
};

export default CreditAssessmentPage;
