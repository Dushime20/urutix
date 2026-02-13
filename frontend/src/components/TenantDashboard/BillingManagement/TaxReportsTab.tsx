import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaChartPie, FaDownload, FaPlus, FaFileAlt, FaCheckCircle, FaClock
} from 'react-icons/fa';
import { billingApi, type TaxReport } from '../../../services/billingApi';

interface TaxReportsTabProps {
  tenantId: string;
}

const TaxReportsTab: React.FC<TaxReportsTabProps> = ({ tenantId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Q4 2023');

  const { data: taxReportsData, isLoading } = useQuery({
    queryKey: ['tax-reports'],
    queryFn: () => billingApi.getTaxReports()
  });

  const reports = taxReportsData?.data || [];

  const handleExport = async (reportId: string, format: 'csv' | 'excel' | 'pdf') => {
    try {
      const blob = await billingApi.exportTaxReport(reportId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-report-${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', icon: FaFileAlt },
      filed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaClock },
      paid: { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheckCircle }
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700 font-medium">Total Revenue</p>
            <FaChartPie className="text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">$125,000</p>
          <p className="text-xs text-blue-600 mt-1">Q4 2023</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-purple-700 font-medium">Total Expenses</p>
            <FaChartPie className="text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">$45,000</p>
          <p className="text-xs text-purple-600 mt-1">Q4 2023</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700 font-medium">Taxable Income</p>
            <FaChartPie className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">$80,000</p>
          <p className="text-xs text-green-600 mt-1">Q4 2023</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-red-700 font-medium">Tax Amount</p>
            <FaChartPie className="text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-900">$16,000</p>
          <p className="text-xs text-red-600 mt-1">20% rate</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="Q1 2024">Q1 2024</option>
            <option value="Q4 2023">Q4 2023</option>
            <option value="Q3 2023">Q3 2023</option>
            <option value="Q2 2023">Q2 2023</option>
            <option value="Q1 2023">Q1 2023</option>
          </select>
        </div>

        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <FaPlus className="mr-2" />
          Generate Report
        </button>
      </div>

      {/* Tax Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FaChartPie className="mx-auto text-4xl text-gray-400 mb-3" />
          <p className="text-gray-600">No tax reports found</p>
          <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Generate Your First Report
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expenses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxable Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => {
                  const statusBadge = getStatusBadge(report.status);
                  const StatusIcon = statusBadge.icon;
                  
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.period}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(report.startDate).toLocaleDateString()} -{' '}
                          {new Date(report.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${report.totalRevenue.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${report.totalExpenses.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ${report.taxableIncome.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-red-600">
                          ${report.taxAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">{report.taxRate}% rate</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                          <StatusIcon className="mr-1" />
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleExport(report.id, 'pdf')}
                            className="text-red-600 hover:text-red-900"
                            title="Export PDF"
                          >
                            <FaDownload />
                          </button>
                          <button
                            onClick={() => handleExport(report.id, 'excel')}
                            className="text-green-600 hover:text-green-900"
                            title="Export Excel"
                          >
                            <FaDownload />
                          </button>
                          <button
                            onClick={() => handleExport(report.id, 'csv')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Export CSV"
                          >
                            <FaDownload />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tax Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tax Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Tax ID:</p>
            <p className="font-semibold text-gray-900">XX-XXXXXXX</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Tax Year:</p>
            <p className="font-semibold text-gray-900">2023</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Filing Status:</p>
            <p className="font-semibold text-gray-900">Business Entity</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Next Filing Date:</p>
            <p className="font-semibold text-gray-900">April 15, 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxReportsTab;
