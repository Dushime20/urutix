import React, { useState, useMemo } from 'react';
import { 
  FaFileAlt, 
  FaDownload,
  FaCalendarAlt,
  FaFilter,
  FaChartBar,
  FaTable,
  FaEye,
  FaPlay,
  FaCog,
  FaSearch,
  FaDollarSign,
  FaPercent,
  FaUsers,
  FaTruck,
  FaMapMarkerAlt,
  FaClipboardList,
  FaFileExport,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaBalanceScale,
  FaCalculator,
  FaChartLine,
  FaMoneyBillWave,
  FaIndustry,
  FaGlobe,
  FaHistory,
  FaArrowUp,
  FaArrowDown,
  FaPrint,
  FaEnvelope,
  FaCalendar,
  FaSpinner,
  FaDatabase,
  FaChartPie,
  FaFileInvoiceDollar
} from 'react-icons/fa';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'portfolio' | 'performance' | 'risk' | 'compliance' | 'financial' | 'custom';
  type: 'summary' | 'detailed' | 'analytical' | 'regulatory';
  frequency: 'on-demand' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  icon: JSX.Element;
  estimatedTime: string;
  dataPoints: string[];
  lastGenerated?: string;
  isScheduled: boolean;
  scheduleSettings?: {
    frequency: string;
    nextRun: string;
    recipients: string[];
  };
}

interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  category: string;
  generatedAt: string;
  generatedBy: string;
  format: string;
  size: string;
  status: 'completed' | 'generating' | 'failed' | 'scheduled';
  downloadUrl?: string;
  parameters: {
    dateRange: {
      start: string;
      end: string;
    };
    filters: any;
  };
}

