import React, { useState, useMemo, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import RiskAnalysisEnlite, { type RiskAssessment } from '../components/LenderDashboard/RiskAnalysis.enlite';
import { Download, RotateCcw } from 'lucide-react';

const RiskAnalysisPage: React.FC = () => {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Lender ID from context or auth
  const lenderId = "89fa1340-429e-448f-a19d-0e987679d7cd";

  // Mock data for fallback
  const mockRiskAssessments: RiskAssessment[] = [
    {
      id: 'RISK-7721',
      borrowerName: 'TransGlobal Logistics',
      loanId: 'LOAN-001',
      loanAmount: 15000000,
      cargoType: 'Electronics',
      route: { origin: 'Kigali', destination: 'Mombasa' },
      riskScore: 2.3,
      riskCategory: 'low',
      creditScore: 780,
      businessAge: 8,
      collateralValue: 20000000,
      debtToIncomeRatio: 0.35,
      paymentHistory: 'excellent',
      probabilityOfDefault: 2.1,
      expectedLoss: 157500,
      collateralCoverageRatio: 1.33
    },
    {
      id: 'RISK-8842',
      borrowerName: 'Metro Transport LLC',
      loanId: 'LOAN-004',
      loanAmount: 32000000,
      cargoType: 'Perishables',
      route: { origin: 'Goma', destination: 'Kigali' },
      riskScore: 7.2,
      riskCategory: 'high',
      creditScore: 680,
      businessAge: 3,
      collateralValue: 35000000,
      debtToIncomeRatio: 0.62,
      paymentHistory: 'fair',
      probabilityOfDefault: 7.8,
      expectedLoss: 2496000,
      collateralCoverageRatio: 1.09
    }
  ];

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true);
        const portfolioRiskData = await lendingApi.getPortfolioRiskAssessment(lenderId);

        if (portfolioRiskData && portfolioRiskData.assessments) {
          const transformed = portfolioRiskData.assessments.map((assessment: any) => ({
            id: assessment.id?.substring(0, 8) || `RISK-${Math.floor(Math.random() * 10000)}`,
            borrowerName: assessment.borrower_name || 'Business Entity',
            loanId: assessment.loan_id || 'LOAN-X',
            loanAmount: assessment.loan_amount || 0,
            cargoType: assessment.cargo_type || 'General',
            route: {
              origin: assessment.origin || 'KGL',
              destination: assessment.destination || 'MSA'
            },
            riskScore: assessment.risk_score || 5.0,
            riskCategory: (assessment.risk_level?.toLowerCase() || 'medium') as any,
            creditScore: assessment.credit_score || 700,
            businessAge: assessment.business_age || 4,
            collateralValue: assessment.collateral_value || assessment.loan_amount * 1.1,
            debtToIncomeRatio: assessment.debt_to_income || 0.4,
            paymentHistory: assessment.payment_history || 'Good',
            probabilityOfDefault: assessment.probability_of_default || 5.0,
            expectedLoss: assessment.expected_loss || assessment.loan_amount * 0.05,
            collateralCoverageRatio: assessment.collateral_coverage_ratio || 1.1
          }));
          setRiskAssessments(transformed);
        } else {
          setRiskAssessments(mockRiskAssessments);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setRiskAssessments(mockRiskAssessments);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, [lenderId]);

  const metrics = useMemo(() => {
    const totalExposure = riskAssessments.reduce((sum, a) => sum + a.loanAmount, 0);
    const weightedRiskScore = totalExposure > 0
      ? riskAssessments.reduce((sum, a) => sum + (a.riskScore * a.loanAmount), 0) / totalExposure
      : 0;
    const expectedLoss = riskAssessments.reduce((sum, a) => sum + a.expectedLoss, 0);
    const portfolioVar = totalExposure * 0.12;
    const cargoTypes = [...new Set(riskAssessments.map(a => a.cargoType))];
    const diversificationIndex = Math.min(cargoTypes.length / 5, 1);

    return {
      totalExposure,
      weightedRiskScore,
      portfolioVar,
      expectedLoss,
      diversificationIndex
    };
  }, [riskAssessments]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Risk Intelligence</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Quantifying portfolio exposure and default probability
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
              <Download size={14} /> Intelligence Report
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <RotateCcw size={14} /> Refresh Node
            </button>
          </div>
        </div>

        <RiskAnalysisEnlite
          loading={loading}
          assessments={riskAssessments}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          metrics={metrics}
          onViewDetails={(a) => alert(`Opening deep audit for ${a.id}...`)}
        />
      </div>
    </div>
  );
};

export default RiskAnalysisPage;
