import React, { useState, useEffect, useMemo } from 'react';
import { FaBox, FaMapMarkerAlt, FaSearch, FaDownload, FaEye } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import ModernLoader from '../../components/common/ModernLoader';
import { StatCard } from '../../components/EnliteUI';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
const OperationalAdminLoads: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loads, setLoads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      const res = await operationalAdminApi.getLoads();
      const raw: any[] = Array.isArray(res) ? res : res?.loads ?? res?.data ?? res?.items ?? [];
      setLoads(raw);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
      console.error(error);
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      const titleMatch = load.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const originMatch = typeof load.origin === 'object' 
        ? load.origin?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        : load.origin?.toLowerCase().includes(searchTerm.toLowerCase());
      const destMatch = typeof load.destination === 'object'
        ? load.destination?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        : load.destination?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchSearch = searchTerm === '' || titleMatch || originMatch || destMatch;
      const matchStatus = statusFilter === 'all' || load.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [loads, searchTerm, statusFilter]);

  const stats = {
    total: loads.length,
    active: loads.filter(l => ['PUBLISHED', 'ASSIGNED', 'IN_TRANSIT'].includes(l.status)).length,
    completed: loads.filter(l => ['COMPLETED', 'DELIVERED', 'CLOSED'].includes(l.status)).length,
    drafts: loads.filter(l => l.status === 'DRAFT' || l.status === 'CREATED').length,
  };

  return (
    <OperationalPageLayout
      title="Load Management"
      description="Manage and monitor all loads within your tenant's operations"
    >
      {loading ? (
        <ModernLoader isLoading={true} type="page" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Loads"
              value={stats.total}
              icon={<FaBox size={22} />}
              color="primary"
              variant="classic"
              subtitle="All time loads"
            />
            <StatCard
              title="Active Loads"
              value={stats.active}
              icon={<FaMapMarkerAlt size={22} />}
              color="primary"
              variant="classic"
              subtitle="Published / In Transit"
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={<FaBox size={22} />}
              color="success"
              variant="classic"
              subtitle="Successfully delivered"
            />
            <StatCard
              title="Drafts"
              value={stats.drafts}
              icon={<FaBox size={22} />}
              color="warning"
              variant="classic"
              subtitle="Pending publication"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search loads by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Cargo Type</th>
                  <th className="px-6 py-4 font-semibold">Origin</th>
                  <th className="px-6 py-4 font-semibold">Destination</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredLoads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No loads found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLoads.map((load) => (
                    <tr key={load.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-semibold">{load.title || `Load #${load.id.slice(0, 6)}`}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                          {load.status?.replace(/_/g, ' ') || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{load.cargoType?.replace(/_/g, ' ') || 'General Cargo'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {typeof load.origin === 'object' ? load.origin?.name || load.origin?.city : load.origin || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {typeof load.destination === 'object' ? load.destination?.name || load.destination?.city : load.destination || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary-600 hover:text-primary-800 p-2">
                          <FaEye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </OperationalPageLayout>
  );
};

export default OperationalAdminLoads;
