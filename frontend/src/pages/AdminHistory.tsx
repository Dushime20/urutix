import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FaHistory,
  FaUser,
  FaTruck,
  FaBox,
  FaDollarSign,
  FaFileAlt,
  FaShieldAlt,
  FaCog,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaInfoCircle,
  FaUserPlus,
  FaUserMinus,
  FaEdit,
  FaTrash,
  FaKey,
  FaLock,
  FaUnlock,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { TranslatedText } from '@/components/translated-text';
import { StatCard } from '../components/EnliteUI';
import { activityLogsApi, type ActivityLog } from '@/services/activityLogsApi';

const AdminHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Fetch activity logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['activity-logs', categoryFilter, statusFilter, searchTerm],
    queryFn: () => activityLogsApi.getActivityLogs({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined,
      limit: 100,
    }),
  });

  // Fetch activity stats
  const { data: statsData } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: () => activityLogsApi.getActivityStats(),
  });

  const activityLogs = logsData?.logs || [];
  const stats = statsData || {
    totalActivities: 0,
    userActions: 0,
    securityEvents: 0,
    systemEvents: 0,
  };

  // Filter logs (client-side filtering for additional refinement)
  const filteredLogs = useMemo(() => {
    return activityLogs;
  }, [activityLogs]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user': return <FaUser className="w-4 h-4" />;
      case 'cargo': return <FaBox className="w-4 h-4" />;
      case 'payment': return <FaDollarSign className="w-4 h-4" />;
      case 'system': return <FaCog className="w-4 h-4" />;
      case 'security': return <FaShieldAlt className="w-4 h-4" />;
      case 'tenant': return <FaTruck className="w-4 h-4" />;
      case 'document': return <FaFileAlt className="w-4 h-4" />;
      default: return <FaInfoCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'cargo': return 'bg-purple-100 text-purple-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'tenant': return 'bg-yellow-100 text-yellow-800';
      case 'document': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <FaCheckCircle className="text-green-500" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'error': return <FaTimesCircle className="text-red-500" />;
      case 'info': return <FaInfoCircle className="text-blue-500" />;
      default: return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    alert('Exporting activity logs...');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={<TranslatedText text="Total Activities" />}
          value={stats.totalActivities}
          icon={<FaHistory size={22} />}
          color="primary"
          variant="classic"
          subtitle={<TranslatedText text="Last 24 hours" />}
        />
        <StatCard
          title={<TranslatedText text="User Actions" />}
          value={stats.userActions}
          icon={<FaUser size={22} />}
          color="primary"
          variant="classic"
          subtitle={<TranslatedText text="User operations" />}
        />
        <StatCard
          title={<TranslatedText text="Security Events" />}
          value={stats.securityEvents}
          icon={<FaShieldAlt size={22} />}
          color="primary"
          variant="classic"
          subtitle={<TranslatedText text="Auth & security" />}
        />
        <StatCard
          title={<TranslatedText text="System Events" />}
          value={stats.systemEvents}
          icon={<FaCog size={22} />}
          color="primary"
          variant="classic"
          subtitle={<TranslatedText text="System operations" />}
        />
      </div>

      {/* Filters */}
      <div className="bg-slate-50 border border-transparent rounded-3xl p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 text-[11px] font-black uppercase tracking-widest w-full bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#345E85] focus:border-transparent transition-all placeholder:text-slate-300"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 text-[11px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#345E85] focus:border-transparent transition-all outline-none"
          >
            <option value="all">All Categories</option>
            <option value="user">User Actions</option>
            <option value="cargo">Cargo Activities</option>
            <option value="payment">Payments</option>
            <option value="system">System Events</option>
            <option value="security">Security</option>
            <option value="tenant">Tenant Management</option>
            <option value="document">Documents</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 text-[11px] font-black uppercase tracking-widest bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#345E85] focus:border-transparent transition-all outline-none"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
          </select>

          <button
            onClick={handleExport}
            className="px-6 py-3 bg-[#345E85] text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <FaDownload className="w-3.5 h-3.5" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-[2rem] border border-transparent overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FaHistory className="w-4 h-4 text-[#345E85]" />
              <TranslatedText text="Activity Timeline" />
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              Showing {filteredLogs.length} of {activityLogs.length} activities
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {logsLoading ? (
            <div className="py-12">
              <ModernLoader isLoading={true} type="list" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 relative">
                    <div className={`w-12 h-12 rounded-2xl ${getCategoryColor(log.category)} flex items-center justify-center shadow-sm`}>
                      {getCategoryIcon(log.category)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                      {getStatusIcon(log.status)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-sm font-black text-slate-900 tracking-tight">{log.action}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{log.description}</p>
                        <div className="flex items-center gap-6 mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                            <FaUser className="w-3 h-3" />
                            {log.user}
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                            <FaClock className="w-3 h-3" />
                            {formatDate(log.timestamp)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-2 rounded-xl bg-slate-50 text-[#345E85] hover:bg-[#345E85] hover:text-white transition-all duration-300"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm overflow-y-auto h-full w-full z-[100] p-4 flex items-center justify-center">
          <div className="relative mx-auto p-8 border border-slate-100 w-full max-w-2xl shadow-2xl rounded-[2.5rem] bg-white animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${getCategoryColor(selectedLog.category)}`}>
                  {getCategoryIcon(selectedLog.category)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    <TranslatedText text="Activity Details" />
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">User</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#345E85]">
                      <FaUser className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{selectedLog.user}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedLog.userRole}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${getStatusColor(selectedLog.status)} text-[10px] font-black uppercase tracking-widest`}>
                    {getStatusIcon(selectedLog.status)}
                    {selectedLog.status}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Timestamp</p>
                  <div className="flex items-center gap-3 text-slate-600">
                    <FaClock className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm font-black tracking-tight">{formatDate(selectedLog.timestamp)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Network</p>
                  <div className="flex items-center gap-3 text-slate-600">
                    <FaShieldAlt className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm font-black tracking-tight">{selectedLog.ipAddress || 'Internal'}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Activity Description</p>
                <p className="text-sm font-bold text-slate-700 leading-relaxed">
                  {selectedLog.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-8 py-3 bg-[#345E85] text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/10"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHistory;
