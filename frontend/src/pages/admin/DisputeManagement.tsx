import React, { useState } from 'react';
import {
  Gavel, AlertTriangle, Search, Filter, Download,
  Eye, Calendar, Clock, User, Truck,
  CheckCircle, XCircle, Hourglass, Scale,
  FileText, DollarSign, Flag, Shield, X,
  ChevronDown, MoreHorizontal, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';

interface Dispute {
  id: string;
  disputeNumber: string;
  title: string;
  type: 'payment' | 'delivery' | 'damage' | 'service' | 'contract';
  status: 'open' | 'investigating' | 'mediating' | 'resolved' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedBy: string;
  submitterRole: 'cargo_owner' | 'fleet_owner' | 'driver';
  respondent: string;
  cargoId?: string;
  tripId?: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  assignedTo?: string;
  resolution?: string;
  evidence: number;
  messages: number;
}

const DisputeManagement: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: '1',
      disputeNumber: 'DSP-2024-001',
      title: 'Payment Delay Issue',
      type: 'payment',
      status: 'investigating',
      priority: 'high',
      submittedBy: 'John Smith Logistics',
      submitterRole: 'cargo_owner',
      respondent: 'FastTrans Ltd',
      cargoId: 'CRG-001',
      tripId: 'TRP-001',
      amount: 1500,
      currency: 'USD',
      description: 'Payment not received within agreed timeframe for completed delivery',
      createdAt: '2024-08-08T09:30:00Z',
      updatedAt: '2024-08-10T14:20:00Z',
      dueDate: '2024-08-15T23:59:59Z',
      assignedTo: 'Sarah Wilson',
      evidence: 3,
      messages: 8
    },
    {
      id: '2',
      disputeNumber: 'DSP-2024-002',
      title: 'Cargo Damage Claim',
      type: 'damage',
      status: 'mediating',
      priority: 'critical',
      submittedBy: 'TechCorp Industries',
      submitterRole: 'cargo_owner',
      respondent: 'Highway Haulers',
      cargoId: 'CRG-002',
      tripId: 'TRP-002',
      amount: 5000,
      currency: 'USD',
      description: 'Electronics damaged during transport due to improper handling',
      createdAt: '2024-08-07T16:45:00Z',
      updatedAt: '2024-08-10T11:30:00Z',
      dueDate: '2024-08-14T23:59:59Z',
      assignedTo: 'Mike Johnson',
      evidence: 12,
      messages: 15
    },
    {
      id: '3',
      disputeNumber: 'DSP-2024-003',
      title: 'Service Quality Issue',
      type: 'service',
      status: 'open',
      priority: 'medium',
      submittedBy: 'Global Shipping Co',
      submitterRole: 'cargo_owner',
      respondent: 'Express Delivery Inc',
      cargoId: 'CRG-003',
      tripId: 'TRP-003',
      amount: 800,
      currency: 'USD',
      description: 'Late delivery and poor communication during transport',
      createdAt: '2024-08-09T12:15:00Z',
      updatedAt: '2024-08-09T12:15:00Z',
      dueDate: '2024-08-16T23:59:59Z',
      evidence: 2,
      messages: 3
    },
    {
      id: '4',
      disputeNumber: 'DSP-2024-004',
      title: 'Contract Violation',
      type: 'contract',
      status: 'resolved',
      priority: 'high',
      submittedBy: 'Premium Transport',
      submitterRole: 'fleet_owner',
      respondent: 'MegaCorp Ltd',
      cargoId: 'CRG-004',
      tripId: 'TRP-004',
      amount: 2200,
      currency: 'USD',
      description: 'Client changed delivery requirements without notice',
      createdAt: '2024-08-05T08:20:00Z',
      updatedAt: '2024-08-08T16:30:00Z',
      dueDate: '2024-08-12T23:59:59Z',
      assignedTo: 'Lisa Chen',
      resolution: 'Settled with partial compensation to fleet owner',
      evidence: 8,
      messages: 22
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'investigating': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'mediating': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-100';
      case 'escalated': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'closed': return 'bg-gray-50 text-gray-500 border-gray-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 shadow-sm shadow-red-200';
      case 'high': return 'bg-orange-500 shadow-sm shadow-orange-200';
      case 'medium': return 'bg-yellow-500 shadow-sm shadow-yellow-200';
      case 'low': return 'bg-blue-500 shadow-sm shadow-blue-200';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-100';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-100';
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colorClass = getPriorityTextColor(priority);
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${colorClass}`}>
        {priority}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-3 h-3 text-gray-400" />;
      case 'delivery': return <Truck className="w-3 h-3 text-gray-400" />;
      case 'damage': return <AlertTriangle className="w-3 h-3 text-gray-400" />;
      case 'service': return <Shield className="w-3 h-3 text-gray-400" />;
      case 'contract': return <FileText className="w-3 h-3 text-gray-400" />;
      default: return <Flag className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Flag className="w-3 h-3" />;
      case 'investigating': return <Search className="w-3 h-3" />;
      case 'mediating': return <Scale className="w-3 h-3" />;
      case 'resolved': return <CheckCircle className="w-3 h-3" />;
      case 'escalated': return <AlertTriangle className="w-3 h-3" />;
      case 'closed': return <XCircle className="w-3 h-3" />;
      default: return <Hourglass className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.disputeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.respondent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || dispute.status === filterStatus;
    const matchesType = !filterType || dispute.type === filterType;
    const matchesPriority = !filterPriority || dispute.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const handleStatusChange = (disputeId: string, newStatus: string) => {
    setDisputes(disputes.map(dispute =>
      dispute.id === disputeId
        ? { ...dispute, status: newStatus as any, updatedAt: new Date().toISOString() }
        : dispute
    ));
    toast.success(`Dispute status updated to ${newStatus}`);
  };

  const handleViewDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowDetailsModal(true);
  };

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    investigating: disputes.filter(d => d.status === 'investigating').length,
    mediating: disputes.filter(d => d.status === 'mediating').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    totalAmount: disputes.reduce((acc, d) => acc + d.amount, 0),
    avgResolutionTime: '4.2 days'
  };

  return (
    <AdminPageLayout
      title={<TranslatedText text="Dispute Management" />}
      description={<TranslatedText text="Manage and resolve customer disputes efficiently" />}
    >

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label: <TranslatedText text="Total" />, value: stats.total, icon: Gavel, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: <TranslatedText text="Open" />, value: stats.open, icon: Flag, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: <TranslatedText text="Investigating" />, value: stats.investigating, icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: <TranslatedText text="Mediating" />, value: stats.mediating, icon: Scale, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: <TranslatedText text="Resolved" />, value: stats.resolved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: <TranslatedText text="Value" />, value: `$${(stats.totalAmount / 1000).toFixed(1)}k`, fullValue: `$${stats.totalAmount.toLocaleString()}`, icon: DollarSign, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: <TranslatedText text="Avg Time" />, value: stats.avgResolutionTime, icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map((item, index) => (
          <div key={index} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full group hover:border-gray-200 transition-all">
            <div className="flex justify-between items-start mb-2">
              <div className={`p-1.5 rounded-lg ${item.bg}`}>
                <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
            </div>
            <div>
              <div className="text-xl font-black text-gray-900 tracking-tight truncate" title={item.fullValue || item.value.toString()}>
                {item.value}
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5 truncate">
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium transition-all"
            />
          </div>
          <div className="md:col-span-2 relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium appearance-none cursor-pointer"
            >
              <option value=""><TranslatedText text="All Status" /></option>
              <option value="open"><TranslatedText text="Open" /></option>
              <option value="investigating"><TranslatedText text="Investigating" /></option>
              <option value="mediating"><TranslatedText text="Mediating" /></option>
              <option value="resolved"><TranslatedText text="Resolved" /></option>
              <option value="escalated"><TranslatedText text="Escalated" /></option>
              <option value="closed"><TranslatedText text="Closed" /></option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          <div className="md:col-span-2 relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium appearance-none cursor-pointer"
            >
              <option value=""><TranslatedText text="All Types" /></option>
              <option value="payment"><TranslatedText text="Payment" /></option>
              <option value="delivery"><TranslatedText text="Delivery" /></option>
              <option value="damage"><TranslatedText text="Damage" /></option>
              <option value="service"><TranslatedText text="Service" /></option>
              <option value="contract"><TranslatedText text="Contract" /></option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          <div className="md:col-span-2 relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium appearance-none cursor-pointer"
            >
              <option value=""><TranslatedText text="All Priorities" /></option>
              <option value="critical"><TranslatedText text="Critical" /></option>
              <option value="high"><TranslatedText text="High" /></option>
              <option value="medium"><TranslatedText text="Medium" /></option>
              <option value="low"><TranslatedText text="Low" /></option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm font-bold">
              <Filter className="w-4 h-4" />
              <span className="hidden lg:inline"><TranslatedText text="Filter" /></span>
            </button>
            <button className="flex-1 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-sm font-bold">
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline"><TranslatedText text="Export" /></span>
            </button>
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Dispute" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Parties" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Amount" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Status" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Timeline" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Assigned" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Actions" /></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm font-medium text-gray-500">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Gavel className="w-8 h-8 text-gray-300" />
                    </div>
                    <TranslatedText text="No disputes found matching your criteria" />
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((dispute) => {
                  const daysUntilDue = getDaysUntilDue(dispute.dueDate);
                  return (
                    <tr key={dispute.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getTypeIcon(dispute.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-gray-900">{dispute.title}</div>
                            <div className="text-[10px] font-mono text-gray-500 mt-0.5">{dispute.disputeNumber}</div>
                            <div className="mt-1 flex gap-1">
                              {getPriorityBadge(dispute.priority)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <User className="w-3 h-3 text-gray-400" />
                            {dispute.submittedBy}
                          </div>
                          <div className="text-[10px] text-gray-500 ml-4">vs</div>
                          <div className="font-medium text-gray-700 flex items-center gap-1.5">
                            <User className="w-3 h-3 text-gray-400" />
                            {dispute.respondent}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-black text-gray-900">${dispute.amount.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500">{dispute.currency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(dispute.status)}`}>
                            {getStatusIcon(dispute.status)}
                            {dispute.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                        <div className="space-y-1">
                          <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(dispute.createdAt)}
                          </div>
                          <div className={`text-[10px] font-medium flex items-center gap-1.5 ${daysUntilDue <= 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            <Calendar className="w-3 h-3" />
                            {daysUntilDue <= 0 ? (
                              <span>Overdue</span>
                            ) : (
                              <span>{daysUntilDue}d left</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs">
                          {dispute.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                                {dispute.assignedTo.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-gray-900">{dispute.assignedTo}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic bg-gray-50 px-2 py-1 rounded-lg">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(dispute)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {dispute.status !== 'resolved' && (
                            <button
                              onClick={() => handleStatusChange(dispute.id, 'resolved')}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                              title="Mark Resolved"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispute Details Modal */}
      {showDetailsModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                  <Gavel className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900"><TranslatedText text="Dispute Details" /></h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedDispute.disputeNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dispute Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1"><TranslatedText text="Status" /></div>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(selectedDispute.status)}
                    <span className="text-sm font-bold text-gray-900 capitalize">{selectedDispute.status}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1"><TranslatedText text="Type" /></div>
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(selectedDispute.type)}
                    <span className="text-sm font-bold text-gray-900 capitalize">{selectedDispute.type}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1"><TranslatedText text="Priority" /></div>
                  {getPriorityBadge(selectedDispute.priority)}
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1"><TranslatedText text="Amount" /></div>
                  <div className="text-sm font-black text-gray-900">${selectedDispute.amount.toLocaleString()}</div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <div className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Description
                </div>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedDispute.description}
                </p>
              </div>

              {/* Parties & Timeline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parties */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-gray-100 pb-2">Involved Parties</h4>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs ring-4 ring-white shadow-sm border border-blue-100">
                      {selectedDispute.submittedBy.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium">Claimant</div>
                      <div className="text-sm font-bold text-gray-900">{selectedDispute.submittedBy}</div>
                      <div className="text-[10px] text-gray-400 capitalize">{selectedDispute.submitterRole.replace('_', ' ')}</div>
                    </div>
                  </div>

                  <div className="pl-4 ml-4 border-l-2 border-dashed border-gray-200 py-2">
                    <div className="text-[10px] text-gray-400 italic">Dispute raised against</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs ring-4 ring-white shadow-sm border border-orange-100">
                      {selectedDispute.respondent.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium">Respondent</div>
                      <div className="text-sm font-bold text-gray-900">{selectedDispute.respondent}</div>
                    </div>
                  </div>
                </div>

                {/* Timeline & Metadata */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-gray-100 pb-2">Timeline & Meta</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Created</div>
                      <div className="text-xs font-bold text-gray-900">{formatDate(selectedDispute.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Due Date</div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                        {formatDate(selectedDispute.dueDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Assigned To</div>
                      <div className="text-xs font-bold text-gray-900">{selectedDispute.assignedTo || 'Unassigned'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Evidence</div>
                      <div className="text-xs font-bold text-gray-900">{selectedDispute.evidence} files</div>
                    </div>
                    {selectedDispute.cargoId && (
                      <div className="col-span-2">
                        <div className="text-[10px] text-gray-500 mb-0.5">Related Cargo</div>
                        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                          {selectedDispute.cargoId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resolution (if any) */}
              {selectedDispute.resolution && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="text-xs font-black text-green-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Resolution
                  </div>
                  <div className="text-sm text-green-700 font-medium">{selectedDispute.resolution}</div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-6 border-t border-gray-100 flex gap-3">
                {selectedDispute.status !== 'resolved' ? (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedDispute.id, 'resolved');
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 transition-all font-bold text-sm shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Resolved
                  </button>
                ) : (
                  <div className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2 cursor-not-allowed">
                    <CheckCircle className="w-4 h-4" />
                    Case Closed
                  </div>
                )}
                <button className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Add Note
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </AdminPageLayout>
  );
};

export default DisputeManagement;
