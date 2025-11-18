import React, { useState, useMemo } from 'react';
import { 
  FaPercent, 
  FaDollarSign,
  FaChartLine,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaUser,
  FaTruck,
  FaMapMarkerAlt,
  FaArrowUp,
  FaArrowDown,
  FaCalculator,
  FaFileInvoiceDollar,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaChartBar,
  FaBalanceScale,
  FaIndustry,
  FaCreditCard,
  FaHistory,
  FaTimesCircle,
  FaBullseye
} from 'react-icons/fa';

interface InterestEarning {
  id: string;
  loanId: string;
  borrowerName: string;
  principalAmount: number;
  interestRate: number;
  accruedInterest: number;
  paidInterest: number;
  outstandingInterest: number;
  startDate: string;
  maturityDate: string;
  paymentFrequency: 'monthly' | 'quarterly' | 'annually';
  status: 'active' | 'paid' | 'overdue' | 'defaulted';
  cargoType: string;
  route: {
    origin: string;
    destination: string;
  };
  riskCategory: 'low' | 'medium' | 'high';
  lastPaymentDate?: string;
  nextPaymentDate: string;
  totalExpectedInterest: number;
  effectiveYield: number;
  daysActive: number;
  compoundingPeriods: number;
}

interface InterestMetrics {
  totalInterestEarned: number;
  totalAccruedInterest: number;
  totalOutstandingInterest: number;
  averageInterestRate: number;
  weightedAverageYield: number;
  monthlyInterestIncome: number;
  interestGrowthRate: number;
  collectionEfficiency: number;
}

interface RateAnalysis {
  riskCategory: string;
  averageRate: number;
  loanCount: number;
  totalPrincipal: number;
  totalInterest: number;
  performanceRatio: number;
}

