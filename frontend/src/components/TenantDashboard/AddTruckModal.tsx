import React, { useState } from 'react';
import { X, Truck, User, Calendar, Settings, FileText } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { fleetApi, type CreateTruckDto, type TruckOwner } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface AddTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTruckModal: React.FC<AddTruckModalProps> = ({ isOpen, onClose }) => {
  const { tSync } = useTranslation();
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
    onSuccess: async (createdTruck) => {
      // Invalidate and refetch trucks query to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['trucks'] });
      await queryClient.refetchQueries({ queryKey: ['trucks'] });
      toast.success(tSync('Truck added successfully'));
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || tSync('Failed to add truck'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.plateNumber || !formData.vin) {
      toast.error(tSync('Plate number and VIN are required'));
      return;
    }

    if (!formData.ownerId) {
      toast.error(tSync('Please select a truck owner'));
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl mr-4">
              <Truck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight italic"><TranslatedText text="Add New Truck" /></h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-8">
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
                className={`flex items-center px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tSync(label)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Truck Owner Selection */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                    <User className="w-3.5 h-3.5 inline mr-1" />
                    <TranslatedText text="Truck Owner" /> *
                  </label>
                  <select
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                    required
                    disabled={isLoadingOwners}
                  >
                    <option value="">
                      {isLoadingOwners ? tSync('Loading truck owners...') : tSync('Select truck owner')}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Plate Number" /> *
                    </label>
                    <input
                      type="text"
                      name="plateNumber"
                      value={formData.plateNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      placeholder="e.g., RAB 123A"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="VIN" /> *
                    </label>
                    <input
                      type="text"
                      name="vin"
                      value={formData.vin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      placeholder={tSync("17-character VIN")}
                      maxLength={17}
                      required
                    />
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Make" />
                    </label>
                    <input
                      type="text"
                      name="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      placeholder="e.g., Volvo"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Model" />
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      placeholder="e.g., FH16"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Year" />
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                </div>

                {/* Truck Type and Fuel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Truck Type" />
                    </label>
                    <select
                      name="truckType"
                      value={formData.truckType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                    >
                      <option value="FLATBED">{tSync('Flatbed')}</option>
                      <option value="BOX_TRUCK">{tSync('Box Truck')}</option>
                      <option value="REFRIGERATED">{tSync('Refrigerated')}</option>
                      <option value="TANKER">{tSync('Tanker')}</option>
                      <option value="CONTAINER">{tSync('Container')}</option>
                      <option value="DUMP">{tSync('Dump Truck')}</option>
                      <option value="VAN">{tSync('Van')}</option>
                      <option value="HEAVY_HAUL">{tSync('Heavy Haul')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Fuel Type" />
                    </label>
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                    >
                      <option value="DIESEL">{tSync('Diesel')}</option>
                      <option value="GASOLINE">{tSync('Gasoline')}</option>
                      <option value="ELECTRIC">{tSync('Electric')}</option>
                      <option value="HYBRID">{tSync('Hybrid')}</option>
                      <option value="CNG">{tSync('CNG')}</option>
                      <option value="LNG">{tSync('LNG')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Color" />
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      placeholder="e.g., White"
                    />
                  </div>
                </div>

                {/* Capacity and Mileage */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Weight Capacity" /> (kg)
                    </label>
                    <input
                      type="number"
                      name="capacityWeight"
                      value={formData.capacityWeight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      min="0"
                      placeholder="e.g., 25000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Volume Capacity" /> (m³)
                    </label>
                    <input
                      type="number"
                      name="capacityVolume"
                      value={formData.capacityVolume}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      min="0"
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Current Mileage" /> (km)
                    </label>
                    <input
                      type="number"
                      name="mileage"
                      value={formData.mileage}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      min="0"
                      placeholder="e.g., 150000"
                    />
                  </div>
                </div>

                {/* Current Location */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                    <TranslatedText text="Current Location" />
                  </label>
                  <input
                    type="text"
                    name="currentAddress"
                    value={formData.currentAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                    placeholder="e.g., Kigali, Rwanda"
                  />
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Registration & Insurance */}
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight italic"><TranslatedText text="Registration & Insurance" /></h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                        <TranslatedText text="Registration Number" />
                      </label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                        placeholder={tSync("Registration number")}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                        <TranslatedText text="Registration Expiry" />
                      </label>
                      <input
                        type="date"
                        name="registrationExpiry"
                        value={formData.registrationExpiry}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                        <TranslatedText text="Insurance Policy" />
                      </label>
                      <input
                        type="text"
                        name="insurancePolicy"
                        value={formData.insurancePolicy}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                        placeholder={tSync("Policy number")}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                        <TranslatedText text="Insurance Expiry" />
                      </label>
                      <input
                        type="date"
                        name="insuranceExpiry"
                        value={formData.insuranceExpiry}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                        <TranslatedText text="Roadworthy Certificate Expiry" />
                      </label>
                      <input
                        type="date"
                        name="roadworthyCertExpiry"
                        value={formData.roadworthyCertExpiry}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight italic"><TranslatedText text="Dimensions" /></h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                        <TranslatedText text="Max Length" /> (m)
                      </label>
                      <input
                        type="number"
                        name="maxLength"
                        value={formData.maxLength}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                        min="0"
                        step="0.1"
                        placeholder="e.g., 12.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                        <TranslatedText text="Max Width" /> (m)
                      </label>
                      <input
                        type="number"
                        name="maxWidth"
                        value={formData.maxWidth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                        min="0"
                        step="0.1"
                        placeholder="e.g., 2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                        <TranslatedText text="Max Height" /> (m)
                      </label>
                      <input
                        type="number"
                        name="maxHeight"
                        value={formData.maxHeight}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                        min="0"
                        step="0.1"
                        placeholder="e.g., 4.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Fuel Efficiency */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                    <TranslatedText text="Fuel Efficiency" /> (km/L)
                  </label>
                  <input
                    type="number"
                    name="fuelEfficiency"
                    value={formData.fuelEfficiency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                    min="0"
                    step="0.1"
                    placeholder="e.g., 3.5"
                  />
                </div>
              </div>
            )}

            {activeTab === 'equipment' && (
              <div className="space-y-6">
                <h3 className="text-base font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight italic"><TranslatedText text="Equipment Features" /></h3>
                
                {/* Basic Equipment */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 italic"><TranslatedText text="Basic Equipment" /></h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
                      <label key={name} className="flex items-center group cursor-pointer">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            name={name}
                            checked={formData[name as keyof CreateTruckDto] as boolean}
                            onChange={handleInputChange}
                            className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 bg-white dark:bg-slate-800 transition-all"
                          />
                        </div>
                        <span className="ml-3 text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{tSync(label)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="space-y-8">
                <h3 className="text-base font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight italic"><TranslatedText text="Maintenance Information" /></h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Last Maintenance Date" />
                    </label>
                    <input
                      type="date"
                      name="lastMaintenanceDate"
                      value={formData.lastMaintenanceDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                      <TranslatedText text="Next Maintenance Date" />
                    </label>
                    <input
                      type="date"
                      name="nextMaintenanceDate"
                      value={formData.nextMaintenanceDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[16px] text-xs font-bold text-slate-700 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <TranslatedText text="Cancel" />
            </button>
            <button
              type="submit"
              disabled={createTruckMutation.isPending}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 dark:shadow-slate-950/20 active:scale-95"
            >
              {createTruckMutation.isPending ? tSync('Adding...') : tSync('Add Truck')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTruckModal;