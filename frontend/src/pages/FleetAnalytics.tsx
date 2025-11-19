import React, { useState, useEffect } from 'react';
import { 
  FaChartBar, 
  FaTruck, 
  FaBox, 
  FaDollarSign, 
  FaMapMarkedAlt, 
  FaCalendar,
  FaDownload,
  FaFilePdf,
  FaSpinner,
  FaUsers,
  FaRoute,
  FaTools,
  FaChartLine
} from 'react-icons/fa';
import { fleetApi, type FleetAnalytics } from '../services/fleetApi';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const FleetAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [analytics, setAnalytics] = useState<FleetAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await fleetApi.fetchAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    setGeneratingPDF(true);
    try {
      if (!analytics) {
        toast.error('No analytics data available. Please wait for data to load.');
        setGeneratingPDF(false);
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Fleet Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: 'center' });
      pdf.text(`Period: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`, pageWidth / 2, yPosition + 5, { align: 'center' });
      yPosition += 15;

      // Summary Statistics
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Summary Statistics', 14, yPosition);
      yPosition += 10;

      if (analytics) {
        const statsData = [
          ['Metric', 'Value'],
          ['Total Trucks', (analytics.totalTrucks ?? 0).toString()],
          ['Available Trucks', (analytics.availableTrucks ?? 0).toString()],
          ['Total Drivers', (analytics.totalDrivers ?? 0).toString()],
          ['Active Drivers', (analytics.activeDrivers ?? 0).toString()],
          ['Total Routes', (analytics.totalRoutes ?? 0).toString()],
          ['Utilization Rate', `${(analytics.utilizationRate ?? 0).toFixed(1)}%`],
          ['Total Revenue', `$${(analytics.totalRevenue ?? 0).toLocaleString()}`],
          ['Average Rating', (analytics.averageRating ?? 0).toFixed(1)],
          ['Maintenance Alerts', (analytics.maintenanceAlerts ?? 0).toString()],
          ['Upcoming Inspections', (analytics.upcomingInspections ?? 0).toString()],
        ];

        autoTable(pdf, {
          startY: yPosition,
          head: [statsData[0]],
          body: statsData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 },
        });

        // Get the final Y position after the table
        const finalY = (pdf as any).lastAutoTable?.finalY || yPosition + 50;
        yPosition = finalY + 15;

        // Performance Metrics
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(16);
        pdf.text('Performance Metrics', 14, yPosition);
        yPosition += 10;

        const performanceData = [
          ['Category', 'Metric', 'Value'],
          ['Fleet', 'Utilization Rate', `${(analytics.utilizationRate ?? 0).toFixed(1)}%`],
          ['Fleet', 'Average Rating', (analytics.averageRating ?? 0).toFixed(1)],
          ['Financial', 'Total Revenue', `$${(analytics.totalRevenue ?? 0).toLocaleString()}`],
          ['Maintenance', 'Alerts', (analytics.maintenanceAlerts ?? 0).toString()],
          ['Maintenance', 'Upcoming Inspections', (analytics.upcomingInspections ?? 0).toString()],
        ];

        autoTable(pdf, {
          startY: yPosition,
          head: [performanceData[0]],
          body: performanceData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94], textColor: 255 },
          styles: { fontSize: 10 },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `Fleet_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast.success('PDF report generated successfully!');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      const errorMessage = error?.message || 'Failed to generate PDF report';
      toast.error(`PDF Generation Error: ${errorMessage}`);
      console.error('Full error details:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mr-3" />
        <span className="text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  const stats = analytics ? [
    {
      title: 'Total Trucks',
      value: (analytics.totalTrucks ?? 0).toString(),
      change: `${analytics.availableTrucks ?? 0} available`,
      changeType: 'positive' as const,
      icon: FaTruck,
      color: 'blue'
    },
    {
      title: 'Active Drivers',
      value: (analytics.activeDrivers ?? 0).toString(),
      change: `of ${analytics.totalDrivers ?? 0} total`,
      changeType: 'positive' as const,
      icon: FaUsers,
      color: 'green'
    },
    {
      title: 'Total Revenue',
      value: `$${(analytics.totalRevenue ?? 0).toLocaleString()}`,
      change: `${dateRange}`,
      changeType: 'positive' as const,
      icon: FaDollarSign,
      color: 'yellow'
    },
    {
      title: 'Utilization Rate',
      value: `${(analytics.utilizationRate ?? 0).toFixed(1)}%`,
      change: 'Fleet efficiency',
      changeType: 'positive' as const,
      icon: FaChartLine,
      color: 'purple'
    }
  ] : [];

  const monthlyData = [
    { month: 'Jan', trucks: 12, revenue: 18000 },
    { month: 'Feb', trucks: 15, revenue: 22000 },
    { month: 'Mar', trucks: 18, revenue: 25000 },
    { month: 'Apr', trucks: 22, revenue: 32000 },
    { month: 'May', trucks: 24, revenue: 38000 },
    { month: 'Jun', trucks: 28, revenue: analytics?.totalRevenue || 45230 }
  ];

  return (
    <div className="space-y-6" id="analytics-report">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Comprehensive analytics and insights for your fleet</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button
            onClick={generatePDFReport}
            disabled={generatingPDF}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingPDF ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FaFilePdf className="w-4 h-4" />
                Generate PDF Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <IconComponent className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Growth Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Growth</h3>
          <div className="space-y-3">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{data.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${(data.trucks / 30) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{data.trucks}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="space-y-3">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{data.month}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(data.revenue / 50000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">${data.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaTruck className="text-primary-600" />
            Fleet Performance
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Utilization Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {(analytics?.utilizationRate ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Available Trucks</span>
              <span className="text-sm font-medium text-gray-900">
                {analytics?.availableTrucks ?? 0} / {analytics?.totalTrucks ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Rating</span>
              <span className="text-sm font-medium text-gray-900">
                {(analytics?.averageRating ?? 0).toFixed(1)}/5
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaUsers className="text-green-600" />
            Driver Metrics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Drivers</span>
              <span className="text-sm font-medium text-gray-900">
                {analytics?.activeDrivers ?? 0} / {analytics?.totalDrivers ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Driver Utilization</span>
              <span className="text-sm font-medium text-gray-900">
                {analytics && (analytics.totalDrivers ?? 0) > 0 
                  ? (((analytics.activeDrivers ?? 0) / (analytics.totalDrivers ?? 1)) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Routes</span>
              <span className="text-sm font-medium text-gray-900">
                {analytics?.totalRoutes ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaTools className="text-yellow-600" />
            Maintenance Status
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Maintenance Alerts</span>
              <span className="text-sm font-medium text-red-600">
                {analytics?.maintenanceAlerts ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Upcoming Inspections</span>
              <span className="text-sm font-medium text-yellow-600">
                {analytics?.upcomingInspections ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="text-sm font-medium text-green-600">
                ${(analytics?.totalRevenue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Routes */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Routes</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaMapMarkedAlt className="text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Nairobi → Mombasa</p>
                <p className="text-sm text-gray-600">12 trips this {dateRange}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">$8,450</p>
              <p className="text-sm text-gray-600">Total revenue</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaMapMarkedAlt className="text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Kisumu → Nairobi</p>
                <p className="text-sm text-gray-600">8 trips this {dateRange}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">$5,230</p>
              <p className="text-sm text-gray-600">Total revenue</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaMapMarkedAlt className="text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Nakuru → Eldoret</p>
                <p className="text-sm text-gray-600">6 trips this {dateRange}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900">$3,120</p>
              <p className="text-sm text-gray-600">Total revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetAnalytics;

