import React, { useState } from 'react';
import { 
  FaGavel, FaExclamationTriangle, FaSearch, FaFilter, FaDownload,
  FaEye, FaEdit, FaCalendar, FaClock, FaUser, FaTruck,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBalanceScale,
  FaFileAlt, FaComments, FaDollarSign, FaFlag, FaShieldAlt, FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';

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
      case 'open': return 'bg-gray-100 text-gray-700';
      case 'investigating': return 'bg-gray-100 text-gray-700';
      case 'mediating': return 'bg-gray-100 text-gray-600';
      case 'resolved': return 'bg-gray-100 text-gray-700';
      case 'escalated': return 'bg-gray-100 text-gray-600';
      case 'closed': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-gray-600';
      case 'high': return 'bg-gray-500';
      case 'medium': return 'bg-gray-400';
      case 'low': return 'bg-gray-300';
      default: return 'bg-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <FaDollarSign className="text-gray-600 text-xs" />;
      case 'delivery': return <FaTruck className="text-gray-600 text-xs" />;
      case 'damage': return <FaExclamationTriangle className="text-gray-600 text-xs" />;
      case 'service': return <FaShieldAlt className="text-gray-600 text-xs" />;
      case 'contract': return <FaFileAlt className="text-gray-600 text-xs" />;
      default: return <FaFlag className="text-gray-600 text-xs" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <FaFlag className="text-gray-500 text-xs" />;
      case 'investigating': return <FaSearch className="text-gray-500 text-xs" />;
      case 'mediating': return <FaBalanceScale className="text-gray-500 text-xs" />;
      case 'resolved': return <FaCheckCircle className="text-gray-600 text-xs" />;
      case 'escalated': return <FaExclamationTriangle className="text-gray-500 text-xs" />;
      case 'closed': return <FaTimesCircle className="text-gray-400 text-xs" />;
      default: return <FaHourglassHalf className="text-gray-500 text-xs" />;
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
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">Dispute Management</h1>
        <p className="text-xs text-gray-600 mt-0.5">Manage and resolve customer disputes efficiently</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaGavel className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.open}</p>
              <p className="text-xs text-gray-600">Open</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaFlag className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.investigating}</p>
              <p className="text-xs text-gray-600">Investigating</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaSearch className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.mediating}</p>
              <p className="text-xs text-gray-600">Mediating</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaBalanceScale className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.resolved}</p>
              <p className="text-xs text-gray-600">Resolved</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">${stats.totalAmount.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Total Value</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaDollarSign className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.avgResolutionTime}</p>
              <p className="text-xs text-gray-600">Avg Resolution</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaClock className="text-white text-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2.5">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <div className="relative">
            <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="mediating">Mediating</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
          >
            <option value="">All Types</option>
            <option value="payment">Payment</option>
            <option value="delivery">Delivery</option>
            <option value="damage">Damage</option>
            <option value="service">Service</option>
            <option value="contract">Contract</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs">
            <FaFilter className="w-3 h-3" />
            <span>Advanced</span>
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs">
            <FaDownload className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Dispute</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Parties</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Timeline</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">
                    No disputes found
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((dispute) => {
                  const daysUntilDue = getDaysUntilDue(dispute.dueDate);
                  return (
                    <tr key={dispute.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(dispute.priority)}`}></div>
                            {getTypeIcon(dispute.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-900">{dispute.title}</div>
                            <div className="text-[10px] text-gray-500">{dispute.disputeNumber}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{dispute.type.charAt(0).toUpperCase() + dispute.type.slice(1)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="font-medium text-gray-900">
                            {dispute.submittedBy}
                            <span className="text-[10px] text-gray-500 ml-1">({dispute.submitterRole.replace('_', ' ')})</span>
                          </div>
                          <div className="text-[10px] text-gray-500">vs</div>
                          <div className="text-xs text-gray-700">{dispute.respondent}</div>
                          {dispute.cargoId && (
                            <div className="text-[10px] text-gray-400 mt-0.5">Cargo: {dispute.cargoId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="text-sm font-bold text-gray-900">${dispute.amount.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500">{dispute.currency}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(dispute.status)}
                          <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(dispute.status)}`}>
                            {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-900">
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-gray-600">Created: {getTimeAgo(dispute.createdAt)}</div>
                          <div className="text-[10px] text-gray-600">
                            Due: {formatDate(dispute.dueDate)}
                            {daysUntilDue <= 0 && <span className="text-gray-600 font-medium ml-1">(Overdue)</span>}
                            {daysUntilDue > 0 && daysUntilDue <= 2 && <span className="text-gray-600 font-medium ml-1">({daysUntilDue}d left)</span>}
                          </div>
                          <div className="text-[10px] text-gray-600">
                            {dispute.evidence} evidence, {dispute.messages} msgs
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs">
                          {dispute.assignedTo ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <FaUser className="text-gray-600 text-[10px]" />
                              </div>
                              <span className="text-xs text-gray-900">{dispute.assignedTo}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleViewDetails(dispute)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                            title="View Details"
                          >
                            <FaEye className="w-3 h-3" />
                          </button>
                          {dispute.status !== 'resolved' && (
                            <button 
                              onClick={() => handleStatusChange(dispute.id, 'resolved')}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                              title="Mark Resolved"
                            >
                              <FaCheckCircle className="w-3 h-3" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Dispute Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Dispute Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Dispute Number</div>
                  <div className="text-xs font-medium text-gray-900">{selectedDispute.disputeNumber}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Status</div>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(selectedDispute.status)}
                    <span className={`text-xs font-medium ${getStatusColor(selectedDispute.status)}`}>
                      {selectedDispute.status.charAt(0).toUpperCase() + selectedDispute.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Type</div>
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(selectedDispute.type)}
                    <span className="text-xs font-medium text-gray-900">{selectedDispute.type.charAt(0).toUpperCase() + selectedDispute.type.slice(1)}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Priority</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(selectedDispute.priority)}`}></div>
                    <span className="text-xs font-medium text-gray-900">{selectedDispute.priority.charAt(0).toUpperCase() + selectedDispute.priority.slice(1)}</span>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2">Parties</div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[10px] text-gray-600">Submitted By</div>
                    <div className="text-xs text-gray-900">{selectedDispute.submittedBy} ({selectedDispute.submitterRole.replace('_', ' ')})</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Respondent</div>
                    <div className="text-xs text-gray-900">{selectedDispute.respondent}</div>
                  </div>
                  {selectedDispute.cargoId && (
                    <div>
                      <div className="text-[10px] text-gray-600">Cargo ID</div>
                      <div className="text-xs text-gray-900">{selectedDispute.cargoId}</div>
                    </div>
                  )}
                  {selectedDispute.tripId && (
                    <div>
                      <div className="text-[10px] text-gray-600">Trip ID</div>
                      <div className="text-xs text-gray-900">{selectedDispute.tripId}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-1">Amount</div>
                <div className="text-lg font-bold text-gray-900">${selectedDispute.amount.toLocaleString()} {selectedDispute.currency}</div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-1">Description</div>
                <div className="text-xs text-gray-700">{selectedDispute.description}</div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2">Timeline</div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[10px] text-gray-600">Created</div>
                    <div className="text-xs text-gray-900">{formatDateTime(selectedDispute.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Last Updated</div>
                    <div className="text-xs text-gray-900">{formatDateTime(selectedDispute.updatedAt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Due Date</div>
                    <div className="text-xs text-gray-900">
                      {formatDate(selectedDispute.dueDate)}
                      {getDaysUntilDue(selectedDispute.dueDate) <= 0 && <span className="text-gray-600 font-medium ml-1">(Overdue)</span>}
                      {getDaysUntilDue(selectedDispute.dueDate) > 0 && getDaysUntilDue(selectedDispute.dueDate) <= 2 && (
                        <span className="text-gray-600 font-medium ml-1">({getDaysUntilDue(selectedDispute.dueDate)}d left)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment & Activity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Assigned To</div>
                  <div className="text-xs text-gray-900">{selectedDispute.assignedTo || 'Unassigned'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Activity</div>
                  <div className="text-xs text-gray-900">{selectedDispute.evidence} evidence, {selectedDispute.messages} messages</div>
                </div>
              </div>

              {/* Resolution */}
              {selectedDispute.resolution && (
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-xs font-medium text-gray-900 mb-1">Resolution</div>
                  <div className="text-xs text-gray-700">{selectedDispute.resolution}</div>
                </div>
              )}

              {/* Actions */}
              {selectedDispute.status !== 'resolved' && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleStatusChange(selectedDispute.id, 'resolved');
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-xs font-medium"
                  >
                    Mark Resolved
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeManagement;
