import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Truck, Route, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fleetApi } from '../../services/fleetApi';
import toast from 'react-hot-toast';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDrivers: any[];
  availableTrucks: any[];
  availableRoutes: any[];
}

const CreateAssignmentModal = ({
  isOpen,
  onClose,
  availableDrivers,
  availableTrucks,
  availableRoutes
}: CreateAssignmentModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedTruck, setSelectedTruck] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      // First assign driver to truck
      await fleetApi.assignDriverToTruck(selectedTruck, {
        driverId: selectedDriver,
        notes: notes
      });
      
      // Then assign truck to route
      await fleetApi.assignTruckToRoute(selectedTruck, {
        routeId: selectedRoute,
        startDate: startDate,
        notes: notes
      });
      
      return assignmentData;
    },
    onSuccess: () => {
      toast.success('Assignment created successfully!');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assignment');
    }
  });

  const resetForm = () => {
    setStep(1);
    setSelectedDriver('');
    setSelectedTruck('');
    setSelectedRoute('');
    setStartDate('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedDriver || !selectedTruck || !selectedRoute) {
      toast.error('Please select driver, truck, and route');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAssignmentMutation.mutateAsync({
        driverId: selectedDriver,
        truckId: selectedTruck,
        routeId: selectedRoute,
        startDate: startDate || new Date().toISOString(),
        notes
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedDriver = () => availableDrivers.find(d => d.id === selectedDriver);
  const getSelectedTruck = () => availableTrucks.find(t => t.id === selectedTruck);
  const getSelectedRoute = () => availableRoutes.find(r => r.id === selectedRoute);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-gray-950/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl dark:shadow-none w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800 transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Fleet Assignment</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900 transition-colors">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Driver', icon: Users },
              { step: 2, label: 'Truck', icon: Truck },
              { step: 3, label: 'Route', icon: Route },
              { step: 4, label: 'Review', icon: CheckCircle }
            ].map(({ step: stepNum, label, icon: Icon }) => (
              <div key={stepNum} className="flex items-center group">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                  step >= stepNum 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                }`}>
                  {step > stepNum ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`ml-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  step >= stepNum ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {label}
                </span>
                {stepNum < 4 && (
                  <div className={`w-8 h-px mx-3 transition-colors ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white dark:bg-gray-900 transition-colors">
          {/* Step 1: Select Driver */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">Select a Driver</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Choose an available driver for this assignment.</p>
              
              {availableDrivers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors">
                  <AlertCircle className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No available drivers found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {availableDrivers.map(driver => (
                    <div
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedDriver === driver.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center transition-colors">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white transition-colors">
                            {driver.firstName} {driver.lastName}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                            License: {driver.licenseNumber} • Experience: {driver.experience || 0} years
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Truck */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">Select a Truck</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Choose an available truck for this assignment.</p>
              
              {availableTrucks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors">
                  <AlertCircle className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No available trucks found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {availableTrucks.map(truck => (
                    <div
                      key={truck.id}
                      onClick={() => setSelectedTruck(truck.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTruck === truck.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center transition-colors">
                          <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white transition-colors">{truck.plateNumber}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                            {truck.make} {truck.model} • Capacity: {truck.capacityWeight}t
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Step 3: Select Route */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">Select a Route</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Choose a route for this assignment.</p>
              
              {availableRoutes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors">
                  <AlertCircle className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No available routes found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {availableRoutes.map(route => (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedRoute === route.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center transition-colors">
                          <Route className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white transition-colors">{route.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                            {route.origin} → {route.destination} • {route.distance} km
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">Review Assignment</h3>
              
              {/* Assignment Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 space-y-5 transition-colors">
                {/* Driver */}
                {getSelectedDriver() && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center transition-colors">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white transition-colors">
                        {getSelectedDriver().firstName} {getSelectedDriver().lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Assigned Driver</p>
                    </div>
                  </div>
                )}

                {/* Truck */}
                {getSelectedTruck() && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center transition-colors">
                      <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white transition-colors">{getSelectedTruck().plateNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                        {getSelectedTruck().make} {getSelectedTruck().model}
                      </p>
                    </div>
                  </div>
                )}

                {/* Route */}
                {getSelectedRoute() && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center transition-colors">
                      <Route className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white transition-colors">{getSelectedRoute().name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                        {getSelectedRoute().origin} → {getSelectedRoute().destination}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 transition-colors">
                    Start Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 transition-colors">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any additional notes for this assignment..."
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>
          )}
              {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
          <button
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                onClose();
              }
            }}
            className="px-6 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold text-sm transition-all"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
 
          <div className="flex items-center gap-3">
            {step < 4 ? (
              <button
                onClick={() => {
                  if (step === 1 && !selectedDriver) {
                    toast.error('Please select a driver');
                    return;
                  }
                  if (step === 2 && !selectedTruck) {
                    toast.error('Please select a truck');
                    return;
                  }
                  if (step === 3 && !selectedRoute) {
                    toast.error('Please select a route');
                    return;
                  }
                  setStep(step + 1);
                }}
                disabled={
                  (step === 1 && !selectedDriver) ||
                  (step === 2 && !selectedTruck) ||
                  (step === 3 && !selectedRoute)
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedDriver || !selectedTruck || !selectedRoute}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Assignment...
                  </>
                ) : (
                  'Create Assignment'
                )}
              </button>
            )}
          </div>
        </div>
  </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateAssignmentModal;