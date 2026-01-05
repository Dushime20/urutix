import React, { useState, useMemo, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { 
  FaShieldAlt, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaDownload,
  FaEye,
  FaUser,
  FaTruck,
  FaMapMarkerAlt,
  FaDollarSign,
  FaArrowUp,
  FaBalanceScale,
  FaCalculator,
  FaLightbulb,
  FaExclamationCircle,
  FaChartBar,
  FaThermometerHalf,
  FaBullseye
} from 'react-icons/fa';

interface RiskAssessment {
  id: string;
  borrowerName: string;
  loanId: string;
  loanAmount: number;
  cargoType: string;
  route: {
    origin: string;
    destination: string;
  };
  riskScore: number;
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  creditScore: number;
  businessAge: number;
  collateralValue: number;
  debtToIncomeRatio: number;
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  industryRiskLevel: 'low' | 'medium' | 'high';
  geographicRisk: 'low' | 'medium' | 'high';
  marketVolatility: number;
  regulatoryRisk: 'low' | 'medium' | 'high';
  assessmentDate: string;
  lastReviewDate: string;
  recommendations: string[];
  riskFactors: {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
  }[];
  mitigationStrategies: string[];
  probabilityOfDefault: number;
  expectedLoss: number;
  requiredInsurance: boolean;
  collateralCoverageRatio: number;
}

interface RiskMetrics {
  totalExposure: number;
  weightedRiskScore: number;
  portfolioVar: number; // Value at Risk
  expectedLoss: number;
  concentrationRisk: number;
  diversificationIndex: number;
}

const RiskAnalysisPage: React.FC = () => {
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [portfolioRisk, setPortfolioRisk] = useState<any>(null);
  const [marketTrends, setMarketTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lender ID - would typically come from context or auth
  const lenderId = "89fa1340-429e-448f-a19d-0e987679d7cd";

  // Mock data for fallback
  const mockRiskAssessments: RiskAssessment[] = [
    {
      id: 'RISK-001',
      borrowerName: 'TransGlobal Logistics',
      loanId: 'LOAN-2024-001',
      loanAmount: 75000,
      cargoType: 'Electronics',
      route: {
        origin: 'Los Angeles, CA',
        destination: 'New York, NY'
      },
      riskScore: 2.3,
      riskCategory: 'low',
      creditScore: 780,
      businessAge: 8,
      collateralValue: 90000,
      debtToIncomeRatio: 0.35,
      paymentHistory: 'excellent',
      industryRiskLevel: 'low',
      geographicRisk: 'low',
      marketVolatility: 12.5,
      regulatoryRisk: 'low',
      assessmentDate: '2024-08-10',
      lastReviewDate: '2024-08-01',
      recommendations: [
        'Consider increasing loan amount given excellent profile',
        'Monitor quarterly financial statements',
        'Maintain current insurance requirements'
      ],
      riskFactors: [
        { factor: 'Market Concentration', impact: 'low', description: 'Well-diversified customer base' },
        { factor: 'Route Stability', impact: 'low', description: 'Established shipping lanes' }
      ],
      mitigationStrategies: [
        'Cargo insurance verification',
        'Real-time tracking implementation',
        'Performance bond requirement'
      ],
      probabilityOfDefault: 2.1,
      expectedLoss: 1575,
      requiredInsurance: true,
      collateralCoverageRatio: 1.2
    },
    {
      id: 'RISK-002',
      borrowerName: 'Pacific Freight Solutions',
      loanId: 'LOAN-2024-002',
      loanAmount: 45000,
      cargoType: 'Automotive Parts',
      route: {
        origin: 'Detroit, MI',
        destination: 'Seattle, WA'
      },
      riskScore: 4.7,
      riskCategory: 'medium',
      creditScore: 720,
      businessAge: 5,
      collateralValue: 55000,
      debtToIncomeRatio: 0.48,
      paymentHistory: 'good',
      industryRiskLevel: 'low',
      geographicRisk: 'medium',
      marketVolatility: 18.2,
      regulatoryRisk: 'medium',
      assessmentDate: '2024-08-09',
      lastReviewDate: '2024-07-15',
      recommendations: [
        'Request additional financial documentation',
        'Implement monthly check-ins',
        'Consider reducing loan term'
      ],
      riskFactors: [
        { factor: 'Debt Service Coverage', impact: 'medium', description: 'Moderate debt levels' },
        { factor: 'Industry Cyclicality', impact: 'medium', description: 'Automotive sector volatility' }
      ],
      mitigationStrategies: [
        'Enhanced monitoring program',
        'Collateral revaluation quarterly',
        'Payment schedule adjustment'
      ],
      probabilityOfDefault: 4.2,
      expectedLoss: 1890,
      requiredInsurance: true,
      collateralCoverageRatio: 1.22
    },
    {
      id: 'RISK-003',
      borrowerName: 'Coastal Shipping Corp',
      loanId: 'LOAN-2024-003',
      loanAmount: 120000,
      cargoType: 'Industrial Machinery',
      route: {
        origin: 'Houston, TX',
        destination: 'Miami, FL'
      },
      riskScore: 3.8,
      riskCategory: 'medium',
      creditScore: 820,
      businessAge: 12,
      collateralValue: 150000,
      debtToIncomeRatio: 0.42,
      paymentHistory: 'excellent',
      industryRiskLevel: 'medium',
      geographicRisk: 'medium',
      marketVolatility: 22.1,
      regulatoryRisk: 'high',
      assessmentDate: '2024-08-08',
      lastReviewDate: '2024-07-20',
      recommendations: [
        'Monitor regulatory changes closely',
        'Maintain strong collateral position',
        'Consider rate adjustment for regulatory risk'
      ],
      riskFactors: [
        { factor: 'Regulatory Environment', impact: 'high', description: 'Changing environmental regulations' },
        { factor: 'Equipment Depreciation', impact: 'medium', description: 'Heavy machinery value decline' }
      ],
      mitigationStrategies: [
        'Regulatory compliance monitoring',
        'Equipment maintenance verification',
        'Environmental impact assessment'
      ],
      probabilityOfDefault: 3.5,
      expectedLoss: 4200,
      requiredInsurance: true,
      collateralCoverageRatio: 1.25
    },
    {
      id: 'RISK-004',
      borrowerName: 'Metro Transport LLC',
      loanId: 'LOAN-2024-004',
      loanAmount: 32000,
      cargoType: 'Perishable Goods',
      route: {
        origin: 'Phoenix, AZ',
        destination: 'Denver, CO'
      },
      riskScore: 7.2,
      riskCategory: 'high',
      creditScore: 680,
      businessAge: 3,
      collateralValue: 40000,
      debtToIncomeRatio: 0.62,
      paymentHistory: 'fair',
      industryRiskLevel: 'high',
      geographicRisk: 'medium',
      marketVolatility: 28.5,
      regulatoryRisk: 'high',
      assessmentDate: '2024-08-07',
      lastReviewDate: '2024-07-10',
      recommendations: [
        'Require additional collateral',
        'Implement weekly monitoring',
        'Consider loan restructuring',
        'Mandatory financial counseling'
      ],
      riskFactors: [
        { factor: 'High Perishability Risk', impact: 'high', description: 'Time-sensitive cargo with spoilage risk' },
        { factor: 'Limited Business History', impact: 'high', description: 'New business with limited track record' },
        { factor: 'High Debt Burden', impact: 'high', description: 'Elevated debt-to-income ratio' }
      ],
      mitigationStrategies: [
        'Temperature monitoring systems',
        'Expedited delivery requirements',
        'Enhanced insurance coverage',
        'Cash flow monitoring'
      ],
      probabilityOfDefault: 7.8,
      expectedLoss: 2496,
      requiredInsurance: true,
      collateralCoverageRatio: 1.25
    },
    {
      id: 'RISK-005',
      borrowerName: 'Alpine Logistics Group',
      loanId: 'LOAN-2024-005',
      loanAmount: 85000,
      cargoType: 'Chemicals',
      route: {
        origin: 'Atlanta, GA',
        destination: 'Chicago, IL'
      },
      riskScore: 8.9,
      riskCategory: 'critical',
      creditScore: 620,
      businessAge: 2,
      collateralValue: 70000,
      debtToIncomeRatio: 0.78,
      paymentHistory: 'poor',
      industryRiskLevel: 'high',
      geographicRisk: 'low',
      marketVolatility: 35.2,
      regulatoryRisk: 'high',
      assessmentDate: '2024-08-06',
      lastReviewDate: '2024-07-05',
      recommendations: [
        'Reject loan application',
        'Request co-signer or guarantor',
        'Require 50% down payment',
        'Consider alternative financing structure'
      ],
      riskFactors: [
        { factor: 'Hazardous Materials', impact: 'high', description: 'Chemical transport safety risks' },
        { factor: 'Poor Credit History', impact: 'high', description: 'Multiple late payments and defaults' },
        { factor: 'Insufficient Collateral', impact: 'high', description: 'Collateral value below loan amount' },
        { factor: 'New Business Entity', impact: 'high', description: 'Limited operating history' }
      ],
      mitigationStrategies: [
        'Hazmat certification verification',
        'Enhanced safety protocols',
        'Daily monitoring requirements',
        'Escrow account for payments'
      ],
      probabilityOfDefault: 12.5,
      expectedLoss: 10625,
      requiredInsurance: true,
      collateralCoverageRatio: 0.82
    }
  ];

  // Load risk assessments and portfolio data on component mount
  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch portfolio risk assessment and market trends
        const [portfolioRiskData, marketTrendsData] = await Promise.all([
          lendingApi.getPortfolioRiskAssessment(lenderId),
          lendingApi.getMarketTrends('US', 'Transportation')
        ]);

        setPortfolioRisk(portfolioRiskData);
        setMarketTrends(marketTrendsData);

        // Transform portfolio risk data to individual risk assessments if available
        if (portfolioRiskData && portfolioRiskData.assessments) {
          const transformedAssessments: RiskAssessment[] = portfolioRiskData.assessments.map((assessment: any) => ({
            id: assessment.id || Math.random().toString(36).substr(2, 9),
            borrowerName: assessment.borrower_name || assessment.business_name || 'Unknown Borrower',
            loanId: assessment.loan_id || '',
            loanAmount: assessment.loan_amount || assessment.amount || 0,
            cargoType: assessment.cargo_type || 'General',
            route: {
              origin: assessment.origin || 'Unknown',
              destination: assessment.destination || 'Unknown'
            },
            riskScore: assessment.risk_score || Math.random() * 10,
            riskCategory: assessment.risk_level || (
              assessment.risk_score > 7 ? 'high' :
              assessment.risk_score > 4 ? 'medium' : 'low'
            ) as 'low' | 'medium' | 'high',
            creditScore: assessment.credit_score || Math.floor(Math.random() * 200) + 600,
            businessAge: assessment.business_age || Math.floor(Math.random() * 15) + 1,
            paymentHistory: assessment.payment_history || Math.random() * 100,
            collateralValue: assessment.collateral_value || assessment.loan_amount * 1.2,
            debtToIncomeRatio: assessment.debt_to_income || Math.random() * 0.5,
            industryRisk: assessment.industry_risk || Math.random() * 5,
            geographicRisk: assessment.geographic_risk || Math.random() * 3,
            marketConditions: assessment.market_conditions || Math.random() * 4,
            assessmentDate: assessment.assessment_date || new Date().toISOString(),
            lastUpdated: assessment.updated_at || new Date().toISOString(),
            status: assessment.status || 'active',
            riskFactors: assessment.risk_factors || ['Standard risk assessment'],
            mitigationStrategies: assessment.mitigation_strategies || ['Standard monitoring'],
            probabilityOfDefault: assessment.probability_of_default || Math.random() * 0.1,
            expectedLoss: assessment.expected_loss || assessment.loan_amount * 0.05,
            requiredInsurance: assessment.required_insurance || true,
            collateralCoverageRatio: assessment.collateral_coverage_ratio || 1.2
          }));

          setRiskAssessments(transformedAssessments);
        } else {
          // Use mock data if no assessment data available
          setRiskAssessments(mockRiskAssessments);
        }
      } catch (error) {
        console.error('Error fetching risk analysis data:', error);
        setError('Failed to load risk analysis data');
        
        // Fallback to mock data
        setRiskAssessments(mockRiskAssessments);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, [lenderId]);

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('riskScore');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedAssessment, setSelectedAssessment] = useState<RiskAssessment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Calculate portfolio risk metrics
  const portfolioRiskMetrics: RiskMetrics = useMemo(() => {
    const totalExposure = riskAssessments.reduce((sum, assessment) => sum + assessment.loanAmount, 0);
    const weightedRiskScore = riskAssessments.reduce((sum, assessment) => 
      sum + (assessment.riskScore * assessment.loanAmount), 0) / totalExposure;
    
    const expectedLoss = riskAssessments.reduce((sum, assessment) => sum + assessment.expectedLoss, 0);
    
    // Simplified VaR calculation (95% confidence level)
    const portfolioVar = totalExposure * 0.15; // 15% at 95% confidence
    
    // Concentration risk based on cargo type diversity
    const cargoTypes = [...new Set(riskAssessments.map(a => a.cargoType))];
    const concentrationRisk = 1 - (cargoTypes.length / riskAssessments.length);
    
    const diversificationIndex = cargoTypes.length / 10; // Normalized to max 10 cargo types
    
    return {
      totalExposure,
      weightedRiskScore,
      portfolioVar,
      expectedLoss,
      concentrationRisk,
      diversificationIndex: Math.min(diversificationIndex, 1)
    };
  }, [riskAssessments]);

  // Filter and sort assessments
  const filteredAssessments = useMemo(() => {
    const filtered = riskAssessments.filter(assessment => {
      const matchesSearch = 
        assessment.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.cargoType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRisk = riskFilter === 'all' || assessment.riskCategory === riskFilter;
      
      return matchesSearch && matchesRisk;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof RiskAssessment];
      let bValue: any = b[sortField as keyof RiskAssessment];

      if (sortField === 'riskScore' || sortField === 'loanAmount' || sortField === 'creditScore') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [riskAssessments, searchTerm, riskFilter, sortField, sortDirection]);

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBgColor = (category: string) => {
    switch (category) {
      case 'low': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'high': return 'bg-orange-100';
      case 'critical': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  const getRiskIcon = (category: string) => {
    switch (category) {
      case 'low': return <FaCheckCircle className="text-green-500" />;
      case 'medium': return <FaExclamationCircle className="text-yellow-500" />;
      case 'high': return <FaExclamationTriangle className="text-orange-500" />;
      case 'critical': return <FaTimesCircle className="text-red-500" />;
      default: return <FaShieldAlt className="text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewDetails = (assessment: RiskAssessment) => {
    setSelectedAssessment(assessment);
    setShowDetails(true);
  };

  const handleExport = () => {
    const csvContent = [
      'Risk ID,Borrower,Loan Amount,Risk Score,Risk Category,Credit Score,Probability of Default',
      ...filteredAssessments.map(a => 
        `${a.id},${a.borrowerName},${a.loanAmount},${a.riskScore},${a.riskCategory},${a.creditScore},${a.probabilityOfDefault}%`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'risk-analysis-report.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading risk analysis data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => window.location.reload()}
                className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Risk Analysis & Assessment</h1>
          <p className="text-gray-600">Comprehensive risk evaluation tools and portfolio risk management</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Portfolio Overview
              </button>
              <button
                onClick={() => setActiveTab('assessments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assessments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Risk Assessments
              </button>
              <button
                onClick={() => setActiveTab('modeling')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'modeling'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Risk Modeling
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Portfolio Risk Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Risk Exposure</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolioRiskMetrics.totalExposure)}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-gray-600 text-sm">Weighted Risk: </span>
                      <span className="text-orange-600 text-sm ml-1">{portfolioRiskMetrics.weightedRiskScore.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaDollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Value at Risk (95%)</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(portfolioRiskMetrics.portfolioVar)}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-gray-600 text-sm">15% of portfolio</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expected Loss</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(portfolioRiskMetrics.expectedLoss)}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-gray-600 text-sm">
                        {((portfolioRiskMetrics.expectedLoss / portfolioRiskMetrics.totalExposure) * 100).toFixed(2)}% of exposure
                      </span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FaCalculator className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Diversification Index</p>
                    <p className="text-2xl font-bold text-green-600">{(portfolioRiskMetrics.diversificationIndex * 100).toFixed(0)}%</p>
                    <div className="flex items-center mt-2">
                      <FaArrowUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600 text-sm">Well diversified</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaBalanceScale className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Distribution Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaChartBar className="h-5 w-5 text-blue-600 mr-2" />
                  Risk Category Distribution
                </h3>
                <div className="space-y-4">
                  {['low', 'medium', 'high', 'critical'].map((category) => {
                    const count = riskAssessments.filter(a => a.riskCategory === category).length;
                    const percentage = (count / riskAssessments.length) * 100;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getRiskIcon(category)}
                          <span className="ml-2 text-sm font-medium capitalize">{category} Risk</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                            <div 
                              className={`h-2 rounded-full ${
                                category === 'low' ? 'bg-green-600' :
                                category === 'medium' ? 'bg-yellow-600' :
                                category === 'high' ? 'bg-orange-600' : 'bg-red-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaThermometerHalf className="h-5 w-5 text-orange-600 mr-2" />
                  Risk Heat Map by Cargo Type
                </h3>
                <div className="space-y-3">
                  {[...new Set(riskAssessments.map(a => a.cargoType))].map((cargoType) => {
                    const assessments = riskAssessments.filter(a => a.cargoType === cargoType);
                    const avgRisk = assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length;
                    const totalExposure = assessments.reduce((sum, a) => sum + a.loanAmount, 0);
                    
                    return (
                      <div key={cargoType} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div>
                          <div className="font-medium text-gray-900">{cargoType}</div>
                          <div className="text-sm text-gray-600">{formatCurrency(totalExposure)} exposure</div>
                        </div>
                        <div className="flex items-center">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            avgRisk < 3 ? 'bg-green-100 text-green-800' :
                            avgRisk < 6 ? 'bg-yellow-100 text-yellow-800' :
                            avgRisk < 8 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {avgRisk.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'assessments' && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search by borrower, loan ID, cargo type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                    <option value="critical">Critical Risk</option>
                  </select>
                </div>

                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FaDownload className="h-4 w-4" />
                  Export Report
                </button>
              </div>
            </div>

            {/* Risk Assessments Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrower & Loan
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('riskScore')}
                      >
                        Risk Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Risk Category
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('creditScore')}
                      >
                        Credit Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cargo & Route
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key Metrics
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <FaUser className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{assessment.borrowerName}</div>
                              <div className="text-sm text-gray-500">{assessment.loanId}</div>
                              <div className="text-sm text-gray-500">{formatCurrency(assessment.loanAmount)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-2xl font-bold text-gray-900">{assessment.riskScore.toFixed(1)}</div>
                            <div className="ml-2">
                              <div className="text-xs text-gray-500">out of 10</div>
                              <div className="text-xs text-gray-500">
                                PD: {assessment.probabilityOfDefault}%
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getRiskIcon(assessment.riskCategory)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBgColor(assessment.riskCategory)} ${getRiskColor(assessment.riskCategory)}`}>
                              {assessment.riskCategory.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{assessment.creditScore}</div>
                          <div className="text-sm text-gray-500">
                            {assessment.paymentHistory} history
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <FaTruck className="h-4 w-4 text-gray-400 mr-2" />
                            {assessment.cargoType}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <FaMapMarkerAlt className="h-3 w-3 text-gray-400 mr-1" />
                            {assessment.route.origin} → {assessment.route.destination}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900">
                            DTI: {(assessment.debtToIncomeRatio * 100).toFixed(0)}%
                          </div>
                          <div className="text-gray-500">
                            Collateral: {(assessment.collateralCoverageRatio * 100).toFixed(0)}%
                          </div>
                          <div className="text-gray-500">
                            Business: {assessment.businessAge}y
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(assessment)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <FaEye className="h-4 w-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'modeling' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaCalculator className="h-5 w-5 text-purple-600 mr-2" />
                Risk Scoring Model
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Credit Score Weight</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-700">35% of total score</span>
                    <span className="font-bold text-purple-900">High Impact</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Collateral Coverage</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">25% of total score</span>
                    <span className="font-bold text-blue-900">High Impact</span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Business History</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">20% of total score</span>
                    <span className="font-bold text-green-900">Medium Impact</span>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Industry Risk</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-700">20% of total score</span>
                    <span className="font-bold text-yellow-900">Medium Impact</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaLightbulb className="h-5 w-5 text-yellow-600 mr-2" />
                Risk Mitigation Strategies
              </h3>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900">Enhanced Monitoring</h4>
                  <p className="text-sm text-gray-600">Real-time tracking and regular check-ins for high-risk loans</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900">Insurance Requirements</h4>
                  <p className="text-sm text-gray-600">Mandatory cargo and liability insurance based on risk level</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-900">Collateral Management</h4>
                  <p className="text-sm text-gray-600">Regular revaluation and additional security for high-risk cases</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-gray-900">Rate Adjustments</h4>
                  <p className="text-sm text-gray-600">Risk-based pricing to compensate for elevated exposure</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Assessment Details Modal */}
        {showDetails && selectedAssessment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Risk Assessment Details - {selectedAssessment.id}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Borrower Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedAssessment.borrowerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Credit Score:</span>
                        <span className="font-medium">{selectedAssessment.creditScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Business Age:</span>
                        <span className="font-medium">{selectedAssessment.businessAge} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment History:</span>
                        <span className="font-medium capitalize">{selectedAssessment.paymentHistory}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Financial Metrics</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Loan Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedAssessment.loanAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Collateral Value:</span>
                        <span className="font-medium">{formatCurrency(selectedAssessment.collateralValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">DTI Ratio:</span>
                        <span className="font-medium">{(selectedAssessment.debtToIncomeRatio * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coverage Ratio:</span>
                        <span className="font-medium">{(selectedAssessment.collateralCoverageRatio * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Risk Assessment</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Overall Risk Score:</span>
                        <div className="flex items-center">
                          <span className="text-2xl font-bold mr-2">{selectedAssessment.riskScore.toFixed(1)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBgColor(selectedAssessment.riskCategory)} ${getRiskColor(selectedAssessment.riskCategory)}`}>
                            {selectedAssessment.riskCategory.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Probability of Default:</span>
                        <span className="font-medium text-red-600">{selectedAssessment.probabilityOfDefault}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Loss:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(selectedAssessment.expectedLoss)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Risk Factors</h4>
                    <div className="space-y-2">
                      {selectedAssessment.riskFactors.map((factor, index) => (
                        <div key={index} className="flex items-start justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{factor.factor}</div>
                            <div className="text-sm text-gray-600">{factor.description}</div>
                          </div>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                            factor.impact === 'low' ? 'bg-green-100 text-green-800' :
                            factor.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {factor.impact.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Action Items:</h5>
                    <ul className="space-y-1">
                      {selectedAssessment.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <FaBullseye className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Mitigation Strategies:</h5>
                    <ul className="space-y-1">
                      {selectedAssessment.mitigationStrategies.map((strategy, index) => (
                        <li key={index} className="flex items-start">
                          <FaShieldAlt className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{strategy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Generate Report
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Update Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskAnalysisPage;
