import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Clock,
  Ruler,
  FileText,
  Save,
  Loader2,
  AlertTriangle,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fleetApi } from '../../services/fleetApi';
import type { Route } from '../../services/fleetApi';
import { toast } from 'react-hot-toast';
import MapLocationPicker from './MapLocationPicker';

interface RouteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRoute?: Route | null;
  mode: 'create' | 'edit';
}

interface RouteFormData {
  name: string;
  origin: string;
  destination: string;
  distance: string;
  estimatedTime: string;
  routeType: 'highway' | 'city' | 'rural' | 'mixed';
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
}

export const RouteFormModal: React.FC<RouteFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingRoute,
  mode
}) => {
  const [formData, setFormData] = useState<RouteFormData>({
    name: '',
    origin: '',
    destination: '',
    distance: '',
    estimatedTime: '',
    routeType: 'highway',
    status: 'active',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Map picker state
  const [mapPickerOpen, setMapPickerOpen] = useState<'origin' | 'destination' | null>(null);

  // Initialize form data when editing
  useEffect(() => {
    console.log('🔄 RouteFormModal: useEffect triggered', { editingRoute, mode, isOpen });
    
    if (editingRoute && mode === 'edit') {
      console.log('✏️ RouteFormModal: Initializing form for edit mode with route:', editingRoute);
      setFormData({
        name: editingRoute.name || '',
        origin: editingRoute.origin || '',
        destination: editingRoute.destination || '',
        distance: editingRoute.distance?.toString() || '',
        estimatedTime: editingRoute.estimatedTime?.toString() || '',
        routeType: editingRoute.routeType || 'highway',
        status: editingRoute.status || 'active',
        description: editingRoute.description || ''
      });
      console.log('✅ RouteFormModal: Form data initialized for edit mode');
    } else {
      console.log('➕ RouteFormModal: Resetting form for create mode');
      // Reset form for create mode
      setFormData({
        name: '',
        origin: '',
        destination: '',
        distance: '',
        estimatedTime: '',
        routeType: 'highway',
        status: 'active',
        description: ''
      });
      console.log('✅ RouteFormModal: Form data reset for create mode');
    }
    setErrors({});
  }, [editingRoute, mode, isOpen]);

  const handleInputChange = (field: keyof RouteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Route name is required';
    }
    if (!formData.origin.trim()) {
      newErrors.origin = 'Origin is required';
    }
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    if (!formData.distance || parseFloat(formData.distance) <= 0) {
      newErrors.distance = 'Distance must be greater than 0';
    }
    if (!formData.estimatedTime || parseInt(formData.estimatedTime) <= 0) {
      newErrors.estimatedTime = 'Estimated time must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 RouteFormModal: Form submitted');
    console.log('📝 RouteFormModal: Form data:', formData);
    console.log('📝 RouteFormModal: Form mode:', mode);
    
    if (!validateForm()) {
      console.log('❌ RouteFormModal: Form validation failed');
      return;
    }

    console.log('✅ RouteFormModal: Form validation passed');
    
    setLoading(true);
    try {
      const routeData = {
        name: formData.name.trim(),
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        distance: parseFloat(formData.distance),
        estimatedTime: parseInt(formData.estimatedTime), // Backend entity uses estimatedTime
        routeType: formData.routeType,
        status: formData.status,
        description: formData.description.trim() || undefined
      };

      console.log('🚀 RouteFormModal: Prepared route data for API:', routeData);

      if (mode === 'create') {
        console.log('➕ RouteFormModal: Creating new route...');
        const createdRoute = await fleetApi.createRoute(routeData);
        console.log('✅ RouteFormModal: Route created successfully:', createdRoute);
        toast.success('Route created successfully!');
      } else if (editingRoute) {
        console.log('✏️ RouteFormModal: Updating existing route:', editingRoute.id);
        const updatedRoute = await fleetApi.updateRoute(editingRoute.id, routeData);
        console.log('✅ RouteFormModal: Route updated successfully:', updatedRoute);
        toast.success('Route updated successfully!');
      }

      console.log('🎉 RouteFormModal: Calling onSuccess callback');
      onSuccess();
      console.log('🚪 RouteFormModal: Closing modal');
      onClose();
    } catch (error: any) {
      console.error('❌ RouteFormModal: Error saving route:', error);
      console.error('❌ RouteFormModal: Error response:', error.response?.data);
      console.error('❌ RouteFormModal: Error status:', error.response?.status);
      console.error('❌ RouteFormModal: Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save route';
      console.error('❌ RouteFormModal: Showing error toast:', errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('🏁 RouteFormModal: Setting loading to false');
      setLoading(false);
    }
  };

  if (!isOpen) {
    console.log('🚪 RouteFormModal: Modal is closed, not rendering');
    return null;
  }

  console.log('🖼️ RouteFormModal: Rendering modal', { mode, editingRoute: !!editingRoute });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/60 dark:bg-gray-950/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl dark:shadow-none border border-gray-100 dark:border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 transition-colors">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-blue-600 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-white dark:text-blue-400 transition-colors">
                <Navigation size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
                  {mode === 'create' ? 'Create New Route' : 'Edit Route'}
                </h2>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 transition-colors">
                  {mode === 'create' ? 'Add a new logistics corridor' : 'Update route information'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-10 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Route Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">
                Route Name *
              </label>
              <div className="relative group">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all ${
                    errors.name ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20' : 'border-gray-100 dark:border-gray-700'
                  }`}
                  placeholder="e.g., Nairobi to Mombasa Express"
                />
              </div>
              {errors.name && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest px-1">
                  <AlertTriangle size={12} />
                  {errors.name}
                </div>
              )}
            </div>

            {/* Origin and Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">
                  Origin *
                </label>
                <div className="relative group flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => handleInputChange('origin', e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all ${
                        errors.origin ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20' : 'border-gray-100 dark:border-gray-700'
                      }`}
                      placeholder="e.g., Nairobi"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMapPickerOpen('origin')}
                    title="Pick on map"
                    className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 transition-all flex items-center gap-1.5 text-xs font-bold flex-shrink-0"
                  >
                    <MapIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Map</span>
                  </button>
                </div>
                {errors.origin && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest px-1">
                    <AlertTriangle size={12} />
                    {errors.origin}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">
                  Destination *
                </label>
                <div className="relative group flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => handleInputChange('destination', e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all ${
                        errors.destination ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20' : 'border-gray-100 dark:border-gray-700'
                      }`}
                      placeholder="e.g., Mombasa"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMapPickerOpen('destination')}
                    title="Pick on map"
                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg text-red-500 dark:text-red-400 transition-all flex items-center gap-1.5 text-xs font-bold flex-shrink-0"
                  >
                    <MapIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Map</span>
                  </button>
                </div>
                {errors.destination && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest px-1">
                    <AlertTriangle size={12} />
                    {errors.destination}
                  </div>
                )}
              </div>
            </div>

            {/* Map Location Pickers */}
            <MapLocationPicker
              isOpen={mapPickerOpen === 'origin'}
              onClose={() => setMapPickerOpen(null)}
              title="Select Origin"
              color="#10b981"
              initialValue={formData.origin}
              onConfirm={(name) => {
                handleInputChange('origin', name);
                setMapPickerOpen(null);
              }}
            />
            <MapLocationPicker
              isOpen={mapPickerOpen === 'destination'}
              onClose={() => setMapPickerOpen(null)}
              title="Select Destination"
              color="#ef4444"
              initialValue={formData.destination}
              onConfirm={(name) => {
                handleInputChange('destination', name);
                setMapPickerOpen(null);
              }}
            />

            {/* Distance and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">
                  Distance (km) *
                </label>
                <div className="relative group">
                  <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.distance}
                    onChange={(e) => handleInputChange('distance', e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all ${
                      errors.distance ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20' : 'border-gray-100 dark:border-gray-700'
                    }`}
                    placeholder="0.0"
                  />
                </div>
                {errors.distance && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest px-1">
                    <AlertTriangle size={12} />
                    {errors.distance}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">
                  Estimated Time (hours) *
                </label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedTime}
                    onChange={(e) => handleInputChange('estimatedTime', e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all ${
                      errors.estimatedTime ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20' : 'border-gray-100 dark:border-gray-700'
                    }`}
                    placeholder="0"
                  />
                </div>
                {errors.estimatedTime && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest px-1">
                    <AlertTriangle size={12} />
                    {errors.estimatedTime}
                  </div>
                )}
              </div>
            </div>

            {/* Route Type and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">
                  Route Type
                </label>
                <select
                  value={formData.routeType}
                  onChange={(e) => handleInputChange('routeType', e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all"
                >
                  <option value="highway">Highway</option>
                  <option value="city">City</option>
                  <option value="rural">Rural</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">
                Description (Optional)
              </label>
              <div className="relative group">
                <FileText className="absolute left-4 top-4 w-4 h-4 text-gray-400 dark:text-gray-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Additional route information, special instructions, or notes..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-5 pt-8 border-t border-gray-100 dark:border-gray-800 transition-colors">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-900 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 dark:shadow-none flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {mode === 'create' ? 'Create Route' : 'Update Route'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RouteFormModal;