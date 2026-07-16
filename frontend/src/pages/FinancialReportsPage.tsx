import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  PieChart,
  DollarSign,
  Users,
  Shield,
  RotateCcw,
  FilePlus,
  AlertCircle,
} from 'lucide-react';
import FinancialReportsEnlite, { type ReportTemplate, type GeneratedReport } from '../components/LenderDashboard/FinancialReports.enlite';
import { financialReportsApi } from '../services/financialReportsApi';

const FinancialReportsPage: React.FC = () => {
  const {
    data: reportsData,
    isLoading: reportsLoading,
    isError: reportsError,
    error: reportsErr,
    refetch,
  } = useQuery({
    queryKey: ['financial-reports'],
    queryFn: () => financialReportsApi.getFinancialReports({ limit: 10 }),
    retry: 1,
  });

  const {
    data: templatesData,
    isLoading: templatesLoading,
    isError: templatesError,
  } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => financialReportsApi.getReportTemplates(),
    retry: 1,
  });

  const loading = reportsLoading || templatesLoading;

  const templates: ReportTemplate[] = (templatesData?.templates || []).map(template => ({
    ...template,
    icon: getIconForCategory(template.category),
  }));

  function getIconForCategory(category: string) {
    switch (category) {
      case 'portfolio':
        return <PieChart size={18} />;
      case 'financial':
        return <DollarSign size={18} />;
      case 'risk':
        return <Shield size={18} />;
      case 'performance':
        return <Users size={18} />;
      default:
        return <FileText size={18} />;
    }
  }

  const recentReports: GeneratedReport[] = (reportsData?.reports || []).map(report => {
    const payloadSize = report.data
      ? `${(JSON.stringify(report.data).length / 1024).toFixed(1)} KB`
      : '—';

    return {
      id: report.id,
      templateId: report.type,
      name: `${report.type.replace(/_/g, ' ').toUpperCase()} — ${new Date(report.startDate).toLocaleDateString()}`,
      category: getCategoryFromType(report.type),
      generatedAt: report.createdAt || report.generatedAt || new Date().toISOString(),
      generatedBy: report.generatedBy || 'System',
      format: report.format || 'json',
      size: payloadSize,
      status: 'completed' as const,
    };
  });

  function getCategoryFromType(type: string): string {
    if (type.includes('portfolio')) return 'portfolio';
    if (type.includes('pl') || type.includes('cash') || type.includes('balance') || type.includes('revenue') || type.includes('expense') || type.includes('profit')) {
      return 'financial';
    }
    if (type.includes('risk')) return 'risk';
    return 'performance';
  }

  const handleGenerateReport = async (template: ReportTemplate) => {
    try {
      const endDate = new Date();
      const startDate = new Date();

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

      await refetch();
      alert(`Report "${template.name}" generated successfully!`);
    } catch (error: any) {
      console.error('Error generating report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate report. Please try again.';
      alert(Array.isArray(message) ? message.join(', ') : message);
    }
  };

  const handleDownloadReport = async (report: GeneratedReport) => {
    try {
      const blob = await financialReportsApi.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name.replace(/[^a-z0-9-_]+/gi, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  if (reportsError || templatesError) {
    const errMsg =
      (reportsErr as any)?.response?.data?.message ||
      (reportsErr as any)?.message ||
      'Unable to load financial reports from the server.';

    return (
      <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
        <div className="max-w-xl mx-auto mt-20 bg-white border border-rose-100 rounded-3xl p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto text-rose-500 mb-4" size={36} />
          <h2 className="text-lg font-black uppercase text-slate-900 tracking-tight">
            Reports unavailable
          </h2>
          <p className="text-sm text-slate-500 mt-2">{errMsg}</p>
          <button
            onClick={() => refetch()}
            className="mt-6 px-4 py-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Financial Reports</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Generate and review reports from live financial data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const first = templates[0];
                if (first) handleGenerateReport(first);
              }}
              disabled={!templates.length}
              className="px-4 py-2 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              <FilePlus size={14} /> Generate Report
            </button>
            <button
              type="button"
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
          onViewDetails={(t) =>
            alert(
              `${t.name}\n\n${t.description}\n\nData points: ${(t.dataPoints || []).join(', ') || 'N/A'}`,
            )
          }
          onDownload={handleDownloadReport}
        />
      </div>
    </div>
  );
};

export default FinancialReportsPage;