const FinancialReportsPage: React.FC = () => {
  const [reportTemplates] = useState<ReportTemplate[]>([
    {
      id: 'portfolio-summary',
      name: 'Portfolio Summary Report',
      description: 'Comprehensive overview of loan portfolio performance, including active loans, disbursements, repayments, and key metrics',
      category: 'portfolio',
      type: 'summary',
      frequency: 'on-demand',
      format: 'pdf',
      icon: <FaChartPie className="h-5 w-5" />,
      estimatedTime: '2-3 minutes',
      dataPoints: ['Total Portfolio Value', 'Active Loans', 'Disbursed Amount', 'Repayment Rate', 'Interest Earned', 'Risk Distribution'],
      lastGenerated: '2024-08-10',
      isScheduled: true,
      scheduleSettings: {
        frequency: 'monthly',
        nextRun: '2024-09-01',
        recipients: ['cfo@lender.com', 'operations@lender.com']
      }
    },
    {
      id: 'income-statement',
      name: 'Income Statement',
      description: 'Detailed profit and loss statement showing revenue from interest, fees, and other income sources',
      category: 'financial',
      type: 'detailed',
      frequency: 'monthly',
      format: 'excel',
      icon: <FaDollarSign className="h-5 w-5" />,
      estimatedTime: '3-5 minutes',
      dataPoints: ['Interest Revenue', 'Fee Income', 'Operating Expenses', 'Net Income', 'ROI', 'Profit Margins'],
      lastGenerated: '2024-08-08',
      isScheduled: true,
      scheduleSettings: {
        frequency: 'monthly',
        nextRun: '2024-09-01',
        recipients: ['finance@lender.com']
      }
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      description: 'Analysis of cash inflows and outflows from lending operations, disbursements, and repayments',
      category: 'financial',
      type: 'analytical',
      frequency: 'weekly',
      format: 'pdf',
      icon: <FaMoneyBillWave className="h-5 w-5" />,
      estimatedTime: '2-4 minutes',
      dataPoints: ['Operating Cash Flow', 'Disbursement Outflows', 'Repayment Inflows', 'Interest Collections', 'Net Cash Position'],
      lastGenerated: '2024-08-09',
      isScheduled: false
    },
    {
      id: 'risk-assessment',
      name: 'Risk Assessment Report',
      description: 'Comprehensive risk analysis including credit risk, default rates, and portfolio risk metrics',
      category: 'risk',
      type: 'analytical',
      frequency: 'weekly',
      format: 'pdf',
      icon: <FaBalanceScale className="h-5 w-5" />,
      estimatedTime: '4-6 minutes',
      dataPoints: ['Credit Risk Score', 'Default Rate', 'Risk-Adjusted Returns', 'Value at Risk', 'Concentration Risk'],
      lastGenerated: '2024-08-11',
      isScheduled: true,
      scheduleSettings: {
        frequency: 'weekly',
        nextRun: '2024-08-18',
        recipients: ['risk@lender.com', 'cfo@lender.com']
      }
    },
    {
      id: 'borrower-performance',
      name: 'Borrower Performance Analysis',
      description: 'Detailed analysis of borrower performance, payment history, and creditworthiness trends',
      category: 'performance',
      type: 'detailed',
      frequency: 'monthly',
      format: 'excel',
      icon: <FaUsers className="h-5 w-5" />,
      estimatedTime: '3-5 minutes',
      dataPoints: ['Payment History', 'Credit Scores', 'Loan Performance', 'Default Probabilities', 'Recovery Rates'],
      lastGenerated: '2024-08-07',
      isScheduled: false
    },
    {
      id: 'interest-revenue',
      name: 'Interest Revenue Analysis',
      description: 'Comprehensive analysis of interest income, rate performance, and yield optimization opportunities',
      category: 'financial',
      type: 'analytical',
      frequency: 'monthly',
      format: 'pdf',
      icon: <FaPercent className="h-5 w-5" />,
      estimatedTime: '2-3 minutes',
      dataPoints: ['Interest Income', 'Rate Performance', 'Yield Analysis', 'Rate Optimization', 'Revenue Trends'],
      lastGenerated: '2024-08-10',
      isScheduled: true,
      scheduleSettings: {
        frequency: 'monthly',
        nextRun: '2024-09-01',
        recipients: ['treasury@lender.com']
      }
    },
    {
      id: 'geographic-analysis',
      name: 'Geographic Performance Report',
      description: 'Regional analysis of loan performance, market penetration, and geographic risk distribution',
      category: 'performance',
      type: 'analytical',
      frequency: 'quarterly',
      format: 'excel',
      icon: <FaGlobe className="h-5 w-5" />,
      estimatedTime: '5-7 minutes',
      dataPoints: ['Regional Performance', 'Market Penetration', 'Geographic Risk', 'Route Analysis', 'Market Opportunities'],
      lastGenerated: '2024-07-01',
      isScheduled: true,
      scheduleSettings: {
        frequency: 'quarterly',
        nextRun: '2024-10-01',
        recipients: ['strategy@lender.com']
      }
    },
    {
      id: 'regulatory-compliance',
      name: 'Regulatory Compliance Report',
      description: 'Compliance report for regulatory requirements, capital adequacy, and risk management standards',
      category: 'compliance',
      type: 'regulatory',
      frequency: 'quarterly',
      format: 'pdf',
      icon: <FaClipboardList className="h-5 w-5" />,
      estimatedTime: '6-8 minutes',
      dataPoints: ['Capital Ratios', 'Regulatory Limits', 'Compliance Status', 'Risk Metrics', 'Reporting Requirements'],
      lastGenerated: '2024-07-01',
      isScheduled: true,
      scheduleSettings: {
        frequency: 'quarterly',
        nextRun: '2024-10-01',
        recipients: ['compliance@lender.com', 'legal@lender.com']
      }
    },
    {
      id: 'cargo-sector-analysis',
      name: 'Cargo Sector Performance',
      description: 'Analysis of lending performance across different cargo types and industry sectors',
      category: 'performance',
      type: 'analytical',
      frequency: 'monthly',
      format: 'excel',
      icon: <FaIndustry className="h-5 w-5" />,
      estimatedTime: '4-5 minutes',
      dataPoints: ['Sector Performance', 'Cargo Type Analysis', 'Industry Trends', 'Risk by Sector', 'Growth Opportunities'],
      lastGenerated: '2024-08-05',
      isScheduled: false
    },
    {
      id: 'custom-report',
      name: 'Custom Report Builder',
      description: 'Build custom reports with selected metrics, date ranges, and filters based on specific requirements',
      category: 'custom',
      type: 'detailed',
      frequency: 'on-demand',
      format: 'excel',
      icon: <FaCog className="h-5 w-5" />,
      estimatedTime: '3-10 minutes',
      dataPoints: ['Customizable Metrics', 'Flexible Filters', 'Custom Date Ranges', 'Multiple Formats', 'Scheduled Delivery'],
      isScheduled: false
    }
  ]);

  const [generatedReports] = useState<GeneratedReport[]>([
    {
      id: 'RPT-001',
      templateId: 'portfolio-summary',
      name: 'Portfolio Summary Report - August 2024',
      category: 'portfolio',
      generatedAt: '2024-08-10T14:30:00',
      generatedBy: 'John Smith',
      format: 'pdf',
      size: '2.4 MB',
      status: 'completed',
      downloadUrl: '/reports/portfolio-summary-aug-2024.pdf',
      parameters: {
        dateRange: {
          start: '2024-08-01',
          end: '2024-08-31'
        },
        filters: { includeInactive: false }
      }
    },
    {
      id: 'RPT-002',
      templateId: 'risk-assessment',
      name: 'Risk Assessment Report - Week 32',
      category: 'risk',
      generatedAt: '2024-08-11T09:15:00',
      generatedBy: 'Sarah Johnson',
      format: 'pdf',
      size: '3.1 MB',
      status: 'completed',
      downloadUrl: '/reports/risk-assessment-week-32.pdf',
      parameters: {
        dateRange: {
          start: '2024-08-05',
          end: '2024-08-11'
        },
        filters: { riskLevel: 'all' }
      }
    },
    {
      id: 'RPT-003',
      templateId: 'income-statement',
      name: 'Income Statement - July 2024',
      category: 'financial',
      generatedAt: '2024-08-08T16:45:00',
      generatedBy: 'Michael Brown',
      format: 'excel',
      size: '1.8 MB',
      status: 'completed',
      downloadUrl: '/reports/income-statement-july-2024.xlsx',
      parameters: {
        dateRange: {
          start: '2024-07-01',
          end: '2024-07-31'
        },
        filters: { includeProjections: true }
      }
    },
    {
      id: 'RPT-004',
      templateId: 'custom-report',
      name: 'Q2 Performance Analysis',
      category: 'custom',
      generatedAt: '2024-08-12T10:20:00',
      generatedBy: 'Current User',
      format: 'excel',
      size: '0 MB',
      status: 'generating',
      parameters: {
        dateRange: {
          start: '2024-04-01',
          end: '2024-06-30'
        },
        filters: { metrics: ['revenue', 'risk', 'performance'] }
      }
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: '2024-08-01',
    end: '2024-08-31'
  });
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return reportTemplates.filter(template => {
      const matchesSearch = 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [reportTemplates, searchTerm, categoryFilter]);

  // Filter generated reports
  const filteredReports = useMemo(() => {
    return generatedReports.filter(report => {
      const matchesSearch = 
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.generatedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [generatedReports, searchTerm, statusFilter]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'portfolio': return <FaChartPie className="h-4 w-4" />;
      case 'performance': return <FaChartLine className="h-4 w-4" />;
      case 'risk': return <FaBalanceScale className="h-4 w-4" />;
      case 'compliance': return <FaClipboardList className="h-4 w-4" />;
      case 'financial': return <FaDollarSign className="h-4 w-4" />;
      case 'custom': return <FaCog className="h-4 w-4" />;
      default: return <FaFileAlt className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'portfolio': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-green-100 text-green-800';
      case 'risk': return 'bg-red-100 text-red-800';
      case 'compliance': return 'bg-purple-100 text-purple-800';
      case 'financial': return 'bg-yellow-100 text-yellow-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      case 'generating': return <FaSpinner className="text-blue-500 animate-spin" />;
      case 'failed': return <FaTimesCircle className="text-red-500" />;
      case 'scheduled': return <FaClock className="text-yellow-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateReport = async (template: ReportTemplate) => {
    setIsGenerating(template.id);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(null);
      alert(`Report "${template.name}" has been generated successfully!`);
    }, 3000);
  };

  const handleScheduleReport = (template: ReportTemplate) => {
    alert(`Scheduling options for "${template.name}" will be configured.`);
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    if (report.downloadUrl) {
      // Simulate download
      alert(`Downloading "${report.name}"`);
    }
  };

  const handleEmailReport = (report: GeneratedReport) => {
    alert(`Email options for "${report.name}" will be configured.`);
  };

  const formatFileSize = (size: string) => {
    if (size === '0 MB') return 'Generating...';
    return size;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 px-4 py-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
              <FaFileAlt className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Financial Reports</h1>
              <p className="text-xs text-gray-600 mt-0.5">Generate comprehensive financial and performance reports for your lending portfolio</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowReportBuilder(true)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
            >
              <FaCog className="w-3.5 h-3.5" />
              Custom Report
            </button>
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5">
              <FaCalendar className="w-3.5 h-3.5" />
              Schedule Manager
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Reports</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{reportTemplates.length}</p>
              <div className="flex items-center mt-1">
                <span className="text-green-600 text-xs">{reportTemplates.filter(t => t.isScheduled).length} scheduled</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaFileAlt className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Generated This Month</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{generatedReports.length}</p>
              <div className="flex items-center mt-1">
                <FaArrowUp className="h-2.5 w-2.5 text-green-500 mr-1" />
                <span className="text-green-600 text-xs">+23% vs last month</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FaChartBar className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Automated Reports</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{reportTemplates.filter(t => t.isScheduled).length}</p>
              <div className="flex items-center mt-1">
                <span className="text-blue-600 text-xs">Next run in 2 days</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaClock className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Storage Used</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">24.7 GB</p>
              <div className="flex items-center mt-1">
                <span className="text-gray-600 text-xs">67% of 37 GB limit</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaDatabase className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1">
              <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Search reports by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="portfolio">Portfolio</option>
              <option value="performance">Performance</option>
              <option value="risk">Risk</option>
              <option value="compliance">Compliance</option>
              <option value="financial">Financial</option>
              <option value="custom">Custom</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="failed">Failed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Templates and Generated Reports Tabs */}
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button className="border-b-2 border-blue-500 py-1.5 px-1 text-xs font-medium text-blue-600">
              Report Templates
            </button>
            <button className="border-b-2 border-transparent py-1.5 px-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Generated Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Report Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2">
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {getCategoryIcon(template.category)}
                        <span className="ml-1 capitalize">{template.category}</span>
                      </span>
                      <span className="text-xs text-gray-500">{template.type}</span>
                    </div>
                  </div>
                </div>
                {template.isScheduled && (
                  <div className="text-green-500">
                    <FaClock className="h-3 w-3" />
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-xs mb-2 line-clamp-2">{template.description}</p>

              <div className="space-y-1 mb-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Estimated Time:</span>
                  <span className="text-gray-900">{template.estimatedTime}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Format:</span>
                  <span className="text-gray-900 uppercase">{template.format}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Last Generated:</span>
                  <span className="text-gray-900">
                    {template.lastGenerated ? new Date(template.lastGenerated).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">Key Data Points:</p>
                <div className="flex flex-wrap gap-1">
                  {template.dataPoints.slice(0, 3).map((point, index) => (
                    <span key={index} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700">
                      {point}
                    </span>
                  ))}
                  {template.dataPoints.length > 3 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700">
                      +{template.dataPoints.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => handleGenerateReport(template)}
                  disabled={isGenerating === template.id}
                  className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating === template.id ? (
                    <>
                      <FaSpinner className="h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaPlay className="h-3 w-3" />
                      Generate
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="px-2 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaEye className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleScheduleReport(template)}
                  className="px-2 py-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaCalendarAlt className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>

      {/* Generated Reports Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-2.5 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Recently Generated Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-7 w-7 bg-gray-200 rounded-lg flex items-center justify-center mr-2">
                        {getCategoryIcon(report.category)}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-900">{report.name}</div>
                        <div className="text-xs text-gray-500">ID: {report.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-gray-900">{formatDate(report.generatedAt)}</div>
                    <div className="text-xs text-gray-500">by {report.generatedBy}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(report.status)}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-gray-900">{formatFileSize(report.size)}</div>
                    <div className="text-xs text-gray-500 uppercase">{report.format}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                    <div className="flex gap-1.5">
                      {report.status === 'completed' && (
                        <>
                          <button
                            onClick={() => handleDownloadReport(report)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                          >
                            <FaDownload className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleEmailReport(report)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1 transition-colors"
                          >
                            <FaEnvelope className="h-3.5 w-3.5" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
                            <FaPrint className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {report.status === 'generating' && (
                        <span className="text-blue-600 flex items-center gap-1">
                          <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                          Generating...
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-8">
            <FaFileAlt className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-xs font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your search criteria or generate a new report.
            </p>
          </div>
        )}
      </div>

      {/* Report Template Details Modal */}
      {selectedTemplate && (
        <>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">
                {selectedTemplate.name}
              </h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Report Details</h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium capitalize">{selectedTemplate.category}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedTemplate.type}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Format:</span>
                      <span className="font-medium uppercase">{selectedTemplate.format}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Estimated Time:</span>
                      <span className="font-medium">{selectedTemplate.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-700">{selectedTemplate.description}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Data Points Included</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="space-y-1.5">
                      {selectedTemplate.dataPoints.map((point, index) => (
                        <div key={index} className="flex items-center">
                          <FaCheckCircle className="h-3 w-3 text-green-500 mr-1.5" />
                          <span className="text-xs text-gray-700">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedTemplate.isScheduled && selectedTemplate.scheduleSettings && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Schedule Settings</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Frequency:</span>
                        <span className="font-medium capitalize">{selectedTemplate.scheduleSettings.frequency}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Next Run:</span>
                        <span className="font-medium">{new Date(selectedTemplate.scheduleSettings.nextRun).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Recipients:</span>
                        <div className="mt-1">
                          {selectedTemplate.scheduleSettings.recipients.map((email, index) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded mr-1 mb-1">
                              {email}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-3 py-1.5 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => handleScheduleReport(selectedTemplate)}
                className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Schedule Report
              </button>
              <button
                onClick={() => handleGenerateReport(selectedTemplate)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate Now
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default FinancialReportsPage;
