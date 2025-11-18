import React, { useState, useEffect } from 'react';
import { FaRoute, FaTruck, FaPlus, FaMinus, FaSync, FaCheck, FaTimes } from 'react-icons/fa';
import { fleetApi } from '../../services/fleetApi';
import type { FleetItem, Route } from '../../services/fleetApi';
import { toast } from 'react-hot-toast';

interface RouteAssignmentManagerProps {
  className?: string;
}

interface TruckWithRoutes extends FleetItem {
  assignedRouteDetails?: Route[];
}

export const RouteAssignmentManager: React.FC<RouteAssignmentManagerProps> = ({ className = '' }) => {
  const [trucks, setTrucks] = useState<TruckWithRoutes[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState(false);

  // Load trucks and routes
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trucksData, routesData] = await Promise.all([
        fleetApi.getTrucks(),
        fleetApi.fetchRoutes()
      ]);

      // Load route details for each truck
      const trucksWithRoutes = await Promise.all(
        trucksData.map(async (truck) => {
          try {
            const truckRoutes = await fleetApi.getTruckRoutes(truck.id);
            return {
              ...truck,
              assignedRouteDetails: truckRoutes
            };
          } catch (error) {
            console.error(`Failed to load routes for truck ${truck.id}:`, error);
            return {
              ...truck,
              assignedRouteDetails: []
            };
          }
        })
      );

      setTrucks(trucksWithRoutes);
      setRoutes(routesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load trucks and routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignRoute = async (truckId: string, routeId: string) => {
    try {
      await fleetApi.assignRouteToTruck(truckId, routeId);
      toast.success('Route assigned successfully!');
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error assigning route:', error);
      toast.error('Failed to assign route');
    }
  };

  const handleUnassignRoute = async (truckId: string, routeId: string) => {
    try {
      await fleetApi.unassignRouteFromTruck(truckId, routeId);
      toast.success('Route unassigned successfully!');
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error unassigning route:', error);
      toast.error('Failed to unassign route');
    }
  };

  const handleBulkAssign = async (assignments: { routeId: string; truckId: string }[]) => {
    try {
      const result = await fleetApi.bulkAssignRoutes(assignments);
      toast.success(`Bulk assignment completed: ${result.successful}/${result.total} successful`);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error bulk assigning routes:', error);
      toast.error('Failed to complete bulk assignment');
    }
  };

  const getUnassignedRoutes = (truckId: string) => {
    const truck = trucks.find(t => t.id === truckId);
    if (!truck) return routes;
    
    const assignedRouteIds = truck.assignedRouteDetails?.map(r => r.id) || [];
    return routes.filter(route => !assignedRouteIds.includes(route.id));
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaSync className="inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaRoute className="mr-3 text-blue-600" />
          Route Assignment Manager
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
          >
            <FaSync className="mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setAssignMode(!assignMode)}
            className={`px-4 py-2 rounded flex items-center ${
              assignMode 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {assignMode ? <FaTimes className="mr-2" /> : <FaPlus className="mr-2" />}
            {assignMode ? 'Cancel Assignment' : 'Assign Routes'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaTruck className="text-blue-600 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Trucks</p>
              <p className="text-2xl font-bold text-blue-600">{trucks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaRoute className="text-green-600 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-green-600">{routes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaCheck className="text-purple-600 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-purple-600">
                {trucks.reduce((sum, truck) => sum + (truck.assignedRouteDetails?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Truck List with Route Assignments */}
      <div className="space-y-4">
        {trucks.map((truck) => (
          <div key={truck.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {truck.plateNumber} - {truck.make} {truck.model}
                </h3>
                <p className="text-sm text-gray-600">
                  Status: <span className={`px-2 py-1 rounded text-xs ${
                    truck.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                    truck.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                    truck.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {truck.status}
                  </span>
                </p>
              </div>
              {assignMode && (
                <button
                  onClick={() => setSelectedTruck(selectedTruck === truck.id ? null : truck.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedTruck === truck.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {selectedTruck === truck.id ? 'Cancel' : 'Assign Routes'}
                </button>
              )}
            </div>

            {/* Assigned Routes */}
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Assigned Routes ({truck.assignedRouteDetails?.length || 0})
              </h4>
              {truck.assignedRouteDetails && truck.assignedRouteDetails.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {truck.assignedRouteDetails.map((route) => (
                    <div
                      key={route.id}
                      className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{route.name}</span>
                      <button
                        onClick={() => handleUnassignRoute(truck.id, route.id)}
                        className="ml-2 text-red-600 hover:text-red-800"
                        title="Unassign route"
                      >
                        <FaMinus size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No routes assigned</p>
              )}
            </div>

            {/* Route Assignment Interface */}
            {assignMode && selectedTruck === truck.id && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Routes</h4>
                <div className="flex flex-wrap gap-2">
                  {getUnassignedRoutes(truck.id).map((route) => (
                    <button
                      key={route.id}
                      onClick={() => handleAssignRoute(truck.id, route.id)}
                      className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm hover:bg-green-200"
                      title={`${route.origin} → ${route.destination}`}
                    >
                      <FaPlus size={12} className="mr-1" />
                      {route.name}
                    </button>
                  ))}
                </div>
                {getUnassignedRoutes(truck.id).length === 0 && (
                  <p className="text-sm text-gray-500 italic">All routes are already assigned to this truck</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {trucks.length === 0 && (
        <div className="text-center py-8">
          <FaTruck className="mx-auto text-4xl text-gray-400 mb-4" />
          <p className="text-gray-600">No trucks found. Add trucks to start managing route assignments.</p>
        </div>
      )}
    </div>
  );
};

export default RouteAssignmentManager;