const InterestTrackingPage: React.FC = () => {
  const [interestData] = useState<InterestEarning[]>([
    {
      id: 'INT-001',
      loanId: 'LOAN-2024-001',
      borrowerName: 'TransGlobal Logistics',
      principalAmount: 75000,
      interestRate: 8.5,
      accruedInterest: 15650,
      paidInterest: 12400,
      outstandingInterest: 3250,
      startDate: '2024-01-15',
      maturityDate: '2025-01-15',
      paymentFrequency: 'monthly',
      status: 'active',
      cargoType: 'Electronics',
      route: {
        origin: 'Los Angeles, CA',
        destination: 'New York, NY'
      },
      riskCategory: 'low',
      lastPaymentDate: '2024-07-15',
      nextPaymentDate: '2024-08-15',
      totalExpectedInterest: 22500,
      effectiveYield: 8.7,
      daysActive: 210,
      compoundingPeriods: 7
    },
    {
      id: 'INT-002',
      loanId: 'LOAN-2024-002',
      borrowerName: 'Pacific Freight Solutions',
      principalAmount: 45000,
      interestRate: 9.2,
      accruedInterest: 8280,
      paidInterest: 6900,
      outstandingInterest: 1380,
      startDate: '2024-02-01',
      maturityDate: '2025-08-01',
      paymentFrequency: 'monthly',
      status: 'active',
      cargoType: 'Automotive Parts',
      route: {
        origin: 'Detroit, MI',
        destination: 'Seattle, WA'
      },
      riskCategory: 'low',
      lastPaymentDate: '2024-08-01',
      nextPaymentDate: '2024-09-01',
      totalExpectedInterest: 24840,
      effectiveYield: 9.4,
      daysActive: 193,
      compoundingPeriods: 6
    },
    {
      id: 'INT-003',
      loanId: 'LOAN-2024-003',
      borrowerName: 'Coastal Shipping Corp',
      principalAmount: 120000,
      interestRate: 7.8,
      accruedInterest: 18720,
      paidInterest: 15600,
      outstandingInterest: 3120,
      startDate: '2024-01-10',
      maturityDate: '2026-01-10',
      paymentFrequency: 'monthly',
      status: 'active',
      cargoType: 'Industrial Machinery',
      route: {
        origin: 'Houston, TX',
        destination: 'Miami, FL'
      },
      riskCategory: 'medium',
      lastPaymentDate: '2024-07-10',
      nextPaymentDate: '2024-08-10',
      totalExpectedInterest: 37440,
      effectiveYield: 8.1,
      daysActive: 215,
      compoundingPeriods: 7
    },
    {
      id: 'INT-004',
      loanId: 'LOAN-2024-004',
      borrowerName: 'Metro Transport LLC',
      principalAmount: 32000,
      interestRate: 11.2,
      accruedInterest: 5376,
      paidInterest: 3200,
      outstandingInterest: 2176,
      startDate: '2024-03-15',
      maturityDate: '2025-12-15',
      paymentFrequency: 'monthly',
      status: 'overdue',
      cargoType: 'Perishable Goods',
      route: {
        origin: 'Phoenix, AZ',
        destination: 'Denver, CO'
      },
      riskCategory: 'high',
      lastPaymentDate: '2024-06-15',
      nextPaymentDate: '2024-07-15',
      totalExpectedInterest: 21504,
      effectiveYield: 10.8,
      daysActive: 150,
      compoundingPeriods: 5
    },
    {
      id: 'INT-005',
      loanId: 'LOAN-2024-005',
      borrowerName: 'Alpine Logistics Group',
      principalAmount: 85000,
      interestRate: 12.1,
      accruedInterest: 12750,
      paidInterest: 5100,
      outstandingInterest: 7650,
      startDate: '2024-02-20',
      maturityDate: '2025-11-20',
      paymentFrequency: 'monthly',
      status: 'overdue',
      cargoType: 'Chemicals',
      route: {
        origin: 'Atlanta, GA',
        destination: 'Chicago, IL'
      },
      riskCategory: 'high',
      lastPaymentDate: '2024-05-20',
      nextPaymentDate: '2024-06-20',
      totalExpectedInterest: 41140,
      effectiveYield: 11.5,
      daysActive: 174,
      compoundingPeriods: 6
    },
    {
      id: 'INT-006',
      loanId: 'LOAN-2024-006',
      borrowerName: 'Swift Cargo Inc',
      principalAmount: 55000,
      interestRate: 9.8,
      accruedInterest: 7150,
      paidInterest: 7150,
      outstandingInterest: 0,
      startDate: '2023-12-01',
      maturityDate: '2024-06-01',
      paymentFrequency: 'monthly',
      status: 'paid',
      cargoType: 'Consumer Goods',
      route: {
        origin: 'Portland, OR',
        destination: 'Las Vegas, NV'
      },
      riskCategory: 'low',
      lastPaymentDate: '2024-06-01',
      nextPaymentDate: '2024-06-01',
      totalExpectedInterest: 7150,
      effectiveYield: 9.8,
      daysActive: 183,
      compoundingPeriods: 6
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('interestRate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedLoan, setSelectedLoan] = useState<InterestEarning | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [timeframe, setTimeframe] = useState<string>('current');

  // Calculate interest metrics
  const interestMetrics: InterestMetrics = useMemo(() => {
    const totalInterestEarned = interestData.reduce((sum, loan) => sum + loan.paidInterest, 0);
    const totalAccruedInterest = interestData.reduce((sum, loan) => sum + loan.accruedInterest, 0);
    const totalOutstandingInterest = interestData.reduce((sum, loan) => sum + loan.outstandingInterest, 0);
    
    const totalPrincipal = interestData.reduce((sum, loan) => sum + loan.principalAmount, 0);
    const weightedAverageRate = interestData.reduce((sum, loan) => 
      sum + (loan.interestRate * loan.principalAmount), 0) / totalPrincipal;
    
    const weightedAverageYield = interestData.reduce((sum, loan) => 
      sum + (loan.effectiveYield * loan.principalAmount), 0) / totalPrincipal;
    
    const monthlyInterestIncome = totalInterestEarned / 8; // Assuming 8 months of data
    const interestGrowthRate = 8.3; // Mock growth rate
    
    const collectionEfficiency = (totalInterestEarned / totalAccruedInterest) * 100;

    return {
      totalInterestEarned,
      totalAccruedInterest,
      totalOutstandingInterest,
      averageInterestRate: weightedAverageRate,
      weightedAverageYield,
      monthlyInterestIncome,
      interestGrowthRate,
      collectionEfficiency
    };
  }, [interestData]);

  // Rate analysis by risk category
  const rateAnalysis: RateAnalysis[] = useMemo(() => {
    const categories = ['low', 'medium', 'high'];
    return categories.map(category => {
      const loans = interestData.filter(loan => loan.riskCategory === category);
      const averageRate = loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length;
      const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principalAmount, 0);
      const totalInterest = loans.reduce((sum, loan) => sum + loan.paidInterest, 0);
      const performanceRatio = totalInterest / (totalPrincipal * (averageRate / 100));
      
      return {
        riskCategory: category,
        averageRate: averageRate || 0,
        loanCount: loans.length,
        totalPrincipal,
        totalInterest,
        performanceRatio: performanceRatio || 0
      };
    });
  }, [interestData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = interestData.filter(loan => {
      const matchesSearch = 
        loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.cargoType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || loan.riskCategory === riskFilter;
      
      return matchesSearch && matchesStatus && matchesRisk;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof InterestEarning];
      let bValue: any = b[sortField as keyof InterestEarning];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [interestData, searchTerm, statusFilter, riskFilter, sortField, sortDirection]);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'defaulted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheckCircle className="text-green-500" />;
      case 'paid': return <FaMoneyBillWave className="text-blue-500" />;
      case 'overdue': return <FaExclamationTriangle className="text-red-500" />;
      case 'defaulted': return <FaTimesCircle className="text-gray-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewDetails = (loan: InterestEarning) => {
    setSelectedLoan(loan);
    setShowDetails(true);
  };

  const handleExport = () => {
    const csvContent = [
      'Loan ID,Borrower,Principal,Interest Rate,Accrued Interest,Paid Interest,Outstanding Interest,Status',
      ...filteredData.map(loan => 
        `${loan.loanId},${loan.borrowerName},${loan.principalAmount},${loan.interestRate}%,${loan.accruedInterest},${loan.paidInterest},${loan.outstandingInterest},${loan.status}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'interest-tracking-report.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Interest Tracking & Revenue</h1>
              <p className="text-gray-600">Monitor interest earnings, rates, and revenue performance across your lending portfolio</p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="current">Current Period</option>
                <option value="ytd">Year to Date</option>
                <option value="12months">Last 12 Months</option>
                <option value="custom">Custom Range</option>
              </select>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaDownload className="h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Interest Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interest Earned</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(interestMetrics.totalInterestEarned)}</p>
                <div className="flex items-center mt-2">
                  <FaArrowUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 text-sm">+{interestMetrics.interestGrowthRate}%</span>
                  <span className="text-gray-500 text-sm ml-1">vs last period</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaDollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weighted Avg Rate</p>
                <p className="text-2xl font-bold text-blue-600">{formatPercentage(interestMetrics.averageInterestRate)}</p>
                <div className="flex items-center mt-2">
                  <span className="text-gray-600 text-sm">Effective: {formatPercentage(interestMetrics.weightedAverageYield)}</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaPercent className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding Interest</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(interestMetrics.totalOutstandingInterest)}</p>
                <div className="flex items-center mt-2">
                  <span className="text-gray-600 text-sm">Accrued: {formatCurrency(interestMetrics.totalAccruedInterest)}</span>
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
                <p className="text-sm font-medium text-gray-600">Collection Efficiency</p>
                <p className="text-2xl font-bold text-purple-600">{formatPercentage(interestMetrics.collectionEfficiency)}</p>
                <div className="flex items-center mt-2">
                  <span className="text-gray-600 text-sm">Monthly: {formatCurrency(interestMetrics.monthlyInterestIncome)}</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Interest Analysis Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Rate Analysis by Risk Category */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaChartBar className="h-5 w-5 text-blue-600 mr-2" />
              Rate Analysis by Risk Category
            </h3>
            <div className="space-y-4">
              {rateAnalysis.map((analysis, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">{analysis.riskCategory} Risk</h4>
                      <p className="text-sm text-gray-600">{analysis.loanCount} loans</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatPercentage(analysis.averageRate)}</p>
                      <p className="text-sm text-gray-600">avg rate</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                      <div 
                        className={`h-3 rounded-full ${
                          analysis.riskCategory === 'low' ? 'bg-green-600' :
                          analysis.riskCategory === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${(analysis.averageRate / 15) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {formatCurrency(analysis.totalInterest)} earned
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Performance Ratio: {analysis.performanceRatio.toFixed(2)}x
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interest Revenue Trend */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaChartLine className="h-5 w-5 text-green-600 mr-2" />
              Monthly Interest Revenue Trend
            </h3>
            <div className="h-64 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4">
              {/* Simple trend visualization */}
              <div className="h-full flex items-end justify-between">
                {[3200, 3800, 4100, 3900, 4500, 4800, 5200, 5600].map((amount, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-8 bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all duration-300 hover:from-green-700 hover:to-green-500"
                      style={{ height: `${(amount / 5600) * 200}px` }}
                    />
                    <span className="text-xs text-gray-600 mt-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][index]}
                    </span>
                    <span className="text-xs text-gray-500">
                      ${(amount / 1000).toFixed(1)}K
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm">
              <span className="text-gray-600">Growth Rate: +{interestMetrics.interestGrowthRate}%</span>
              <span className="text-green-600 font-medium">↗ Trending Up</span>
            </div>
          </div>
        </div>

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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="defaulted">Defaulted</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interest Tracking Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan & Borrower
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('interestRate')}
                  >
                    Interest Rate
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('accruedInterest')}
                  >
                    Interest Amounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Risk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <FaUser className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{loan.borrowerName}</div>
                          <div className="text-sm text-gray-500">{loan.loanId}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(loan.principalAmount)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-blue-600">{formatPercentage(loan.interestRate)}</div>
                      <div className="text-sm text-gray-500">
                        Effective: {formatPercentage(loan.effectiveYield)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {loan.paymentFrequency} payments
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Accrued: <span className="font-medium">{formatCurrency(loan.accruedInterest)}</span>
                        </div>
                        <div className="text-green-600">
                          Paid: <span className="font-medium">{formatCurrency(loan.paidInterest)}</span>
                        </div>
                        <div className="text-orange-600">
                          Outstanding: <span className="font-medium">{formatCurrency(loan.outstandingInterest)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900 flex items-center">
                          <FaCalendarAlt className="h-3 w-3 text-gray-400 mr-1" />
                          Next: {new Date(loan.nextPaymentDate).toLocaleDateString()}
                        </div>
                        {loan.lastPaymentDate && (
                          <div className="text-gray-500 mt-1">
                            Last: {new Date(loan.lastPaymentDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="text-gray-500 mt-1">
                          Maturity: {new Date(loan.maturityDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(loan.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                          {loan.status.toUpperCase()}
                        </span>
                      </div>
                      <div className={`text-xs font-medium ${getRiskColor(loan.riskCategory)}`}>
                        {loan.riskCategory.toUpperCase()} RISK
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Collection: {((loan.paidInterest / loan.accruedInterest) * 100).toFixed(1)}%
                        </div>
                        <div className="text-gray-500">
                          Days Active: {loan.daysActive}
                        </div>
                        <div className="text-gray-500">
                          Periods: {loan.compoundingPeriods}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(loan)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <FaEye className="h-4 w-4" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <FaFileInvoiceDollar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No interest records found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </div>

        {/* Interest Details Modal */}
        {showDetails && selectedLoan && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Interest Details - {selectedLoan.loanId}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loan Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Loan Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Borrower:</span>
                        <span className="font-medium">{selectedLoan.borrowerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Principal Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.principalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cargo Type:</span>
                        <span className="font-medium">{selectedLoan.cargoType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Route:</span>
                        <span className="font-medium text-sm">{selectedLoan.route.origin} → {selectedLoan.route.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Interest Calculations</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-medium text-blue-600">{formatPercentage(selectedLoan.interestRate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Effective Yield:</span>
                        <span className="font-medium text-blue-600">{formatPercentage(selectedLoan.effectiveYield)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Expected:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.totalExpectedInterest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Frequency:</span>
                        <span className="font-medium capitalize">{selectedLoan.paymentFrequency}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interest Performance */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Interest Performance</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accrued Interest:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.accruedInterest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid Interest:</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedLoan.paidInterest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Outstanding:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(selectedLoan.outstandingInterest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Collection Rate:</span>
                        <span className="font-medium">{((selectedLoan.paidInterest / selectedLoan.accruedInterest) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Timeline</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="font-medium">{new Date(selectedLoan.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Maturity Date:</span>
                        <span className="font-medium">{new Date(selectedLoan.maturityDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Days Active:</span>
                        <span className="font-medium">{selectedLoan.daysActive} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Payment:</span>
                        <span className="font-medium">{new Date(selectedLoan.nextPaymentDate).toLocaleDateString()}</span>
                      </div>
                    </div>
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
                  Generate Statement
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Send Reminder
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterestTrackingPage;
