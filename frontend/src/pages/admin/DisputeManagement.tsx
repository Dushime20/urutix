import React, { useState } from 'react';
import { 
  FaGavel, FaExclamationTriangle, FaSearch, FaFilter, FaDownload,
  FaEye, FaEdit, FaPlus, FaCalendar, FaClock, FaUser, FaTruck,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBalanceScale,
  FaFileAlt, FaComments, FaDollarSign, FaFlag, FaShieldAlt
} from 'react-icons/fa';

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
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'mediating': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <FaDollarSign className="text-green-600" />;
      case 'delivery': return <FaTruck className="text-blue-600" />;
      case 'damage': return <FaExclamationTriangle className="text-red-600" />;
      case 'service': return <FaShieldAlt className="text-purple-600" />;
      case 'contract': return <FaFileAlt className="text-orange-600" />;
      default: return <FaFlag className="text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <FaFlag className="text-blue-500" />;
      case 'investigating': return <FaSearch className="text-yellow-500" />;
      case 'mediating': return <FaBalanceScale className="text-orange-500" />;
      case 'resolved': return <FaCheckCircle className="text-green-500" />;
      case 'escalated': return <FaExclamationTriangle className="text-red-500" />;
      case 'closed': return <FaTimesCircle className="text-gray-500" />;
      default: return <FaHourglassHalf className="text-gray-500" />;
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
  };

  const handleAssignDispute = (disputeId: string, assignee: string) => {
    setDisputes(disputes.map(dispute => 
      dispute.id === disputeId 
        ? { ...dispute, assignedTo: assignee, updatedAt: new Date().toISOString() } 
        : dispute
    ));
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Dispute Management</h1>
          <p className="text-gray-600">Manage and resolve customer disputes efficiently</p>
        </div>
        <div className="flex gap-2 items-center">
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors">
            <FaPlus />
            <span>Create Dispute</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <FaGavel className="text-purple-500 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.open}</p>
              <p className="text-sm text-gray-600">Open</p>
            </div>
            <FaFlag className="text-blue-500 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.investigating}</p>
              <p className="text-sm text-gray-600">Investigating</p>
            </div>
            <FaSearch className="text-yellow-500 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.mediating}</p>
              <p className="text-sm text-gray-600">Mediating</p>
            </div>
            <FaBalanceScale className="text-orange-500 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.resolved}</p>
              <p className="text-sm text-gray-600">Resolved</p>
            </div>
            <FaCheckCircle className="text-green-500 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-800">${stats.totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
            <FaDollarSign className="text-green-600 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-800">{stats.avgResolutionTime}</p>
              <p className="text-sm text-gray-600">Avg Resolution</p>
            </div>
            <FaClock className="text-blue-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaFilter />
            <span>Advanced</span>
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispute</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parties</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDisputes.map((dispute) => {
                const daysUntilDue = getDaysUntilDue(dispute.dueDate);
                return (
                  <tr key={dispute.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 flex items-center">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(dispute.priority)} mr-2`}></div>
                          {getTypeIcon(dispute.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">{dispute.title}</div>
                          <div className="text-sm text-gray-500">{dispute.disputeNumber}</div>
                          <div className="text-xs text-gray-400 mt-1">{dispute.type.charAt(0).toUpperCase() + dispute.type.slice(1)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {dispute.submittedBy}
                          <span className="text-xs text-gray-500 ml-1">({dispute.submitterRole.replace('_', ' ')})</span>
                        </div>
                        <div className="text-gray-500">vs</div>
                        <div className="text-gray-700">{dispute.respondent}</div>
                        {dispute.cargoId && (
                          <div className="text-xs text-gray-400 mt-1">Cargo: {dispute.cargoId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-lg font-bold text-gray-900">${dispute.amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{dispute.currency}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(dispute.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                          {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <FaCalendar className="text-gray-400 mr-2" />
                          Created: {formatDate(dispute.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <FaClock className="text-gray-400 mr-2" />
                          Due: {formatDate(dispute.dueDate)}
                          {daysUntilDue <= 0 && <span className="text-red-500 font-medium ml-2">(Overdue)</span>}
                          {daysUntilDue > 0 && daysUntilDue <= 2 && <span className="text-orange-500 font-medium ml-2">({daysUntilDue}d left)</span>}
                        </div>
                        <div className="flex items-center">
                          <FaComments className="text-gray-400 mr-2" />
                          {dispute.evidence} evidence, {dispute.messages} messages
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {dispute.assignedTo ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                              <FaUser className="text-blue-600 text-sm" />
                            </div>
                            <span className="text-gray-900">{dispute.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setSelectedDispute(dispute.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button className="text-green-600 hover:text-green-900 p-1 rounded transition-colors" title="Edit">
                          <FaEdit />
                        </button>
                        {dispute.status !== 'resolved' && (
                          <button 
                            onClick={() => handleStatusChange(dispute.id, 'resolved')}
                            className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                            title="Mark Resolved"
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Dispute Activity</h3>
        <div className="space-y-3">
          {filteredDisputes.slice(0, 3).map((dispute) => (
            <div key={dispute.id} className="border-l-4 border-red-500 pl-4 py-2">
              <div className="text-sm font-medium text-gray-900">
                {dispute.disputeNumber} - {dispute.title}
              </div>
              <div className="text-sm text-gray-600">
                {dispute.status === 'resolved' && dispute.resolution 
                  ? dispute.resolution 
                  : dispute.description}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {formatDateTime(dispute.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DisputeManagement;
