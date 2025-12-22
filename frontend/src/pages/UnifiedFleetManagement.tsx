import React, { useState, useEffect, useCallback } from 'react';
import { FaTruck, FaPlus, FaRoute, FaList, FaSpinner, FaEye, FaMapMarkerAlt, FaTimesCircle, FaSync, FaSearch } from 'react-icons/fa';
import { TrucksList } from '../components/FleetDashboard/TrucksList';
import FleetFormStepper from '../components/FleetDashboard/FleetFormStepper';
import { fleetApi } from '../services/fleetApi';
import { tripsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

const UnifiedFleetManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'add-truck' | 'my-trucks' | 'active-trips' | 'view-trucks'>('my-trucks');
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<any>(null);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  const [trucksListRefreshKey, setTrucksListRefreshKey] = useState(0);
  const [viewTrucksSearch, setViewTrucksSearch] = useState('');

  // Load active trips
  const loadActiveTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      // Try the dedicated active endpoint first
      try {
        const response = await tripsAPI.getActive();
        const tripsData = response.data?.data || response.data || [];
        setActiveTrips(Array.isArray(tripsData) ? tripsData : []);
      } catch (activeError: any) {
        // If active endpoint fails (404), fallback to filtering getAll
        if (activeError?.response?.status === 404) {
          console.warn('Active trips endpoint not available (404), using fallback with status filter');
          try {
            // Try with IN_PROGRESS status first
            const response = await tripsAPI.getAll({ 
              status: 'IN_PROGRESS',
              limit: 100 
            });
            let allTrips = response.data?.data || response.data?.trips || response.data || [];
            
            // If response is paginated, extract trips array
            if (allTrips && !Array.isArray(allTrips) && allTrips.trips) {
              allTrips = allTrips.trips;
            }
            
            // Filter for active statuses (handle various status formats)
            const activeTripsData = Array.isArray(allTrips) 
              ? allTrips.filter((trip: any) => {
                  const status = (trip.status || '').toUpperCase().replace(/\s+/g, '_');
                  return ['IN_PROGRESS', 'IN_TRANSIT', 'ACTIVE', 'ONGOING', 'IN_TRANSIT'].includes(status);
                })
              : [];
            setActiveTrips(activeTripsData);
          } catch (fallbackError: any) {
            console.error('Fallback also failed:', fallbackError);
            setActiveTrips([]);
          }
        } else {
          // For other errors, throw to be caught by outer catch
          throw activeError;
        }
      }
    } catch (error: any) {
      console.error('Error loading active trips:', error);
      // Only show error toast if it's not a 404 (endpoint might not exist)
      if (error?.response?.status !== 404) {
        toast.error('Failed to load active trips');
      }
      setActiveTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  // Load trucks for reference
  const loadTrucks = useCallback(async () => {
    setLoadingTrucks(true);
    try {
      // fleetApi.getTrucks() already returns the trucks array directly
      const trucksData = await fleetApi.getTrucks({});
      console.log('🚛 UnifiedFleetManagement - Trucks data:', trucksData);
      console.log('🚛 UnifiedFleetManagement - Trucks length:', Array.isArray(trucksData) ? trucksData.length : 'N/A');
      setTrucks(Array.isArray(trucksData) ? trucksData : []);
    } catch (error: any) {
      console.error('Error loading trucks:', error);
      setTrucks([]);
    } finally {
      setLoadingTrucks(false);
    }
  }, []);

  useEffect(() => {
    // Load trucks count on mount
    loadTrucks();
  }, [loadTrucks]);

  useEffect(() => {
    if (activeTab === 'active-trips') {
      loadActiveTrips();
    }
    if (activeTab === 'my-trucks') {
      loadTrucks();
      // Also trigger TrucksList refresh when switching to my-trucks tab
      setTrucksListRefreshKey(prev => prev + 1);
    }
  }, [activeTab, loadActiveTrips, loadTrucks]);

  const handleCreateTruck = () => {
    setEditingTruck(null);
    setShowTruckForm(true);
    setActiveTab('add-truck');
  };

  const handleEditTruck = (truck: any) => {
    setEditingTruck(truck);
    setShowTruckForm(true);
    setActiveTab('add-truck');
  };

  const handleTruckFormClose = () => {
    setShowTruckForm(false);
    setEditingTruck(null);
    // Refresh trucks list after form closes
    if (activeTab === 'my-trucks') {
      loadTrucks();
    }
  };

  const handleTruckFormSubmit = async (truckData: any) => {
    try {
      if (editingTruck) {
        await fleetApi.updateTruck(editingTruck.id, truckData);
        toast.success('Truck updated successfully');
      } else {
        await fleetApi.createTruck(truckData);
        toast.success('Truck created successfully');
      }
      setShowTruckForm(false);
      setEditingTruck(null);
      // Refresh trucks list
      loadTrucks();
      // Trigger TrucksList component refresh
      setTrucksListRefreshKey(prev => prev + 1);
      // Switch to my trucks tab to see the new/updated truck
      setActiveTab('my-trucks');
    } catch (error: any) {
      console.error('Error saving truck:', error);
      toast.error(error?.response?.data?.message || 'Failed to save truck');
      throw error;
    }
  };

  const getTripStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'IN_PROGRESS':
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Truck Management</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Manage your trucks, view active trips, and add new vehicles</p>
          </div>
          <div className="relative group flex-shrink-0">
            <button
              onClick={handleCreateTruck}
              className="relative w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full sm:rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
              aria-label="Add New Truck"
            >
              <FaPlus className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline font-medium">Add New Truck</span>
            </button>
            {/* Tooltip for mobile */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block sm:hidden z-50">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <FaPlus className="w-3 h-3" />
                  <span>Add New Truck</span>
                </div>
                <div className="absolute top-full right-4 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
              </div>
            </div>
            {/* Enhanced tooltip for desktop hover */}
            <div className="absolute bottom-full right-0 mb-2 hidden sm:group-hover:block z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-xl max-w-xs">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <FaPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Add New Truck</p>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Register a new vehicle to your fleet. Fill in truck details, specifications, and equipment information.
                    </p>
                  </div>
                </div>
                <div className="absolute top-full right-6 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => {
            setActiveTab('add-truck');
            setShowTruckForm(true);
          }}
          className={cn(
            "relative bg-white rounded-lg border p-3.5 transition-all duration-200 hover:shadow-sm group text-left",
            activeTab === 'add-truck'
              ? "border-gray-300 shadow-sm bg-gray-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                activeTab === 'add-truck'
                  ? "bg-gray-100 text-gray-700"
                  : "bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700"
              )}
            >
              <FaPlus className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={cn(
              "text-sm font-semibold mb-1",
              activeTab === 'add-truck' ? "text-gray-900" : "text-gray-900"
            )}
          >
            Add Truck
          </h3>
          <p className={cn(
            "text-xs leading-tight",
            activeTab === 'add-truck' ? "text-gray-600" : "text-gray-500"
          )}>
            Register new vehicles with complete details, documents, and specifications
          </p>
          {activeTab === 'add-truck' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('my-trucks');
            setShowTruckForm(false);
          }}
          className={cn(
            "relative bg-white rounded-lg border p-3.5 transition-all duration-200 hover:shadow-sm group text-left",
            activeTab === 'my-trucks'
              ? "border-gray-300 shadow-sm bg-gray-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center mb-2">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                activeTab === 'my-trucks'
                  ? "bg-gray-100 text-gray-700"
                  : "bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700"
              )}
            >
              <FaList className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={cn(
              "text-sm font-semibold mb-1",
              activeTab === 'my-trucks' ? "text-gray-900" : "text-gray-900"
            )}
          >
            Manage Trucks
          </h3>
          <p className={cn(
            "text-xs leading-tight",
            activeTab === 'my-trucks' ? "text-gray-600" : "text-gray-500"
          )}>
            View, edit, and manage your fleet vehicles, status, and assignments
          </p>
          {activeTab === 'my-trucks' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('active-trips');
            setShowTruckForm(false);
          }}
          className={cn(
            "relative bg-white rounded-lg border p-3.5 transition-all duration-200 hover:shadow-sm group text-left",
            activeTab === 'active-trips'
              ? "border-gray-300 shadow-sm bg-gray-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                activeTab === 'active-trips'
                  ? "bg-gray-100 text-gray-700"
                  : "bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700"
              )}
            >
              <FaRoute className="w-4 h-4" />
            </div>
            <span
              className={cn(
                "px-2 py-0.5 text-xs font-semibold rounded-full",
                activeTab === 'active-trips'
                  ? "bg-gray-200 text-gray-700"
                  : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
              )}
            >
              {activeTrips.length}
            </span>
          </div>
          <h3
            className={cn(
              "text-sm font-semibold mb-1",
              activeTab === 'active-trips' ? "text-gray-900" : "text-gray-900"
            )}
          >
            Active Trips
          </h3>
          <p className={cn(
            "text-xs leading-tight",
            activeTab === 'active-trips' ? "text-gray-600" : "text-gray-500"
          )}>
            Monitor ongoing trips, track progress, and manage active shipments
          </p>
          {activeTab === 'active-trips' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('view-trucks');
            setShowTruckForm(false);
          }}
          className={cn(
            "relative bg-white rounded-lg border p-3.5 transition-all duration-200 hover:shadow-sm group text-left",
            activeTab === 'view-trucks'
              ? "border-gray-300 shadow-sm bg-gray-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                "p-1.5 rounded-md transition-colors",
                activeTab === 'view-trucks'
                  ? "bg-gray-100 text-gray-700"
                  : "bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:text-gray-700"
              )}
            >
              <FaEye className="w-4 h-4" />
            </div>
          </div>
          <h3
            className={cn(
              "text-sm font-semibold mb-1",
              activeTab === 'view-trucks' ? "text-gray-900" : "text-gray-900"
            )}
          >
            View Trucks
          </h3>
          <p className={cn(
            "text-xs leading-tight",
            activeTab === 'view-trucks' ? "text-gray-600" : "text-gray-500"
          )}>
            Browse and search all fleet vehicles with detailed information
          </p>
          {activeTab === 'view-trucks' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 rounded-b-lg" />
          )}
        </button>
      </div>

      {/* Content Container */}
      {activeTab === 'add-truck' && (
        <div>
          {!showTruckForm ? (
            <div className="text-center py-12">
              <FaTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="mb-2">Add New Truck</h3>
              <p className="text-gray-600 mb-6">Click the button below to start adding a new truck to your fleet</p>
              <button
                onClick={handleCreateTruck}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <FaPlus className="w-4 h-4" />
                Add Truck
              </button>
            </div>
          ) : null}
          {/* FleetFormStepper renders as a modal overlay, so it's always rendered when showTruckForm is true */}
          <FleetFormStepper
            isOpen={showTruckForm}
            onClose={handleTruckFormClose}
            onSubmit={handleTruckFormSubmit}
            initialData={editingTruck}
            mode={editingTruck ? 'edit' : 'create'}
            activeTab="trucks"
          />
        </div>
      )}

      {activeTab === 'my-trucks' && (
        <TrucksList onAddTruck={handleCreateTruck} refreshTrigger={trucksListRefreshKey} />
      )}

      {activeTab === 'view-trucks' && (
        <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2>View Trucks</h2>
                <div className="flex items-center gap-3">
                  {/* Search Box */}
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by plate number..."
                      value={viewTrucksSearch}
                      onChange={(e) => setViewTrucksSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                    />
                  </div>
                  <button
                    onClick={loadTrucks}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 flex items-center gap-2.5 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md font-medium text-sm"
                    disabled={loadingTrucks}
                  >
                    {loadingTrucks ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span>Refreshing...</span>
                      </>
                    ) : (
                      <>
                        <FaSync className="w-4 h-4" />
                        <span>Refresh</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {loadingTrucks ? (
                <div className="text-center py-12">
                  <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading trucks...</p>
                </div>
              ) : trucks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FaTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trucks Found</h3>
                  <p className="text-gray-600">You don't have any trucks in your fleet yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plate Number</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Truck Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Max Weight</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Current Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trucks
                        .filter((truck) => {
                          if (!viewTrucksSearch) return true;
                          const searchLower = viewTrucksSearch.toLowerCase();
                          return (
                            truck.plateNumber?.toLowerCase().includes(searchLower) ||
                            truck.truckType?.toLowerCase().includes(searchLower) ||
                            truck.capacityWeight?.toString().includes(searchLower) ||
                            (typeof truck.currentLocation === 'string' 
                              ? truck.currentLocation.toLowerCase().includes(searchLower)
                              : truck.currentLocation?.address?.toLowerCase().includes(searchLower))
                          );
                        })
                        .map((truck) => (
                        <tr
                          key={truck.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <FaTruck className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{truck.plateNumber || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-700">
                              {truck.truckType ? truck.truckType.replace(/_/g, ' ') : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-700">
                              {truck.capacityWeight 
                                ? `${Number(truck.capacityWeight).toLocaleString()} kg`
                                : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">
                                {truck.currentLocation 
                                  ? (typeof truck.currentLocation === 'string' 
                                      ? truck.currentLocation 
                                      : truck.currentLocation.address || 'N/A')
                                  : 'Not specified'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {trucks.filter((truck) => {
                        if (!viewTrucksSearch) return true;
                        const searchLower = viewTrucksSearch.toLowerCase();
                        return (
                          truck.plateNumber?.toLowerCase().includes(searchLower) ||
                          truck.truckType?.toLowerCase().includes(searchLower) ||
                          truck.capacityWeight?.toString().includes(searchLower) ||
                          (typeof truck.currentLocation === 'string' 
                            ? truck.currentLocation.toLowerCase().includes(searchLower)
                            : truck.currentLocation?.address?.toLowerCase().includes(searchLower))
                        );
                      }).length === 0 && viewTrucksSearch && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-500">
                            No trucks found matching "{viewTrucksSearch}"
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
        </div>
      )}

      {activeTab === 'active-trips' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2>Active Trips</h2>
                <button
                  onClick={loadActiveTrips}
                  className="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md font-medium text-sm"
                  disabled={loadingTrips}
                >
                  {loadingTrips ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <FaSync className="w-4 h-4" />
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>

              {loadingTrips ? (
                <div className="text-center py-12">
                  <FaSpinner className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading active trips...</p>
                </div>
              ) : activeTrips.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FaRoute className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Trips</h3>
                  <p className="text-gray-600">You don't have any active trips at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTrips.map((trip: any) => (
                    <div
                      key={trip.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {trip.tripNumber || `Trip ${trip.id?.substring(0, 8)}`}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTripStatusColor(trip.status)}`}>
                              {trip.status || 'IN_PROGRESS'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {trip.origin && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 min-w-[80px]">Origin:</span>
                                <span className="text-gray-900">{trip.origin}</span>
                              </div>
                            )}
                            {trip.destination && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 min-w-[80px]">Destination:</span>
                                <span className="text-gray-900">{trip.destination}</span>
                              </div>
                            )}
                            {trip.agreedPrice && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 min-w-[80px]">Price:</span>
                                <span className="text-gray-900 font-semibold">${trip.agreedPrice.toLocaleString()}</span>
                              </div>
                            )}
                            {trip.truckId && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 min-w-[80px]">Truck ID:</span>
                                <span className="text-gray-900">{trip.truckId.substring(0, 8)}...</span>
                              </div>
                            )}
                            {trip.startDate && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 min-w-[80px]">Start Date:</span>
                                <span className="text-gray-900">
                                  {new Date(trip.startDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {trip.estimatedArrival && (
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 min-w-[80px]">ETA:</span>
                                <span className="text-gray-900">
                                  {new Date(trip.estimatedArrival).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>
      )}

      {/* Truck Form Modal (when opened from My Trucks tab) */}
      {showTruckForm && activeTab === 'my-trucks' && (
        <FleetFormStepper
          isOpen={showTruckForm}
          onClose={handleTruckFormClose}
          onSubmit={handleTruckFormSubmit}
          initialData={editingTruck}
          mode={editingTruck ? 'edit' : 'create'}
          activeTab="trucks"
        />
      )}
    </div>
  );
};

export default UnifiedFleetManagement;

