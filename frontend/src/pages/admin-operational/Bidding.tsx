import React, { useState, useEffect, useMemo } from 'react';
import { FaGavel, FaMapMarkerAlt, FaSearch, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import type { Bid } from '../../services/tenantApi';
import ModernLoader from '../../components/common/ModernLoader';
import { StatCard } from '../../components/EnliteUI';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
const OperationalAdminBidding: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<Bid[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });

  useEffect(() => {
    if (user?.tenantId) {
      fetchBids(user.tenantId);
    } else {
      setLoading(false);
    }
  }, [user?.tenantId]);

  const fetchBids = async (tenantId: string) => {
    try {
      setLoading(true);
      const [bidsRes, statsRes] = await Promise.all([
        operationalAdminApi.getBids({ status: statusFilter === 'all' ? undefined : statusFilter }),
        operationalAdminApi.getBiddingStats(),
      ]);
      const rawBids: any[] = Array.isArray(bidsRes) ? bidsRes : bidsRes?.bids ?? bidsRes?.data ?? bidsRes?.items ?? [];
      // Scope bids to this tenant only
      const tenantBids = rawBids.filter((b: any) => !b.tenantId || b.tenantId === tenantId);
      setBids(tenantBids);
      setStats({
        total:    statsRes?.total    ?? tenantBids.length,
        pending:  statsRes?.pending  ?? 0,
        accepted: statsRes?.accepted ?? 0,
        rejected: statsRes?.rejected ?? 0,
      });
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
      console.error(error);
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBids = useMemo(() => {
    return bids.filter((bid) => {
      const loadMatch = bid.loadId?.toLowerCase().includes(searchTerm.toLowerCase());
      const driverMatch = bid.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSearch = searchTerm === '' || loadMatch || driverMatch;
      const matchStatus = statusFilter === 'all' || bid.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bids, searchTerm, statusFilter]);

  return (
    <OperationalPageLayout
      title="Bidding Management"
      description="Review and manage freight bids from carriers and drivers"
    >
      {loading ? (
        <ModernLoader isLoading={true} type="page" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Bids"
              value={stats.total}
              icon={<FaGavel size={22} />}
              color="primary"
              variant="classic"
              subtitle="All received bids"
            />
            <StatCard
              title="Pending Approval"
              value={stats.pending}
              icon={<FaClock size={22} />}
              color="warning"
              variant="classic"
              subtitle="Awaiting response"
            />
            <StatCard
              title="Accepted"
              value={stats.accepted}
              icon={<FaCheckCircle size={22} />}
              color="success"
              variant="classic"
              subtitle="Won bids"
            />
            <StatCard
              title="Rejected"
              value={stats.rejected}
              icon={<FaTimesCircle size={22} />}
              color="error"
              variant="classic"
              subtitle="Lost bids"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bids by load ID or driver name..."
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
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Load / Route</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Driver / Truck</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredBids.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No bids found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold">{bid.loadId || 'Unknown Load'}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <FaMapMarkerAlt size={10} /> {bid.loadOrigin} → {bid.loadDestination}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                        ${bid.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 dark:text-gray-200">{bid.driverName || 'Unassigned'}</div>
                        <div className="text-xs text-gray-500 mt-1">Truck: {bid.truckId || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(bid.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize
                          ${bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            bid.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {bid.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary-600 hover:text-primary-800 text-sm font-semibold">
                          View Details
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

export default OperationalAdminBidding;
