import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { 
  FaUser,
  FaChartLine,
  FaCalculator,
  FaFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBan,
  FaSearch,
  FaDownload,
  FaEye,
  FaHistory,
  FaCreditCard,
  FaDollarSign,
  FaClock,
  FaTimes,
  FaPrint
} from 'react-icons/fa';

interface CreditApplication {
  id: string;
  applicantName: string;
  businessName: string;
  applicationDate: string;
  requestedAmount: number;
  purpose: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  creditScore: number;
  industry: string;
  businessAge: number;
}

interface CreditScore {
  overall: number;
  components: {
    creditHistory: number;
    financialStability: number;
    businessPerformance: number;
    collateral: number;
    industryRisk: number;
  };
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendation: 'approve' | 'conditional' | 'reject';
}

interface FinancialMetrics {
  annualRevenue: number;
  netIncome: number;
  debtToIncomeRatio: number;
  currentRatio: number;
  cashFlow: number;
  assets: number;
  liabilities: number;
}

const CreditAssessmentPage: React.FC = () => {
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lender ID - would typically come from context or auth
  const lenderId = "89fa1340-429e-448f-a19d-0e987679d7cd";

  // Mock data for fallback
  const mockApplications: CreditApplication[] = [
    {
      id: 'APP001',
      applicantName: 'John Smith',
      businessName: 'Smith Logistics LLC',
      applicationDate: '2024-01-15',
      requestedAmount: 75000,
      purpose: 'Fleet expansion',
      status: 'pending',
      riskLevel: 'medium',
      creditScore: 720,
      industry: 'Transportation',
      businessAge: 5
    },
    {
      id: 'APP002',
      applicantName: 'Maria Garcia',
      businessName: 'Garcia Freight Solutions',
      applicationDate: '2024-01-14',
      requestedAmount: 150000,
      purpose: 'Warehouse acquisition',
      status: 'in-review',
      riskLevel: 'low',
      creditScore: 780,
      industry: 'Logistics',
      businessAge: 8
    },
    {
      id: 'APP003',
      applicantName: 'David Chen',
      businessName: 'Chen Import Export',
      applicationDate: '2024-01-13',
      requestedAmount: 200000,
      purpose: 'Working capital',
      status: 'pending',
      riskLevel: 'high',
      creditScore: 650,
      industry: 'Import/Export',
      businessAge: 2
    }
  ];

  // Load credit applications on component mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch loan requests from API (these are essentially credit applications)
        const loanRequests = await lendingApi.getLenderLoanRequests(
          lenderId, 
          'pending,in-review', // status filter for pending assessments
          1, // page
          100 // limit
        );

        // Transform loan requests to credit application format
        const transformedApplications: CreditApplication[] = (loanRequests || []).map((loan: any) => ({
          id: loan.id || Math.random().toString(36).substr(2, 9),
          applicantName: loan.borrower_name || loan.created_by || 'Unknown Applicant',
          businessName: loan.business_name || loan.company_name || 'Unknown Business',
          applicationDate: loan.created_at ? new Date(loan.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          requestedAmount: loan.requested_amount || 0,
          purpose: loan.purpose || 'Business operations',
          status: loan.status === 'pending' ? 'pending' as const : 
                 loan.status === 'approved' ? 'approved' as const :
                 loan.status === 'rejected' ? 'rejected' as const : 'in-review' as const,
          riskLevel: loan.risk_level || (
            loan.requested_amount > 100000 ? 'high' :
            loan.requested_amount > 50000 ? 'medium' : 'low'
          ) as 'low' | 'medium' | 'high',
          creditScore: loan.credit_score || Math.floor(Math.random() * 200) + 600, // Generate if not available
          industry: loan.industry || 'Transportation',
          businessAge: loan.business_age || Math.floor(Math.random() * 10) + 1
        }));

        setApplications(transformedApplications);
      } catch (error) {
        console.error('Error fetching credit applications:', error);
        setError('Failed to load credit applications');
        
        // Fallback to mock data
        setApplications(mockApplications);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [lenderId]);

  const [selectedApplication, setSelectedApplication] = useState<CreditApplication | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const [creditScore, setCreditScore] = useState<CreditScore>({
    overall: 720,
    components: {
      creditHistory: 85,
      financialStability: 78,
      businessPerformance: 82,
      collateral: 75,
      industryRisk: 70
    },
    factors: {
      positive: [
        'Strong payment history',
        'Consistent revenue growth',
        'Low debt-to-income ratio',
        'Established business relationships'
      ],
      negative: [
        'Limited collateral value',
        'Industry volatility',
        'Recent market challenges'
      ]
    },
    recommendation: 'conditional'
  });

  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics>({
    annualRevenue: 850000,
    netIncome: 127500,
    debtToIncomeRatio: 0.35,
    currentRatio: 1.8,
    cashFlow: 95000,
    assets: 450000,
    liabilities: 157500
  });

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || app.riskLevel === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'in-review': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAssessment = (application: CreditApplication) => {
    setSelectedApplication(application);
    setShowAssessmentModal(true);
  };

  const calculateCreditScore = () => {
    // Simulate credit score calculation based on various factors
    const baseScore = 600;
    const factors = {
      creditHistory: financialMetrics.debtToIncomeRatio < 0.4 ? 50 : 20,
      financialStability: financialMetrics.currentRatio > 1.5 ? 40 : 10,
      businessPerformance: financialMetrics.netIncome > 100000 ? 30 : 15,
      collateral: financialMetrics.assets > 400000 ? 25 : 10,
      industryRisk: selectedApplication?.industry === 'Transportation' ? 15 : 20
    };

    const totalScore = baseScore + Object.values(factors).reduce((sum, factor) => sum + factor, 0);
    
    setCreditScore(prev => ({
      ...prev,
      overall: Math.min(850, totalScore),
      recommendation: totalScore >= 720 ? 'approve' : totalScore >= 650 ? 'conditional' : 'reject'
    }));
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaFileAlt className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(app => app.status === 'pending').length}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaClock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Credit Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(applications.reduce((sum, app) => sum + app.creditScore, 0) / applications.length)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaChartLine className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requested</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(applications.reduce((sum, app) => sum + app.requestedAmount, 0) / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-review">In Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Credit Applications</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUser className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {application.applicantName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{application.businessName}</div>
                    <div className="text-sm text-gray-500">{application.industry}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${application.requestedAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">{application.purpose}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getCreditScoreColor(application.creditScore)}`}>
                      {application.creditScore}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(application.riskLevel)}`}>
                      {application.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAssessment(application)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Assess Credit"
                      >
                        <FaCalculator className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        title="View Details"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-purple-600 hover:text-purple-900"
                        title="History"
                      >
                        <FaHistory className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCreditCalculatorTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Credit Score Calculator</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Financial Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Revenue ($)
                  </label>
                  <input
                    type="number"
                    value={financialMetrics.annualRevenue}
                    onChange={(e) => setFinancialMetrics(prev => ({
                      ...prev,
                      annualRevenue: Number(e.target.value)
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Net Income ($)
                  </label>
                  <input
                    type="number"
                    value={financialMetrics.netIncome}
                    onChange={(e) => setFinancialMetrics(prev => ({
                      ...prev,
                      netIncome: Number(e.target.value)
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Assets ($)
                  </label>
                  <input
                    type="number"
                    value={financialMetrics.assets}
                    onChange={(e) => setFinancialMetrics(prev => ({
                      ...prev,
                      assets: Number(e.target.value)
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Liabilities ($)
                  </label>
                  <input
                    type="number"
                    value={financialMetrics.liabilities}
                    onChange={(e) => setFinancialMetrics(prev => ({
                      ...prev,
                      liabilities: Number(e.target.value)
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Cash Flow ($)
                  </label>
                  <input
                    type="number"
                    value={financialMetrics.cashFlow}
                    onChange={(e) => setFinancialMetrics(prev => ({
                      ...prev,
                      cashFlow: Number(e.target.value)
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Ratio
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={financialMetrics.currentRatio}
                    onChange={(e) => setFinancialMetrics(prev => ({
                      ...prev,
                      currentRatio: Number(e.target.value)
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <button
                onClick={calculateCreditScore}
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FaCalculator className="h-4 w-4" />
                Calculate Credit Score
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
              <h4 className="text-md font-medium text-gray-900 mb-4">Credit Score Results</h4>
              
              <div className="text-center mb-6">
                <div className={`text-4xl font-bold mb-2 ${getCreditScoreColor(creditScore.overall)}`}>
                  {creditScore.overall}
                </div>
                <div className="text-sm text-gray-600">Overall Credit Score</div>
              </div>

              <div className="space-y-3">
                {Object.entries(creditScore.components).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-white rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {creditScore.recommendation === 'approve' && <FaCheckCircle className="h-5 w-5 text-green-600" />}
                  {creditScore.recommendation === 'conditional' && <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />}
                  {creditScore.recommendation === 'reject' && <FaBan className="h-5 w-5 text-red-600" />}
                  <span className="font-medium text-gray-900 capitalize">
                    {creditScore.recommendation}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {creditScore.recommendation === 'approve' && 'Strong credit profile with low risk indicators.'}
                  {creditScore.recommendation === 'conditional' && 'Moderate credit profile requiring additional review.'}
                  {creditScore.recommendation === 'reject' && 'High risk profile not meeting minimum requirements.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Credit Assessment Reports</h3>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FaDownload className="h-4 w-4" />
              Export Reports
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <FaPrint className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Approved Applications</h4>
              <FaCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {applications.filter(app => app.status === 'approved').length}
            </div>
            <p className="text-sm text-gray-600">This month</p>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Under Review</h4>
              <FaClock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {applications.filter(app => app.status === 'in-review' || app.status === 'pending').length}
            </div>
            <p className="text-sm text-gray-600">Pending assessment</p>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900">Rejected Applications</h4>
              <FaBan className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {applications.filter(app => app.status === 'rejected').length}
            </div>
            <p className="text-sm text-gray-600">This month</p>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-4">Risk Distribution</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.riskLevel === 'low').length}
              </div>
              <div className="text-sm text-gray-600">Low Risk</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {applications.filter(app => app.riskLevel === 'medium').length}
              </div>
              <div className="text-sm text-gray-600">Medium Risk</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {applications.filter(app => app.riskLevel === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Risk</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // API handlers for credit assessment actions
  const handleApproveApplication = async (applicationId: string, approvedAmount: number) => {
    try {
      await lendingApi.approveLoanRequest(applicationId, {
        approved_amount: approvedAmount,
        interest_rate: 8.5, // Default rate, could be dynamic
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
      });
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'approved' as const }
          : app
      ));
    } catch (error) {
      console.error('Error approving application:', error);
      setError('Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId: string, reason: string) => {
    try {
      await lendingApi.rejectLoanRequest(applicationId, reason);
      
      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: 'rejected' as const }
          : app
      ));
    } catch (error) {
      console.error('Error rejecting application:', error);
      setError('Failed to reject application');
    }
  };

  const handlePerformCreditCheck = async (applicationId: string, borrowerId: string) => {
    try {
      const creditCheckResult = await lendingApi.performCreditCheck(borrowerId, 'comprehensive');
      
      // Update application with credit check results
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { 
              ...app, 
              creditScore: creditCheckResult.credit_score || app.creditScore,
              status: 'in-review' as const
            }
          : app
      ));
    } catch (error) {
      console.error('Error performing credit check:', error);
      setError('Failed to perform credit check');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <FaChartLine className="h-4 w-4" /> },
    { id: 'calculator', name: 'Credit Calculator', icon: <FaCalculator className="h-4 w-4" /> },
    { id: 'reports', name: 'Reports', icon: <FaFileAlt className="h-4 w-4" /> }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'calculator':
        return renderCreditCalculatorTab();
      case 'reports':
        return renderReportsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading credit applications...</span>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaCreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Credit Assessment</h1>
              <p className="text-gray-600">Comprehensive credit evaluation tools and analytics</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>

        {/* Credit Assessment Modal */}
        {showAssessmentModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Credit Assessment - {selectedApplication.applicantName}
                </h3>
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Application Details */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Application Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Application ID:</span>
                        <span className="font-medium">{selectedApplication.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Business Name:</span>
                        <span className="font-medium">{selectedApplication.businessName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Industry:</span>
                        <span className="font-medium">{selectedApplication.industry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Requested Amount:</span>
                        <span className="font-medium">${selectedApplication.requestedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purpose:</span>
                        <span className="font-medium">{selectedApplication.purpose}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Business Age:</span>
                        <span className="font-medium">{selectedApplication.businessAge} years</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Risk Factors</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Positive Factors:</span>
                      </div>
                      {creditScore.factors.positive.map((factor, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <FaCheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">{factor}</span>
                        </div>
                      ))}
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-gray-600">Negative Factors:</span>
                      </div>
                      {creditScore.factors.negative.map((factor, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <FaExclamationTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-gray-700">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Credit Score Analysis */}
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Credit Score Analysis</h4>
                    
                    <div className="text-center mb-6">
                      <div className={`text-5xl font-bold mb-2 ${getCreditScoreColor(selectedApplication.creditScore)}`}>
                        {selectedApplication.creditScore}
                      </div>
                      <div className="text-sm text-gray-600">Credit Score</div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(creditScore.components).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {value}/100
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Recommendation</h4>
                    <div className="flex items-center gap-3 mb-4">
                      {creditScore.recommendation === 'approve' && (
                        <>
                          <FaCheckCircle className="h-8 w-8 text-green-600" />
                          <div>
                            <div className="font-medium text-green-600">Approve</div>
                            <div className="text-sm text-gray-600">Low risk, meets all criteria</div>
                          </div>
                        </>
                      )}
                      {creditScore.recommendation === 'conditional' && (
                        <>
                          <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />
                          <div>
                            <div className="font-medium text-yellow-600">Conditional Approval</div>
                            <div className="text-sm text-gray-600">Requires additional review</div>
                          </div>
                        </>
                      )}
                      {creditScore.recommendation === 'reject' && (
                        <>
                          <FaBan className="h-8 w-8 text-red-600" />
                          <div>
                            <div className="font-medium text-red-600">Reject</div>
                            <div className="text-sm text-gray-600">High risk, does not meet criteria</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Approve
                </button>
                <button className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                  Request More Info
                </button>
                <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditAssessmentPage;
