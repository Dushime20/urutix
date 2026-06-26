import React, { useState } from 'react';
import { FaFileDownload, FaFileExcel, FaFilePdf, FaFileCsv } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
const OperationalAdminReports: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('operations');
  const [dateRange, setDateRange] = useState('30d');
  const [format, setFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');

  const handleDownload = async () => {
    if (!user?.tenantId) {
      toast.error('Tenant context missing');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Generating report...', { id: 'report-toast' });
      
      let data: any;
      if (reportType === 'operations' || reportType === 'fleet') {
        data = await operationalAdminApi.getAnalyticsOverview();
      } else if (reportType === 'financial') {
        data = await operationalAdminApi.getFinancials();
      } else {
        data = await operationalAdminApi.getAudit();
      }

      // Convert data to JSON string as a basic fallback for CSV/Export format since there is no direct export endpoint
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tenant_report_${reportType}_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      toast.success('Report downloaded successfully', { id: 'report-toast' });
    } catch (error: any) {
      toast.error(getApiErrorMessage(error), { id: 'report-toast' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperationalPageLayout
      title="Reports"
      description="Generate and download customized operational reports"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
              <FaFileDownload size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Export Configuration</h2>
              <p className="text-sm text-gray-500 mt-1">Select the parameters for your data export</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Report Data Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 transition-colors"
              >
                <option value="operations">Operations & Trips</option>
                <option value="financial">Financial Transactions</option>
                <option value="fleet">Fleet Utilization</option>
                <option value="activity">User Activity Logs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Time Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary-500 transition-colors"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Export Format</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setFormat('csv')}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${
                    format === 'csv' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-primary-200'
                  }`}
                >
                  <FaFileCsv size={28} />
                  <span className="font-semibold text-sm">CSV Data</span>
                </button>
                <button
                  onClick={() => setFormat('excel')}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${
                    format === 'excel' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600' : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-green-200'
                  }`}
                >
                  <FaFileExcel size={28} />
                  <span className="font-semibold text-sm">Excel Sheet</span>
                </button>
                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${
                    format === 'pdf' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600' : 'border-gray-200 dark:border-slate-700 text-gray-500 hover:border-red-200'
                  }`}
                >
                  <FaFilePdf size={28} />
                  <span className="font-semibold text-sm">PDF Document</span>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={handleDownload}
                disabled={loading}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">Generating Report...</span>
                ) : (
                  <>
                    <FaFileDownload />
                    Generate & Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </OperationalPageLayout>
  );
};

export default OperationalAdminReports;
