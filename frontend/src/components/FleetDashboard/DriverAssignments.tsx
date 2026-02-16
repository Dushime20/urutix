import React, { useState, useEffect, useCallback } from 'react';
import { FaTruck, FaUser, FaPlus, FaTimes, FaSearch, FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { fleetApi, type FleetItem, type Driver, type DriverAssignment } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';

export const DriverAssignments: React.FC = () => {
  const [trucks, setTrucks] = useState<FleetItem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTruck, setSearchTruck] = useState('');
  const [searchDriver, setSearchDriver] = useState('');
  const [selectedTruck, setSelectedTruck] = useState<FleetItem | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Load trucks and drivers
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [trucksData, driversData] = await Promise.all([
        fleetApi.getTrucks({}),
        fleetApi.getDrivers({ status: 'ACTIVE' })
      ]);
      setTrucks(trucksData);
      setDrivers(driversData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load trucks and drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter trucks
  const filteredTrucks = trucks.filter(truck => {
    const searchLower = searchTruck.toLowerCase();
    return (
      truck.plateNumber?.toLowerCase().includes(searchLower) ||
      truck.make?.toLowerCase().includes(searchLower) ||
      truck.model?.toLowerCase().includes(searchLower) ||
      `${truck.make} ${truck.model}`.toLowerCase().includes(searchLower)
    );
  });

  // Get available drivers for a truck (not already assigned)
  const getAvailableDrivers = (truck: FleetItem): Driver[] => {
    const assignedDriverIds = (truck.assignedDrivers || []).map(a => a.driverId);
    return drivers.filter(driver => !assignedDriverIds.includes(driver.id));
  };

  // Handle assign driver
  const handleAssignDriver = async (truckId: string, driverId: string) => {
    setAssigning(true);
    try {
      await fleetApi.assignDriverToTruck(truckId, driverId, {
        notes: assignmentNotes || undefined
      });
      toast.success('Driver assigned successfully!');
      setShowAssignModal(false);
      setSelectedTruck(null);
      setAssignmentNotes('');
      await loadData(); // Refresh data
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign driver';
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  // Handle unassign driver
  const handleUnassignDriver = async (truckId: string, driverId: string) => {
    if (!confirm('Are you sure you want to unassign this driver from the truck?')) {
      return;
    }

    try {
      await fleetApi.unassignDriverFromTruck(truckId, driverId);
      toast.success('Driver unassigned successfully!');
      await loadData(); // Refresh data
    } catch (error: any) {
      console.error('Error unassigning driver:', error);
      const errorMessage = error.response?.data?.message || 'Failed to unassign driver';
      toast.error(errorMessage);
    }
  };

  // Open assign modal
  const openAssignModal = (truck: FleetItem) => {
    setSelectedTruck(truck);
    setShowAssignModal(true);
    setAssignmentNotes('');
    setSearchDriver('');
  };

  if (loading && trucks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading assignments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTruck}
              onChange={(e) => setSearchTruck(e.target.value)}
              placeholder="Search trucks by plate, make, or model..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Trucks List */}
      <div className="space-y-4">
        {filteredTrucks.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FaTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trucks Found</h3>
            <p className="text-gray-600">
              {searchTruck ? 'Try adjusting your search criteria' : 'No trucks available for driver assignment'}
            </p>
          </div>
        ) : (
          filteredTrucks.map((truck) => {
            const assignedDrivers = truck.assignedDrivers || [];
            const availableDrivers = getAvailableDrivers(truck);

            return (
              <div key={truck.id} className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Truck Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-100 rounded-lg">
                      <FaTruck className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {truck.make} {truck.model}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Plate: {truck.plateNumber} • Status: <span className="capitalize">{truck.status}</span>
                      </p>
                    </div>
                  </div>
                  {availableDrivers.length > 0 && (
                    <button
                      onClick={() => openAssignModal(truck)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <FaPlus className="w-4 h-4" />
                      Assign Driver
                    </button>
                  )}
                </div>

                {/* Assigned Drivers */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Assigned Drivers ({assignedDrivers.length})
                  </h4>
                  {assignedDrivers.length > 0 ? (
                    <div className="space-y-2">
                      {assignedDrivers.map((assignment: DriverAssignment, index: number) => {
                        const driver = drivers.find(d => d.id === assignment.driverId);
                        return (
                          <div
                            key={assignment.driverId || index}
                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <FaUser className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {assignment.driverName || driver ? `${driver?.firstName} ${driver?.lastName}` : 'Unknown Driver'}
                                </p>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-500">
                                    Assigned: {assignment.assignmentDate 
                                      ? new Date(assignment.assignmentDate).toLocaleDateString()
                                      : 'N/A'}
                                  </span>
                                  {assignment.status && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      assignment.status === 'active' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {assignment.status}
                                    </span>
                                  )}
                                </div>
                                {assignment.notes && (
                                  <p className="text-xs text-gray-600 mt-1">{assignment.notes}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnassignDriver(truck.id, assignment.driverId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Unassign Driver"
                            >
                              <FaTimes className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <FaUser className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No drivers assigned to this truck</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Driver Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Driver to Truck</DialogTitle>
          </DialogHeader>
          
          {selectedTruck && (
            <div className="space-y-4">
              {/* Truck Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FaTruck className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedTruck.make} {selectedTruck.model}
                    </p>
                    <p className="text-sm text-gray-600">Plate: {selectedTruck.plateNumber}</p>
                  </div>
                </div>
              </div>

              {/* Available Drivers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Driver
                </label>
                {/* Driver Search */}
                <div className="mb-3 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchDriver}
                    onChange={(e) => setSearchDriver(e.target.value)}
                    placeholder="Search drivers by name, email, or license..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {getAvailableDrivers(selectedTruck).length === 0 ? (
                    <div className="p-8 text-center">
                      <FaExclamationCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No available drivers</p>
                      <p className="text-xs text-gray-500 mt-1">All active drivers are already assigned to this truck</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {getAvailableDrivers(selectedTruck)
                        .filter(driver => {
                          const searchLower = searchDriver.toLowerCase();
                          return (
                            driver.firstName?.toLowerCase().includes(searchLower) ||
                            driver.lastName?.toLowerCase().includes(searchLower) ||
                            driver.email?.toLowerCase().includes(searchLower) ||
                            driver.licenseNumber?.toLowerCase().includes(searchLower)
                          );
                        })
                        .map((driver) => (
                          <button
                            key={driver.id}
                            onClick={() => handleAssignDriver(selectedTruck.id, driver.id)}
                            disabled={assigning}
                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary-100 rounded-lg">
                                <FaUser className="w-4 h-4 text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {driver.firstName} {driver.lastName}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-500">{driver.email}</span>
                                  <span className="text-xs text-gray-500">License: {driver.licenseNumber}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    driver.status === 'ACTIVE' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {driver.status}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    driver.availabilityStatus === 'AVAILABLE' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {driver.availabilityStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {assigning ? (
                              <FaSpinner className="w-4 h-4 text-primary-600 animate-spin" />
                            ) : (
                              <FaCheckCircle className="w-5 h-5 text-primary-600" />
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Add any notes about this assignment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedTruck(null);
                setAssignmentNotes('');
              }}
              disabled={assigning}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

