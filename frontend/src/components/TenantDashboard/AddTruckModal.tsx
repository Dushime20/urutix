import React, { useState } from 'react';
import { X, Truck, User, Calendar, Settings, FileText } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { fleetApi, type CreateTruckDto, type TruckOwner } from '../../services/fleetApi';
import toast from 'react-hot-toast';

interface AddTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTruckModal: React.FC<AddTruckModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'equipment' | 'maintenance'>('basic');
  const [formData, setFormData] = useState<CreateTruckDto>({
    plateNumber: '',
    vin: '',
    truckType: 'FLATBED',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: 0,
    capacityWeight: 0,
    capacityVolume: 0,
    fuelType: 'DIESEL',
    currentAddress: '',
    ownerId: '',
    // Insurance and registration
    registrationNumber: '',
    registrationExpiry: '',
    insurancePolicy: '',
    insuranceExpiry: '',
    roadworthyCertExpiry: '',
    // Equipment features
    hasRefrigeration: false,
    hasLiftGate: false,
    hasGps: false,
    hasHazmatPermit: false,
    hasSideRails: false,
    hasTarps: false,
    hasStraps: false,
    hasChains: false,
    hasWinch: false,
    // Maintenance
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    fuelEfficiency: 0,
    // Dimensions
    maxLength: 0,
    maxWidth: 0,
    maxHeight: 0,
    // Additional details
    color: '',
    equipmentList: [],
  });

  const queryClient = useQueryClient();

  // Fetch truck owners
  const { data: truckOwners = [], isLoading: isLoadingOwners } = useQuery({
    queryKey: ['truckOwners'],
    queryFn: fleetApi.getTruckOwners,
    enabled: isOpen,
  });

  const createTruckMutation = useMutation({
    mutationFn: (data: CreateTruckDto) => fleetApi.createTruck(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast.success('Truck added successfully');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add truck');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.plateNumber || !formData.vin) {
      toast.error('Plate number and VIN are required');
      return;
    }

    if (!formData.ownerId) {
      toast.error('Please select a truck owner');
      return;
    }

    createTruckMutation.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? checked
        : ['year', 'mileage', 'capacityWeight', 'capacityVolume', 'fuelEfficiency', 'maxLength', 'maxWidth', 'maxHeight'].includes(name)
          ? parseFloat(value) || 0
          : value
    }));
  };

  const resetForm = () => {
    setFormData({
      plateNumber: '',
      vin: '',
      truckType: 'FLATBED',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: 0,
      capacityWeight: 0,
      capacityVolume: 0,
      fuelType: 'DIESEL',
      currentAddress: '',
      ownerId: '',
      registrationNumber: '',
      registrationExpiry: '',
      insurancePolicy: '',
      insuranceExpiry: '',
      roadworthyCertExpiry: '',
      hasRefrigeration: false,
      hasLiftGate: false,
      hasGps: false,
      hasHazmatPermit: false,
      hasSideRails: false,
      hasTarps: false,
      hasStraps: false,
      hasChains: false,
      hasWinch: false,
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      fuelEfficiency: 0,
      maxLength: 0,
      maxWidth: 0,
      maxHeight: 0,
      color: '',
      equipmentList: [],
    });
    setActiveTab('basic');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
              <Truck className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Add New Truck</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 px-6">
            {[
              { id: 'basic', label: 'Basic Info', icon: Truck },
              { id: 'details', label: 'Details', icon: FileText },
              { id: 'equipment', label: 'Equipment', icon: Settings },
              { id: 'maintenance', label: 'Maintenance', icon: Calendar },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Truck Owner Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Truck Owner *
                  </label>
                  <select
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={isLoadingOwners}
                  >
                    <option value="">
                      {isLoadingOwners ? 'Loading truck owners...' : 'Select truck owner'}
                    </option>
                    {truckOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.profile?.firstName && owner.profile?.lastName
                          ? `${owner.profile.firstName} ${owner.profile.lastName} (${owner.email})`
                          : owner.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Plate Number *
                    </label>
                    <input
                      type="text"
                      name="plateNumber"
                      value={formData.plateNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., RAB 123A"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      VIN *
                    </label>
                    <input
                      type="text"
                      name="vin"
                      value={formData.vin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="17-character VIN"
                      maxLength={17}
                      required
                    />
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Make
                    </label>
                    <input
                      type="text"
                      name="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Volvo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., FH16"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>

                {/* Truck Type and Fuel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Truck Type
                    </label>
                    <select
                      name="truckType"
                      value={formData.truckType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="FLATBED">Flatbed</option>
                      <option value="BOX_TRUCK">Box Truck</option>
                      <option value="REFRIGERATED">Refrigerated</option>
                      <option value="TANKER">Tanker</option>
                      <option value="CONTAINER">Container</option>
                      <option value="DUMP">Dump Truck</option>
                      <option value="VAN">Van</option>
                      <option value="HEAVY_HAUL">Heavy Haul</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fuel Type
                    </label>
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="DIESEL">Diesel</option>
                      <option value="GASOLINE">Gasoline</option>
                      <option value="ELECTRIC">Electric</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="CNG">CNG</option>
                      <option value="LNG">LNG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Color
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., White"
                    />
                  </div>
                </div>

                {/* Capacity and Mileage */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Weight Capacity (kg)
                    </label>
                    <input
                      type="number"
                      name="capacityWeight"
                      value={formData.capacityWeight}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                      placeholder="e.g., 25000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Volume Capacity (m³)
                    </label>
                    <input
                      type="number"
                      name="capacityVolume"
                      value={formData.capacityVolume}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Current Mileage (km)
                    </label>
                    <input
                      type="number"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                      placeholder="e.g., 150000"
                    />
                  </div>
                </div>

                {/* Current Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Location
                  </label>
                  <input
                    type="text"
                    name="currentAddress"
                    value={formData.currentAddress}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Kigali, Rwanda"
                  />
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Registration & Insurance */}
                <div>
                  <h3 className="text-lg font-medium text-slate-800 mb-4">Registration & Insurance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Registration number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Registration Expiry
                      </label>
                      <input
                        type="date"
                        name="registrationExpiry"
                        value={formData.registrationExpiry}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Insurance Policy
                      </label>
                      <input
                        type="text"
                        name="insurancePolicy"
                        value={formData.insurancePolicy}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Policy number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Insurance Expiry
                      </label>
                      <input
                        type="date"
                        name="insuranceExpiry"
                        value={formData.insuranceExpiry}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Roadworthy Certificate Expiry
                      </label>
                      <input
                        type="date"
                        name="roadworthyCertExpiry"
                        value={formData.roadworthyCertExpiry}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div>
                  <h3 className="text-lg font-medium text-slate-800 mb-4">Dimensions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Max Length (m)
                      </label>
                      <input
                        type="number"
                        name="maxLength"
                        value={formData.maxLength}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="0.1"
                        placeholder="e.g., 12.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Max Width (m)
                      </label>
                      <input
                        type="number"
                        name="maxWidth"
                        value={formData.maxWidth}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="0.1"
                        placeholder="e.g., 2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Max Height (m)
                      </label>
                      <input
                        type="number"
                        name="maxHeight"
                        value={formData.maxHeight}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="0.1"
                        placeholder="e.g., 4.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Fuel Efficiency */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fuel Efficiency (km/L)
                  </label>
                  <input
                    type="number"
                    name="fuelEfficiency"
                    value={formData.fuelEfficiency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    step="0.1"
                    placeholder="e.g., 3.5"
                  />
                </div>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Equipment Features</h3>
                
                {/* Basic Equipment */}
                <div>
                  <h4 className="text-md font-medium text-slate-700 mb-3">Basic Equipment</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { name: 'hasRefrigeration', label: 'Refrigeration' },
                      { name: 'hasLiftGate', label: 'Lift Gate' },
                      { name: 'hasGps', label: 'GPS Tracking' },
                      { name: 'hasHazmatPermit', label: 'Hazmat Permit' },
                      { name: 'hasSideRails', label: 'Side Rails' },
                      { name: 'hasTarps', label: 'Tarps' },
                      { name: 'hasStraps', label: 'Straps' },
                      { name: 'hasChains', label: 'Chains' },
                      { name: 'hasWinch', label: 'Winch' },
                    ].map(({ name, label }) => (
                      <label key={name} className="flex items-center">
                        <input
                          type="checkbox"
                          name={name}
                          checked={formData[name as keyof CreateTruckDto] as boolean}
                          onChange={handleInputChange}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Maintenance Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Last Maintenance Date
                    </label>
                    <input
                      type="date"
                      name="lastMaintenanceDate"
                      value={formData.lastMaintenanceDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Next Maintenance Date
                    </label>
                    <input
                      type="date"
                      name="nextMaintenanceDate"
                      value={formData.nextMaintenanceDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTruckMutation.isPending}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createTruckMutation.isPending ? 'Adding...' : 'Add Truck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTruckModal;