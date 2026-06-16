import React, { useState, useEffect } from 'react';
import { 
  FaDownload, FaPrint, FaEye, FaCalendar, FaFilter, FaChartLine, FaDollarSign,
  FaReceipt, FaTruck, FaUserTie, FaGasPump, FaTools, FaRoad, FaShieldAlt,
  FaUniversity, FaFileAlt, FaFileInvoice, FaChartBar, FaCalculator
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
interface FinancialReport {
  id: string;
  type: 'profit_loss' | 'cash_flow' | 'tax_summary' | 'expense_analysis' | 'revenue_analysis';
  title: string;
  period: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  status: 'draft' | 'final' | 'archived';
  data: any;
}

interface ProfitLossData {
  revenue: {
    tripRevenue: number;
    otherRevenue: number;
    totalRevenue: number;
  };
  expenses: {
    fuel: number;
    maintenance: number;
    tolls: number;
    driver: number;
    insurance: number;
    taxes: number;
    other: number;
    totalExpenses: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

interface CashFlowData {
  operatingActivities: {
    netIncome: number;
    depreciation: number;
    changesInWorkingCapital: number;
    netOperatingCashFlow: number;
  };
  investingActivities: {
    vehiclePurchases: number;
    equipmentPurchases: number;
    netInvestingCashFlow: number;
  };
  financingActivities: {
    loans: number;
    repayments: number;
    netFinancingCashFlow: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

const FinancialReports: React.FC = () => {
  const { format: formatCurrency, compact: fmtMoney, compactIn: fmtIn } = useCurrencyFormat();
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    period: '',
    status: ''
  });

  // Mock data - replace with API calls
  useEffect(() => {
    setReports([
      {
        id: '1',
        type: 'profit_loss',
        title: 'Profit & Loss Statement',
        period: 'Q3 2024',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        generatedAt: '2024-10-01T10:00:00Z',
        status: 'final',
        data: {
          revenue: {
            tripRevenue: 45000,
            otherRevenue: 2500,
            totalRevenue: 47500
          },
          expenses: {
            fuel: 8500,
            maintenance: 3200,
            tolls: 1200,
            driver: 18000,
            insurance: 2400,
            taxes: 3600,
            other: 1800,
            totalExpenses: 38700
          },
          grossProfit: 8800,
          netProfit: 7200,
          profitMargin: 15.2
        }
      },
      {
        id: '2',
        type: 'cash_flow',
        title: 'Cash Flow Statement',
        period: 'Q3 2024',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        generatedAt: '2024-10-01T10:00:00Z',
        status: 'final',
        data: {
          operatingActivities: {
            netIncome: 7200,
            depreciation: 1800,
            changesInWorkingCapital: -1200,
            netOperatingCashFlow: 7800
          },
          investingActivities: {
            vehiclePurchases: -15000,
            equipmentPurchases: -3000,
            netInvestingCashFlow: -18000
          },
          financingActivities: {
            loans: 12000,
            repayments: -2000,
            netFinancingCashFlow: 10000
          },
          netCashFlow: -200,
          beginningCash: 8500,
          endingCash: 8300
        }
      },
      {
        id: '3',
        type: 'tax_summary',
        title: 'Tax Deductible Summary',
        period: 'Q3 2024',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        generatedAt: '2024-10-01T10:00:00Z',
        status: 'final',
        data: {
          totalExpenses: 38700,
          taxDeductibleExpenses: 32100,
          nonDeductibleExpenses: 6600,
          deductionPercentage: 83.0
        }
      }
    ]);
  }, []);

  const reportTypes = [
    { value: 'profit_loss', label: 'Profit & Loss', icon: FaChartLine, color: 'text-green-600' },
    { value: 'cash_flow', label: 'Cash Flow', icon: FaDollarSign, color: 'text-blue-600' },
    { value: 'tax_summary', label: 'Tax Summary', icon: FaUniversity, color: 'text-purple-600' },
    { value: 'expense_analysis', label: 'Expense Analysis', icon: FaReceipt, color: 'text-red-600' },
    { value: 'revenue_analysis', label: 'Revenue Analysis', icon: FaTruck, color: 'text-indigo-600' }
  ];

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const getReportTypeIcon = (type: string) => {
    const reportType = reportTypes.find(rt => rt.value === type);
    return reportType ? reportType.icon : FaFileAlt;
  };

  const getReportTypeColor = (type: string) => {
    const reportType = reportTypes.find(rt => rt.value === type);
    return reportType ? reportType.color : 'text-gray-600';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'text-yellow-600 bg-yellow-100',
      final: 'text-green-600 bg-green-100',
      archived: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  // formatCurrency provided by useCurrencyFormat hook

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesType = !filters.type || report.type === filters.type;
    const matchesPeriod = !filters.period || report.period.toLowerCase().includes(filters.period.toLowerCase());
    const matchesStatus = !filters.status || report.status === filters.status;
    
    return matchesType && matchesPeriod && matchesStatus;
  });

  const generateReport = (type: string) => {
    // This would trigger API call to generate new report
    console.log(`Generating ${type} report...`);
  };

  const renderProfitLossReport = (data: ProfitLossData) => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Trip Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.revenue.tripRevenue)}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Other Revenue</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.revenue.otherRevenue)}</p>
          </div>
          <div className="text-center p-4 bg-green-100 rounded-lg">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(data.revenue.totalRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Fuel</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(data.expenses.fuel)}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600">Maintenance</p>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(data.expenses.maintenance)}</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Driver</p>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(data.expenses.driver)}</p>
          </div>
          <div className="text-center p-4 bg-red-100 rounded-lg">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(data.expenses.totalExpenses)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Gross Profit</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.grossProfit)}</p>
          </div>
          <div className="text-center p-4 bg-green-100 rounded-lg">
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(data.netProfit)}</p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-gray-600">Profit Margin</p>
            <p className="text-2xl font-bold text-indigo-600">{data.profitMargin.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCashFlowReport = (data: CashFlowData) => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Activities</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Net Income</span>
            <span className="font-semibold">{formatCurrency(data.operatingActivities.netIncome)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Depreciation</span>
            <span className="font-semibold">{formatCurrency(data.operatingActivities.depreciation)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Changes in Working Capital</span>
            <span className="font-semibold">{formatCurrency(data.operatingActivities.changesInWorkingCapital)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-900">Net Operating Cash Flow</span>
            <span className="font-bold text-green-600">{formatCurrency(data.operatingActivities.netOperatingCashFlow)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Cash Flow Chart</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { category: 'Operating', value: data.operatingActivities.netOperatingCashFlow, color: '#10B981' },
                { category: 'Investing', value: data.investingActivities.netInvestingCashFlow, color: '#EF4444' },
                { category: 'Financing', value: data.financingActivities.netFinancingCashFlow, color: '#3B82F6' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Beginning Cash</span>
              <span className="font-semibold">{formatCurrency(data.beginningCash)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Net Cash Flow</span>
              <span className={`font-semibold ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.netCashFlow)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Ending Cash</span>
              <span className="font-bold">{formatCurrency(data.endingCash)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaxSummaryReport = (data: any) => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Deductible Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Tax Deductible Expenses</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(data.taxDeductibleExpenses)}</p>
              <p className="text-sm text-gray-500 mt-1">{data.deductionPercentage.toFixed(1)}% of total expenses</p>
            </div>
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Non-Deductible Expenses</p>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(data.nonDeductibleExpenses)}</p>
              <p className="text-sm text-gray-500 mt-1">{(100 - data.deductionPercentage).toFixed(1)}% of total expenses</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Deduction Breakdown</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Deductible', value: data.taxDeductibleExpenses, color: '#10B981' },
                    { name: 'Non-Deductible', value: data.nonDeductibleExpenses, color: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportContent = (report: FinancialReport) => {
    switch (report.type) {
      case 'profit_loss':
        return renderProfitLossReport(report.data);
      case 'cash_flow':
        return renderCashFlowReport(report.data);
      case 'tax_summary':
        return renderTaxSummaryReport(report.data);
      default:
        return <div className="text-center py-8 text-gray-500">Report content not available</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-2">Generate and view comprehensive financial reports for your trucking business</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {reportTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => generateReport(type.value)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center"
              >
                <type.icon className={`w-8 h-8 mx-auto mb-2 ${type.color}`} />
                <p className="text-sm font-medium text-gray-900">{type.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={filters.period}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Periods</option>
                {periods.map(period => (
                  <option key={period.value} value={period.value}>{period.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="final">Final</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ type: '', period: '', status: '' })}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Available Reports</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => {
              const IconComponent = getReportTypeIcon(report.type);
              const iconColor = getReportTypeColor(report.type);
              
              return (
                <div key={report.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <IconComponent className={`w-6 h-6 ${iconColor}`} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                        <p className="text-sm text-gray-500">
                          {report.period} • {formatDate(report.startDate)} - {formatDate(report.endDate)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Generated: {formatDate(report.generatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReportViewer(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FaDownload className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <FaPrint className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filters).some(f => f) 
                ? 'Try adjusting your filters.'
                : 'Generate your first financial report to get started.'
              }
            </p>
            {!Object.values(filters).some(f => f) && (
              <div className="mt-6">
                <button
                  onClick={() => generateReport('profit_loss')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <FaCalculator className="-ml-1 mr-2 h-4 w-4" />
                  Generate Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Viewer Modal */}
      {showReportViewer && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedReport.title}</h2>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <FaDownload className="w-4 h-4 inline mr-2" />
                  Download
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  <FaPrint className="w-4 h-4 inline mr-2" />
                  Print
                </button>
                <button
                  onClick={() => setShowReportViewer(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Period:</span> {selectedReport.period}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date Range:</span> {formatDate(selectedReport.startDate)} - {formatDate(selectedReport.endDate)}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Generated:</span> {formatDate(selectedReport.generatedAt)}
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {renderReportContent(selectedReport)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReports;
