import React, { useState } from 'react';
import {
  FaDownload, FaFilter, FaChartBar, FaFileAlt, FaDollarSign,
  FaShieldAlt, FaExclamationTriangle,
} from 'react-icons/fa';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { StandardDataTable, type Column } from '../EnliteUI/Tables';

interface ClaimSummaryRow {
  type: string;
  count: number;
  amount: number;
  avgAmount: number;
}

const InsuranceReports: React.FC = () => {
  const [reportType, setReportType] = useState('premium');
  const [dateRange, setDateRange] = useState('6months');
  const [showFilters, setShowFilters] = useState(false);

  const premiumData = [
    { month: 'Jan', premium: 4500, claims: 1200, netCost: 3300 },
    { month: 'Feb', premium: 4800, claims: 800, netCost: 4000 },
    { month: 'Mar', premium: 5200, claims: 1500, netCost: 3700 },
    { month: 'Apr', premium: 4900, claims: 900, netCost: 4000 },
    { month: 'May', premium: 5100, claims: 1100, netCost: 4000 },
    { month: 'Jun', premium: 5400, claims: 1300, netCost: 4100 },
  ];

  const claimsData: ClaimSummaryRow[] = [
    { type: 'Collision', count: 12, amount: 45000, avgAmount: 3750 },
    { type: 'Cargo Damage', count: 8, amount: 28000, avgAmount: 3500 },
    { type: 'Theft', count: 3, amount: 135000, avgAmount: 45000 },
    { type: 'Weather', count: 5, amount: 15000, avgAmount: 3000 },
    { type: 'Liability', count: 6, amount: 32000, avgAmount: 5333 },
  ];

  const coverageData = [
    { name: 'Liability', value: 40, color: '#3B82F6' },
    { name: 'Collision', value: 25, color: '#10B981' },
    { name: 'Comprehensive', value: 20, color: '#F59E0B' },
    { name: 'Cargo', value: 15, color: '#8B5CF6' },
  ];

  const riskAnalysisData = [
    { risk: 'High Risk', policies: 3, percentage: 15, color: '#EF4444' },
    { risk: 'Medium Risk', policies: 8, percentage: 40, color: '#F59E0B' },
    { risk: 'Low Risk', policies: 9, percentage: 45, color: '#10B981' },
  ];

  const generateReport = () => {
    console.log('Generating report:', { reportType, dateRange });
  };

  const downloadReport = (format: string) => {
    console.log('Downloading report in', format, 'format');
  };

  const claimsColumns: Column<ClaimSummaryRow>[] = [
    {
      key: 'type',
      label: 'Claim Type',
      alwaysVisible: true,
      render: (value) => <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{value}</span>,
    },
    {
      key: 'count',
      label: 'Count',
      render: (value) => <span className="text-sm text-gray-500">{value}</span>,
    },
    {
      key: 'amount',
      label: 'Total Amount',
      render: (value) => <span className="text-sm text-gray-500">${Number(value).toLocaleString()}</span>,
    },
    {
      key: 'avgAmount',
      label: 'Average Amount',
      render: (value) => <span className="text-sm text-gray-500">${Number(value).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insurance Reports</h1>
          <p className="text-gray-600 dark:text-slate-300">Comprehensive insurance analytics and reporting</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <FaFilter className="mr-2" />
            Filters
          </button>

          <button
            onClick={generateReport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <FaChartBar className="mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="premium">Premium Analysis</option>
                <option value="claims">Claims Analysis</option>
                <option value="coverage">Coverage Analysis</option>
                <option value="risk">Risk Assessment</option>
                <option value="comprehensive">Comprehensive Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['premium', 'claims', 'coverage', 'risk'].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                reportType === type
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Reports
            </button>
          ))}
        </nav>
      </div>

      {reportType === 'premium' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Premium vs Claims Trend</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadReport('pdf')}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  <FaDownload className="inline mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => downloadReport('excel')}
                  className="text-green-600 hover:text-green-900 text-sm"
                >
                  <FaDownload className="inline mr-1" />
                  Excel
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={premiumData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="premium" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Premium" />
                <Area type="monotone" dataKey="claims" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Claims" />
                <Line type="monotone" dataKey="netCost" stroke="#10B981" strokeWidth={3} name="Net Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
              <div className="flex items-center">
                <FaDollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Premium</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${premiumData.reduce((sum, p) => sum + p.premium, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
              <div className="flex items-center">
                <FaExclamationTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Claims</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${premiumData.reduce((sum, p) => sum + p.claims, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
              <div className="flex items-center">
                <FaShieldAlt className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Net Cost</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${premiumData.reduce((sum, p) => sum + p.netCost, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
              <div className="flex items-center">
                <FaChartBar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Monthly</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${Math.round(premiumData.reduce((sum, p) => sum + p.premium, 0) / premiumData.length).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'claims' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Claims by Type</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadReport('pdf')}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  <FaDownload className="inline mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => downloadReport('excel')}
                  className="text-green-600 hover:text-green-900 text-sm"
                >
                  <FaDownload className="inline mr-1" />
                  Excel
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={claimsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Claim Count" />
                <Bar yAxisId="right" dataKey="amount" fill="#10B981" name="Claim Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <StandardDataTable
            title="Claims Summary"
            icon={<FaFileAlt className="w-5 h-5" />}
            headerColor="primary"
            columns={claimsColumns}
            data={claimsData}
            getRowId={(row) => row.type}
            searchPlaceholder="Search claim types..."
            searchKeys={['type']}
            pagination={false}
            columnVisibility={false}
            emptyMessage="No claims summary data"
            onExport={() => downloadReport('excel')}
            exportLabel="Export"
            ariaLabel="Claims summary"
          />
        </div>
      )}

      {reportType === 'coverage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coverage Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={coverageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {coverageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coverage Details</h3>
              <div className="space-y-4">
                {coverageData.map((coverage) => (
                  <div key={coverage.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: coverage.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{coverage.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{coverage.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'risk' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Assessment</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={riskAnalysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="risk" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="policies" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {riskAnalysisData.map((risk) => (
              <div key={risk.risk} className="bg-white dark:bg-slate-900 rounded-lg border p-6">
                <div className="flex items-center">
                  <div
                    className="w-8 h-8 rounded-full mr-4"
                    style={{ backgroundColor: risk.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-500">{risk.risk}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{risk.policies}</p>
                    <p className="text-xs text-gray-400">{risk.percentage}% of total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-lg border p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Download Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => downloadReport('pdf')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <FaFileAlt className="h-6 w-6 text-red-400 mr-2" />
            <span className="text-gray-600 dark:text-slate-300">PDF Report</span>
          </button>

          <button
            onClick={() => downloadReport('excel')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <FaChartBar className="h-6 w-6 text-green-400 mr-2" />
            <span className="text-gray-600 dark:text-slate-300">Excel Report</span>
          </button>

          <button
            onClick={() => downloadReport('csv')}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <FaDownload className="h-6 w-6 text-blue-400 mr-2" />
            <span className="text-gray-600 dark:text-slate-300">CSV Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsuranceReports;
