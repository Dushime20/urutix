import React, { useState } from 'react';
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

const FinancialReportsPage: React.FC = () => {
  const [loading] = useState(false);

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

  const [recentReports] = useState<GeneratedReport[]>([
    {
      id: 'RPT-7701',
      templateId: 'portfolio-summary',
      name: 'Financial Health - Aug 2024',
      category: 'portfolio',
      generatedAt: '2024-08-10T14:30:00',
      generatedBy: 'System Admin',
      format: 'pdf',
      size: '2.4 MB',
      status: 'completed'
    },
    {
      id: 'RPT-8842',
      templateId: 'risk-assessment',
      name: 'Weekly Risk Matrix - Q3',
      category: 'risk',
      generatedAt: '2024-08-11T09:15:00',
      generatedBy: 'Risk Lab',
      format: 'pdf',
      size: '3.1 MB',
      status: 'completed'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Audit & Intelligence</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Global reporting hub for portfolio performance and compliance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100">
              <FilePlus size={14} /> Custom Builder
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <RotateCcw size={14} /> Refresh Node
            </button>
          </div>
        </div>

        <FinancialReportsEnlite
          loading={loading}
          templates={templates}
          recentReports={recentReports}
          onGenerate={(t) => alert(`Executing generation for ${t.name}...`)}
          onViewDetails={(t) => alert(`Opening parameters for ${t.id}...`)}
          onDownload={(r) => alert(`Downloading archive ${r.id}...`)}
        />
      </div>
    </div>
  );
};

export default FinancialReportsPage;
