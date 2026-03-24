import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Truck, Route, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create Fleet Assignment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {[
              { step: 1, label: 'Select Driver', icon: Users },
              { step: 2, label: 'Select Truck', icon: Truck },
              { step: 3, label: 'Select Route', icon: Route },
              { step: 4, label: 'Review', icon: CheckCircle }
            ].map(({ step: stepNum, label, icon: Icon }) => (
              <div key={stepNum} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step >= stepNum 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'border-slate-300 text-slate-400'
                }`}>
                  {step > stepNum ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= stepNum ? 'text-primary-600' : 'text-slate-400'
                }`}>
                  {label}
                </span>
                {stepNum < 4 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    step > stepNum ? 'bg-primary-600' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Driver */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Select a Driver</h3>
              <p className="text-slate-600">Choose an available driver for this assignment.</p>
              
              {availableDrivers.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-slate-600">No available drivers found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {availableDrivers.map(driver => (
                    <div
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDriver === driver.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">
                            {driver.firstName} {driver.lastName}
                          </h4>
                          <p className="text-sm text-slate-600">
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
              <h3 className="text-lg font-medium text-slate-900">Select a Truck</h3>
              <p className="text-slate-600">Choose an available truck for this assignment.</p>
              
              {availableTrucks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-slate-600">No available trucks found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {availableTrucks.map(truck => (
                    <div
                      key={truck.id}
                      onClick={() => setSelectedTruck(truck.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTruck === truck.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Truck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{truck.plateNumber}</h4>
                          <p className="text-sm text-slate-600">
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
              <h3 className="text-lg font-medium text-slate-900">Select a Route</h3>
              <p className="text-slate-600">Choose a route for this assignment.</p>
              
              {availableRoutes.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-slate-600">No available routes found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {availableRoutes.map(route => (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRoute === route.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Route className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{route.name}</h4>
                          <p className="text-sm text-slate-600">
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
              <h3 className="text-lg font-medium text-slate-900">Review Assignment</h3>
              
              {/* Assignment Summary */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                {/* Driver */}
                {getSelectedDriver() && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {getSelectedDriver().firstName} {getSelectedDriver().lastName}
                      </p>
                      <p className="text-sm text-slate-600">Driver</p>
                    </div>
                  </div>
                )}

                {/* Truck */}
                {getSelectedTruck() && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{getSelectedTruck().plateNumber}</p>
                      <p className="text-sm text-slate-600">
                        {getSelectedTruck().make} {getSelectedTruck().model}
                      </p>
                    </div>
                  </div>
                )}

                {/* Route */}
                {getSelectedRoute() && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Route className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{getSelectedRoute().name}</p>
                      <p className="text-sm text-slate-600">
                        {getSelectedRoute().origin} → {getSelectedRoute().destination}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any additional notes for this assignment..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <button
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
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
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedDriver || !selectedTruck || !selectedRoute}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  'Create Assignment'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateAssignmentModal;