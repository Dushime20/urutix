import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileText,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Calculator,
  Receipt,
  CreditCard,
  Truck,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Edit3,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  Minus,
  Percent,
  ShieldCheck,
  Navigation,
  Fuel,
  Wrench,
  Bell,
  Settings,
  ArrowUpRight,
  Target,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Invoice, Expense, Payment, FinancialReport, Budget, TaxRecord,
  CustomerAnalytics, DriverAnalytics, PerformanceMetric, PredictiveAnalytics
} from '../../types/fleet';

interface FinancialManagementProps {
  fleetId?: string;
}

export const FinancialManagement: React.FC<FinancialManagementProps> = ({ fleetId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Mock data for demonstration
  const mockFinancialData = {
    invoices: [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-2024-001',
        customerId: 'cust-001',
        customerName: 'ABC Logistics',
        tripId: 'trip-001',
        truckId: 'truck-001',
        driverId: 'drv-001',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        status: 'paid',
        totalAmount: 2750,
        currency: 'USD',
        notes: 'On-time delivery',
        paymentTerms: 'Net 30',
        paymentMethod: 'ach',
        items: [{ id: '1', description: 'Freight charges', quantity: 1, unitPrice: 2000, totalPrice: 2000, type: 'freight', tripId: 'trip-001' }]
      }
    ],
    expenses: [
      {
        id: 'exp-1',
        type: 'fuel',
        category: 'Fuel',
        amount: 450,
        date: new Date('2024-01-25'),
        description: 'Diesel fuel purchase',
        status: 'approved',
        allocation: { percentage: 100 }
      }
    ],
    performanceMetrics: [
      { id: '1', name: 'Revenue Velocity', value: 125000, target: 120000, unit: 'USD', trend: 'up', changePercentage: 4.2 },
      { id: '2', name: 'Operational Margin', value: 18.5, target: 20, unit: '%', trend: 'down', changePercentage: -7.5 },
      { id: '3', name: 'Collection Period', value: 28, target: 30, unit: 'days', trend: 'up', changePercentage: -6.7 }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount * 120); // Simulating KES conversion
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: { title: string; value: string; icon: any; trend?: number; color: string }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] -mr-4 -mt-4 group-hover:scale-110 transition-transform">
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`size-10 rounded-xl flex items-center justify-center ${color} shadow-inner`}>
            <Icon size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</span>
        </div>
        <div className="flex items-end gap-3">
          <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider mb-1.5 ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend >= 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="size-14 bg-emerald-50 rounded-[20px] flex items-center justify-center text-emerald-600 shadow-inner">
            <DollarSign size={28} />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-1">Fiscal Command</h2>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Treasury Management</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <Plus size={14} />
            Generate Invoice
          </button>
          <button className="h-12 px-6 bg-[#1A1C1E] text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
            <Download size={14} />
            Fiscal Report
          </button>
        </div>
      </div>

      {/* Fiscal Stat Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue (MTD)" value={formatCurrency(125000)} icon={TrendingUp} trend={12.4} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Operational Margin" value="18.5%" icon={Target} trend={-2.1} color="bg-blue-50 text-blue-600" />
        <StatCard title="Treasury Inflow" value="KES 2.4M" icon={Activity} trend={5.8} color="bg-indigo-50 text-indigo-600" />
        <StatCard title="Pending Receivables" value="KES 840K" icon={Clock} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Navigation Vectors */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-[24px] border border-slate-100 shadow-sm w-fit max-w-full overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'invoicing', label: 'Inbound Revenue', icon: FileText },
          { id: 'expenses', label: 'Operational Costs', icon: Receipt },
          { id: 'payments', label: 'Treasury Logs', icon: CreditCard },
          { id: 'analytics', label: 'Fiscal Insights', icon: PieChart }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-11 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                ? 'bg-[#1A1C1E] text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Content Vector */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden"
        >
          {activeTab === 'overview' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Fiscal Overview</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Performance Metrics</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Sync</span>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Critical Performance Indicators</h4>
                  {mockFinancialData.performanceMetrics.map(metric => (
                    <div key={metric.id} className="p-5 bg-slate-50/50 rounded-[28px] border border-slate-50 hover:border-blue-100 hover:bg-blue-50/20 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-colors">
                          <Zap size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{metric.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.unit} Platform Metric</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">{metric.value}{metric.unit === '%' ? '%' : ''}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${metric.changePercentage > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage}% Variable
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#1A1C1E] rounded-[32px] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.05] grayscale -mr-6 -mt-6">
                    <Activity size={120} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-6">Recent Fiscal Pulses</h4>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="size-2 rounded-full bg-emerald-500 mt-2" />
                        <div>
                          <p className="text-sm font-black">Treasury Inbound Confirm</p>
                          <p className="text-xs text-white/40">KES 330,000 received from ABC Logistics</p>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">2h ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="size-2 rounded-full bg-blue-500 mt-2" />
                        <div>
                          <p className="text-sm font-black">Invoice Vector Sync</p>
                          <p className="text-xs text-white/40">Fiscal request sent to XYZ Transport</p>
                          <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">1d ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="size-2 rounded-full bg-amber-500 mt-2" />
                        <div>
                          <p className="text-sm font-black">Operational Cost Alert</p>
                          <p className="text-xs text-white/40">Maintenance expenditure approved: Tire unit</p>
                          <p className="text-[10px] font-bold text-amber-500 uppercase mt-1">3d ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Implement other tabs similarly as needed... */}
          {activeTab !== 'overview' && (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="size-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6">
                <Settings size={32} className="animate-spin-slow" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{activeTab} Interface Synchronizing</p>
              <p className="text-sm font-medium text-slate-400 mt-2">Vector protocols under optimization for the Enlite Prime aesthetic.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};