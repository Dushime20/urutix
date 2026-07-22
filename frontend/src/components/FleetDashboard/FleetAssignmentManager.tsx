import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Truck,
  Route,
  Plus,
  Trash2,
  Edit,
  Link,
  Unlink,
  MapPin,
  User,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';
import { fleetApi } from '../../services/fleetApi';
import toast from 'react-hot-toast';

interface Assignment {
  id: string;
  driverId: string;
  truckId: string;
  routeId: string;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    status: string;
  };
  truck: {
    id: string;
    plateNumber: string;
    make: string;
    model: string;
    status: string;
  };
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
    distance: number;
  };
  assignedAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED';
}

const FleetAssignmentManager = () => {
  const [activeTab, setActiveTab] = useState('assignments');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const queryClient = useQueryClient();

  // Fetch all data
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => fleetApi.getDrivers(),
  });

  const { data: trucks = [], isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => fleetApi.getTrucks(),
  });

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: () => fleetApi.getRoutes(),
  });

  // Mock assignments data - replace with actual API call
  const assignments: Assignment[] = [
    // This would come from your backend
  ];

  const isLoading = driversLoading || trucksLoading || routesLoading;
  // Get available items (not already assigned)
  const getAvailableDrivers = () => {
    return drivers.filter(driver => 
      driver.status === 'ACTIVE' && 
      !driver.currentTruckId &&
      !assignments.some(a => a.driverId === driver.id && a.status === 'ACTIVE')
    );
  };

  const getAvailableTrucks = () => {
    return trucks.filter(truck => 
      truck.status === 'AVAILABLE' && 
      !assignments.some(a => a.truckId === truck.id && a.status === 'ACTIVE')
    );
  };

  const getAvailableRoutes = () => {
    return routes.filter(route => 
      !assignments.some(a => a.routeId === route.id && a.status === 'ACTIVE')
    );
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.driver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.driver.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.route.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || assignment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'INACTIVE': return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'COMPLETED': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-200">Fleet Assignment Manager</h2>
          <p className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Connect drivers, trucks, and routes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Create Assignment
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'assignments', label: 'Active Assignments', icon: Link },
            { id: 'drivers', label: 'Drivers', icon: Users },
            { id: 'trucks', label: 'Trucks', icon: Truck },
            { id: 'routes', label: 'Routes', icon: Route }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent w-full transition-colors duration-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors duration-200"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Assignments Grid */}
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <Link className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 transition-colors duration-200" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-200">No Assignments Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 transition-colors duration-200">Create your first assignment to connect drivers, trucks, and routes.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 dark:bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors duration-200"
              >
                Create Assignment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAssignments.map(assignment => (
                <AssignmentCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map(driver => (
              <DriverCard key={driver.id} driver={driver} />
            ))}
          </div>
        </div>
      )}

      {/* Trucks Tab */}
      {activeTab === 'trucks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trucks.map(truck => (
              <TruckCard key={truck.id} truck={truck} />
            ))}
          </div>
        </div>
      )}

      {/* Routes Tab */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map(route => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <CreateAssignmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          availableDrivers={getAvailableDrivers()}
          availableTrucks={getAvailableTrucks()}
          availableRoutes={getAvailableRoutes()}
        />
      )}
    </div>
  );
};
// Assignment Card Component
const AssignmentCard = ({ assignment }: { assignment: Assignment }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
          {assignment.status}
        </span>
        <div className="flex items-center gap-2">
          <button className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200">
            <Unlink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Driver Info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white transition-colors duration-200">
            {assignment.driver.firstName} {assignment.driver.lastName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">License: {assignment.driver.licenseNumber}</p>
        </div>
      </div>

      {/* Truck Info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <Truck className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white transition-colors duration-200">{assignment.truck.plateNumber}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{assignment.truck.make} {assignment.truck.model}</p>
        </div>
      </div>

      {/* Route Info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <Route className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white transition-colors duration-200">{assignment.route.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
            {assignment.route.origin} → {assignment.route.destination}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
        <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
        <span>{assignment.route.distance} km</span>
      </div>
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'INACTIVE': return 'bg-slate-50 text-slate-600 border-slate-200';
    case 'COMPLETED': return 'bg-blue-50 text-blue-600 border-blue-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};
// Driver Card Component
const DriverCard = ({ driver }: { driver: any }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/20 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white transition-colors duration-200">{driver.firstName} {driver.lastName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">License: {driver.licenseNumber}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
          driver.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}>
          {driver.status}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">Experience: {driver.experience || 0} years</span>
      </div>
    </div>
  );
};

// Truck Card Component
const TruckCard = ({ truck }: { truck: any }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-950/20 rounded-full flex items-center justify-center">
          <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white transition-colors duration-200">{truck.plateNumber}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{truck.make} {truck.model}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
          truck.status === 'AVAILABLE' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
        }`}>
          {truck.status}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{truck.capacityWeight}t</span>
      </div>
    </div>
  );
};

// Route Card Component
const RouteCard = ({ route }: { route: any }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/20 rounded-full flex items-center justify-center">
          <Route className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white transition-colors duration-200">{route.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{route.origin} → {route.destination}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{route.distance} km</span>
        <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">{route.estimatedTime}h</span>
      </div>
    </div>
  );
};
// Import the CreateAssignmentModal
import CreateAssignmentModal from './CreateAssignmentModal';

export default FleetAssignmentManager;