import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  FileText,
  Mail,
  Download,
  Settings,
  Play,
  Clock,
  Search,
  Filter,
  Database,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  PieChart,
  DollarSign,
  Users,
  Shield,
  RotateCcw,
  FilePlus
} from 'lucide-react';
import FinancialReportsEnlite, { type ReportTemplate, type GeneratedReport } from '../components/LenderDashboard/FinancialReports.enlite';
import { financialReportsApi } from '../services/financialReportsApi';

const FinancialReportsPage: React.FC = () => {
  // Fetch financial reports from backend
  const { data: reportsData, isLoading: reportsLoading, refetch } = useQuery({
    queryKey: ['financial-reports'],
    queryFn: () => financialReportsApi.getFinancialReports({ limit: 10 }),
  });

  const loading = reportsLoading;

  const [templates] = useState<ReportTemplate[]>([
    {
      id: 'portfolio-summary',
      name: 'Portfolio Summary',
      description: 'Comprehensive overview of loan portfolio performance, active assets, and key metrics.',
      category: 'portfolio',
      type: 'summary',
      frequency: 'on-demand',
      format: 'pdf',
      icon: <PieChart size={18} />,
      estimatedTime: '2m',
      dataPoints: ['Total Value', 'Active Loans', 'Disbursed'],
      isScheduled: true
    },
    {
      id: 'income-statement',
      name: 'P&L Statement',
      description: 'Detailed profit and loss statement showing revenue from interest and fee corridors.',
      category: 'financial',
      type: 'detailed',
      frequency: 'monthly',
      format: 'excel',
      icon: <DollarSign size={18} />,
      estimatedTime: '4m',
      dataPoints: ['Revenue', 'Expenses', 'Net Income'],
      isScheduled: true
    },
    {
      id: 'risk-assessment',
      name: 'Risk Audit',
      description: 'Deep-dive analysis of credit exposure, default patterns, and portfolio risk distribution.',
      category: 'risk',
      type: 'analytical',
      frequency: 'weekly',
      format: 'pdf',
      icon: <Shield size={18} />,
      estimatedTime: '6m',
      dataPoints: ['PD', 'Value at Risk', 'Concentration'],
      isScheduled: true
    },
    {
      id: 'borrower-performance',
      name: 'Entity Registry',
      description: 'Analytical audit of borrower behavior, repayment hygiene, and credit trends.',
      category: 'performance',
      type: 'detailed',
      frequency: 'monthly',
      format: 'excel',
      icon: <Users size={18} />,
      estimatedTime: '3m',
      dataPoints: ['Repayment Rate', 'Credit Score Trends'],
      isScheduled: false
    }
  ]);

  // Map backend reports to GeneratedReport format
  const recentReports: GeneratedReport[] = (reportsData?.reports || []).map(report => ({
    id: report.id,
    templateId: report.type,
    name: `${report.type.replace(/_/g, ' ').toUpperCase()} - ${new Date(report.startDate).toLocaleDateString()}`,
    category: getCategoryFromType(report.type),
    generatedAt: report.createdAt,
    generatedBy: report.generatedBy || 'System',
    format: report.format || 'pdf',
    size: 'N/A',
    status: 'completed' as const,
  }));

  function getCategoryFromType(type: string): string {
    if (type.includes('portfolio')) return 'portfolio';
    if (type.includes('pl') || type.includes('cash') || type.includes('balance')) return 'financial';
    if (type.includes('risk')) return 'risk';
    return 'performance';
  }

  const handleGenerateReport = async (template: ReportTemplate) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // Set date range based on frequency
      switch (template.frequency) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      await financialReportsApi.generateFinancialReport({
        type: template.id,
        period: template.frequency === 'on-demand' ? 'monthly' : template.frequency,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Refetch reports after generation
      refetch();
      alert(`Report "${template.name}" generated successfully!`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleDownloadReport = async (report: GeneratedReport) => {
    try {
      const blob = await financialReportsApi.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Financial Reports</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Manage and view all your financial reports
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100">
              <FilePlus size={14} /> Create Custom
            </button>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <RotateCcw size={14} /> Refresh
            </button>
          </div>
        </div>

        <FinancialReportsEnlite
          loading={loading}
          templates={templates}
          recentReports={recentReports}
          onGenerate={handleGenerateReport}
          onViewDetails={(t) => alert(`Opening parameters for ${t.id}...`)}
          onDownload={handleDownloadReport}
        />
      </div>
    </div>
  );
};

export default FinancialReportsPage;
