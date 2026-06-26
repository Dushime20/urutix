import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, Search, Eye, Edit, Trash2, Truck, User, MapPin, Calendar } from 'lucide-react';
import { tripsAPI } from '../services/api';
import toast from 'react-hot-toast';
import ModernLoader from '../components/common/ModernLoader';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { getApiErrorMessage } from '../config/errorMessages';

const Trips = () => {
  const { compact: fmtMoney } = useCurrencyFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['trips', searchTerm, statusFilter],
    queryFn: () => tripsAPI.getAll({ search: searchTerm, status: statusFilter !== 'all' ? statusFilter : undefined }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tripsAPI.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip status updated successfully');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'in_progress':
        return 'bg-primary-100 text-primary-800';
      case 'planned':
        return 'bg-warning-100 text-warning-800';
      case 'cancelled':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return <ModernLoader isLoading={true} type="table" rows={10} columns={7} />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">Failed to load trips</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-600 mt-2">Manage and track your cargo trips</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Trip
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn btn-outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Trips List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Trips</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {trips?.data?.trips?.map((trip: any) => (
            <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {trip.tripNumber}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {getStatusText(trip.status)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4" />
                      <span>{trip.truck?.licensePlate || 'No truck assigned'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{trip.driver?.name || 'No driver assigned'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{trip.load?.pickupLocation?.city} → {trip.load?.deliveryLocation?.city}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Planned: {new Date(trip.plannedStartTime).toLocaleDateString()}</span>
                    </div>
                    <span>•</span>
                    <span>{trip.agreedPrice != null ? fmtMoney(trip.agreedPrice) : '—'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {trips?.data?.trips?.length === 0 && (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No trips found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new trip.
          </p>
        </div>
      )}
    </div>
  );
};

export default Trips; 