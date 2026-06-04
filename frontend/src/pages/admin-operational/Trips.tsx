import React, { useState, useEffect, useMemo } from 'react';
import { FaTruck, FaMapMarkerAlt, FaEye, FaSearch, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import type { Trip } from '../../services/tenantApi';
import ModernLoader from '../../components/common/ModernLoader';
import { StatCard } from '../../components/EnliteUI';
import toast from 'react-hot-toast';

const OperationalAdminTrips: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await operationalAdminApi.getTrips();
      // Unwrap whatever shape the API returns — always end up with an array
      const raw: any[] = Array.isArray(res) ? res : res?.trips ?? res?.data ?? res?.items ?? [];
      setTrips(raw);
    } catch (error) {
      toast.error('Failed to load trips');
      console.error(error);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchSearch = trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || trip.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [trips, searchTerm, statusFilter]);

  const stats = {
    total: trips.length,
    completed: trips.filter(t => t.status === 'COMPLETED').length,
    active: trips.filter(t => t.status === 'IN_PROGRESS').length,
    delayed: trips.filter(t => t.status === 'DELAYED').length,
  };

  return (
    <OperationalPageLayout
      title="Trip Monitoring"
      description="Manage and monitor all active trips within your operations"
    >
      {loading ? (
        <ModernLoader isLoading={true} type="page" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Trips"
              value={stats.total}
              icon={<FaTruck size={22} />}
              color="primary"
              variant="classic"
              subtitle="All time trips"
            />
            <StatCard
              title="Active Trips"
              value={stats.active}
              icon={<FaMapMarkerAlt size={22} />}
              color="primary"
              variant="classic"
              subtitle="Currently in progress"
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={<FaCheck size={22} />}
              color="primary"
              variant="classic"
              subtitle="Successfully delivered"
            />
            <StatCard
              title="Delayed"
              value={stats.delayed}
              icon={<FaExclamationTriangle size={22} />}
              color="error"
              variant="classic"
              subtitle="Requiring attention"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search trips by reference..."
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
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="DELAYED">Delayed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Reference</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Truck</th>
                  <th className="px-6 py-4 font-semibold">Origin</th>
                  <th className="px-6 py-4 font-semibold">Destination</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No trips found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-semibold">{trip.tripNumber || `TRP-${trip.id.slice(0, 6)}`}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{trip.truckNumber || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {typeof trip.origin === 'object' ? trip.origin?.name : trip.origin || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {typeof trip.destination === 'object' ? trip.destination?.name : trip.destination || 'N/A'}
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

export default OperationalAdminTrips;
