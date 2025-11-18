import React, { useState, useEffect, useCallback } from 'react';
import { FaTruck, FaPlus, FaRoute, FaList, FaSpinner } from 'react-icons/fa';
import { TrucksList } from '../components/FleetDashboard/TrucksList';
import FleetFormStepper from '../components/FleetDashboard/FleetFormStepper';
import { fleetApi } from '../services/fleetApi';
import { tripsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

const UnifiedFleetManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'add-truck' | 'my-trucks' | 'active-trips'>('my-trucks');
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [editingTruck, setEditingTruck] = useState<any>(null);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loadingTrucks, setLoadingTrucks] = useState(false);
  const [trucksListRefreshKey, setTrucksListRefreshKey] = useState(0);

  // Load active trips
  const loadActiveTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const response = await tripsAPI.getActive();
      const tripsData = response.data?.data || response.data || [];
      setActiveTrips(Array.isArray(tripsData) ? tripsData : []);
    } catch (error: any) {
      console.error('Error loading active trips:', error);
      toast.error('Failed to load active trips');
      setActiveTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  // Load trucks for reference
  const loadTrucks = useCallback(async () => {
    setLoadingTrucks(true);
    try {
      const trucksData = await fleetApi.getTrucks({});
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Truck Management</h1>
        <p className="text-gray-600">Manage your trucks, view active trips, and add new vehicles</p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => {
            setActiveTab('add-truck');
            setShowTruckForm(true);
          }}
          className={cn(
            "relative bg-white rounded-lg border-2 p-5 transition-all duration-200 hover:shadow-lg group",
            activeTab === 'add-truck'
              ? "border-primary-600 shadow-md bg-primary-50"
              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                "p-2 rounded-lg transition-colors",
                activeTab === 'add-truck'
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600"
              )}
            >
              <FaPlus className="w-5 h-5" />
            </div>
          </div>
          <h3
            className={cn(
              "text-base font-semibold text-left",
              activeTab === 'add-truck' ? "text-primary-900" : "text-gray-900"
            )}
          >
            Add Truck
          </h3>
          {activeTab === 'add-truck' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('my-trucks');
            setShowTruckForm(false);
          }}
          className={cn(
            "relative bg-white rounded-lg border-2 p-5 transition-all duration-200 hover:shadow-lg group",
            activeTab === 'my-trucks'
              ? "border-primary-600 shadow-md bg-primary-50"
              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                "p-2 rounded-lg transition-colors",
                activeTab === 'my-trucks'
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600"
              )}
            >
              <FaList className="w-5 h-5" />
            </div>
            <span
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-full",
                activeTab === 'my-trucks'
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-700 group-hover:bg-primary-600 group-hover:text-white"
              )}
            >
              {trucks.length}
            </span>
          </div>
          <h3
            className={cn(
              "text-base font-semibold text-left",
              activeTab === 'my-trucks' ? "text-primary-900" : "text-gray-900"
            )}
          >
            My Trucks
          </h3>
          {activeTab === 'my-trucks' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-b-lg" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('active-trips');
            setShowTruckForm(false);
          }}
          className={cn(
            "relative bg-white rounded-lg border-2 p-5 transition-all duration-200 hover:shadow-lg group",
            activeTab === 'active-trips'
              ? "border-primary-600 shadow-md bg-primary-50"
              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div
              className={cn(
                "p-2 rounded-lg transition-colors",
                activeTab === 'active-trips'
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600"
              )}
            >
              <FaRoute className="w-5 h-5" />
            </div>
            <span
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-full",
                activeTab === 'active-trips'
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-700 group-hover:bg-primary-600 group-hover:text-white"
              )}
            >
              {activeTrips.length}
            </span>
          </div>
          <h3
            className={cn(
              "text-base font-semibold text-left",
              activeTab === 'active-trips' ? "text-primary-900" : "text-gray-900"
            )}
          >
            Active Trips
          </h3>
          {activeTab === 'active-trips' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-b-lg" />
          )}
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'add-truck' && (
            <div>
              {!showTruckForm ? (
                <div className="text-center py-12">
                  <FaTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Truck</h3>
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
            <div>
              <TrucksList onAddTruck={handleCreateTruck} refreshTrigger={trucksListRefreshKey} />
            </div>
          )}

          {activeTab === 'active-trips' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Active Trips</h2>
                <button
                  onClick={loadActiveTrips}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  disabled={loadingTrips}
                >
                  {loadingTrips ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <FaRoute className="w-4 h-4" />
                  )}
                  Refresh
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
        </div>
      </div>

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

