import React, { useState } from 'react';
import { FaWeightHanging, FaMapMarkerAlt, FaCalendarAlt, FaFileUpload, FaShieldAlt, FaExclamationTriangle, FaSnowflake, FaBox, FaInfoCircle, FaCheck, FaArrowRight, FaArrowLeft, FaRoad, FaClock, FaGasPump, FaSave } from 'react-icons/fa';
import { RouteIntelligenceService, type RouteInsight } from '../../services/routeIntelligence';
import { draftCargoApi } from '../../services/draftCargoApi';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import TemplateSelectionModal from '../../pages/dashboard/cargos/create/components/TemplateSelectionModal';

// Fix for default marker icon missing in React Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CargoDetails {
  title: string;
  description: string;
  cargoType: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  pickupLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  pickupDate: string;
  deliveryDate: string;
  specialRequirements: string[];
  photos: File[];
  insuranceRequired: boolean;
  isHazmat: boolean;
  isFragile: boolean;
  isRefrigerated: boolean;
  estimatedValue: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface CargoDetailsFormProps {
  onSubmit: (details: CargoDetails) => void;
  loading: boolean;
  error: string | null;
}

const CargoDetailsForm: React.FC<CargoDetailsFormProps> = ({ onSubmit, loading, error }) => {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [formData, setFormData] = useState<CargoDetails>({
    title: '',
    description: '',
    cargoType: '',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    pickupLocation: { address: '', city: '', state: '', zipCode: '' },
    deliveryLocation: { address: '', city: '', state: '', zipCode: '' },
    pickupDate: '',
    deliveryDate: '',
    specialRequirements: [],
    photos: [],
    insuranceRequired: false,
    isHazmat: false,
    isFragile: false,
    isRefrigerated: false,
    estimatedValue: 0,
    urgency: 'MEDIUM'
  });

  const [currentTab, setCurrentTab] = useState<'basic' | 'location' | 'special' | 'review'>('basic');
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [routeInsight, setRouteInsight] = useState<RouteInsight | null>(null);
  const [activeMapField, setActiveMapField] = useState<'pickup' | 'delivery' | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Map Click Handler Component
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        if (!activeMapField) return;

        setIsGeocoding(true);
        const { lat, lng } = e.latlng;

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();

          const address = data.address;
          const city = address.city || address.town || address.village || '';
          const state = address.state || '';
          const zipCode = address.postcode || '';
          const street = address.road || ((address.house_number ? address.house_number + ' ' : '') + (address.road || ''));

          const fieldPrefix = activeMapField === 'pickup' ? 'pickupLocation' : 'deliveryLocation';

          setFormData(prev => ({
            ...prev,
            [fieldPrefix]: {
              ...prev[fieldPrefix as 'pickupLocation' | 'deliveryLocation'],
              address: street || data.display_name.split(',')[0],
              city: city,
              state: state,
              zipCode: zipCode,
              coordinates: { lat, lng }
            }
          }));
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        } finally {
          setIsGeocoding(false);
          setActiveMapField(null);
        }
      },
    });
    return null;
  };

  const cargoTypes = [
    'General Freight',
    'Electronics',
    'Furniture',
    'Automotive',
    'Machinery',
    'Textiles',
    'Food & Beverage',
    'Pharmaceuticals',
    'Hazardous Materials',
    'Oversized Load',
    'Refrigerated',
    'Other'
  ];

  const urgencyOptions = [
    { value: 'LOW', label: 'Low Priority', color: 'text-green-600' },
    { value: 'MEDIUM', label: 'Standard', color: 'text-blue-600' },
    { value: 'HIGH', label: 'High Priority', color: 'text-orange-600' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600' }
  ];

  // Effect to fetch Route Insights when cities change
  React.useEffect(() => {
    if (formData.pickupLocation.city && formData.deliveryLocation.city) {
      const insight = RouteIntelligenceService.getRouteInsights(
        formData.pickupLocation.city,
        formData.deliveryLocation.city
      );
      setRouteInsight(insight);
    } else {
      setRouteInsight(null);
    }
  }, [formData.pickupLocation.city, formData.deliveryLocation.city]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };



  const handleTemplateSelection = (template: any) => {
    const mappedDetails: Partial<CargoDetails> = {
      title: template.title || formData.title,
      description: template.description || formData.description,
      cargoType: template.cargoType || formData.cargoType,
      weight: template.weight || formData.weight,
      estimatedValue: template.loadValue || formData.estimatedValue,
      dimensions: {
        length: template.length || formData.dimensions.length,
        width: template.width || formData.dimensions.width,
        height: template.height || formData.dimensions.height
      },
      isFragile: template.isFragile ?? formData.isFragile,
      isHazmat: template.isHazardous ?? formData.isHazmat,
      isRefrigerated: template.requiresRefrigeration ?? formData.isRefrigerated,
    };

    if (template.urgencyLevel) {
      const urgencyMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = {
        'LOW': 'LOW',
        'NORMAL': 'MEDIUM',
        'HIGH': 'HIGH',
        'CRITICAL': 'URGENT'
      };
      mappedDetails.urgency = urgencyMap[template.urgencyLevel] || 'MEDIUM';
    }

    if (template.specialRequirements) {
      if (typeof template.specialRequirements === 'string') {
        mappedDetails.specialRequirements = [template.specialRequirements];
      } else if (Array.isArray(template.specialRequirements)) {
        mappedDetails.specialRequirements = template.specialRequirements;
      }
    }

    setFormData(prev => ({
      ...prev,
      ...mappedDetails
    }));
    setShowTemplateModal(false);
  };

  const generateAiSuggestions = async () => {
    const suggestions = {
      recommendedTruckType: formData.weight > 10000 ? 'Heavy Duty' : 'Standard',
      packagingTips: formData.isFragile ? 'Use bubble wrap and secure packaging' : 'Standard packaging sufficient',
      routeOptimization: 'Consider traffic patterns and toll roads',
      insuranceRecommendation: formData.estimatedValue > 5000 ? 'High-value insurance recommended' : 'Standard coverage sufficient'
    };
    setAiSuggestions(suggestions);
  };

  const handleSaveDraft = async () => {
    try {
      const draftData = {
        title: formData.title,
        description: formData.description,
        weight: formData.weight,
        dimensions: formData.dimensions,
        cargoType: formData.cargoType,
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        locations: [
          {
            type: 'PICKUP',
            sequence: 1,
            locationData: {
              name: 'Pickup Location',
              address: formData.pickupLocation.address,
              city: formData.pickupLocation.city,
              state: formData.pickupLocation.state,
              coordinates: formData.pickupLocation.coordinates ? {
                latitude: formData.pickupLocation.coordinates.lat,
                longitude: formData.pickupLocation.coordinates.lng
              } : { latitude: 0, longitude: 0 }
            },
            scheduledDate: formData.pickupDate,
            estimatedTime: 0
          },
          {
            type: 'DELIVERY',
            sequence: 2,
            locationData: {
              name: 'Delivery Location',
              address: formData.deliveryLocation.address,
              city: formData.deliveryLocation.city,
              state: formData.deliveryLocation.state,
              coordinates: formData.deliveryLocation.coordinates ? {
                latitude: formData.deliveryLocation.coordinates.lat,
                longitude: formData.deliveryLocation.coordinates.lng
              } : { latitude: 0, longitude: 0 }
            },
            scheduledDate: formData.deliveryDate,
            estimatedTime: 0
          }
        ],
        loadValue: formData.estimatedValue,
        urgencyLevel: formData.urgency,
        isHazardous: formData.isHazmat,
        isFragile: formData.isFragile,
        requiresRefrigeration: formData.isRefrigerated
      };

      // @ts-ignore
      await draftCargoApi.saveAsDraft(draftData);
      toast.success('Cargo saved as draft');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderBasicInfoTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Cargo Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Electronics Shipment to NYC"
          required
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          placeholder="Describe your cargo, special handling requirements, etc."
          required
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cargo Type *</label>
          <select
            value={formData.cargoType}
            onChange={(e) => handleInputChange('cargoType', e.target.value)}
            required
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select cargo type</option>
            {cargoTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <FaWeightHanging className="inline mr-1 w-3 h-3" />
            Weight (kg) *
          </label>
          <input
            type="number"
            value={formData.weight}
            onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
            placeholder="Enter weight in kilograms"
            required
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          <FaBox className="inline mr-1 w-3 h-3" />
          Dimensions (inches)
        </label>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            placeholder="Length"
            value={formData.dimensions.length}
            onChange={(e) => handleInputChange('dimensions.length', parseFloat(e.target.value))}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <input
            type="number"
            placeholder="Width"
            value={formData.dimensions.width}
            onChange={(e) => handleInputChange('dimensions.width', parseFloat(e.target.value))}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <input
            type="number"
            placeholder="Height"
            value={formData.dimensions.height}
            onChange={(e) => handleInputChange('dimensions.height', parseFloat(e.target.value))}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Value ($)</label>
        <input
          type="number"
          value={formData.estimatedValue}
          onChange={(e) => handleInputChange('estimatedValue', parseFloat(e.target.value))}
          placeholder="Enter estimated value"
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Urgency Level</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {urgencyOptions.map(option => (
            <label key={option.value} className="flex items-center p-1.5 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="urgency"
                value={option.value}
                checked={formData.urgency === option.value}
                onChange={(e) => handleInputChange('urgency', e.target.value)}
                className="mr-1.5"
              />
              <span className={`text-xs ${option.color}`}>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLocationTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FaMapMarkerAlt className="text-primary-600" />
            Interactive Map Selection
          </h3>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveMapField('pickup')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${activeMapField === 'pickup' ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
            >
              {activeMapField === 'pickup' ? 'Click on Map for Pickup' : 'Set Pickup'}
            </button>
            <button
              type="button"
              onClick={() => setActiveMapField('delivery')}
              className={`px-3 py-1.5 rounded-lg border transition-all ${activeMapField === 'delivery' ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-500/30' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}
            >
              {activeMapField === 'delivery' ? 'Click on Map for Delivery' : 'Set Delivery'}
            </button>
          </div>
        </div>

        <div className="h-64 w-full rounded-xl overflow-hidden shadow-inner border border-gray-300 relative z-0">
          {isGeocoding && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-[1000] flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-full shadow-lg text-xs font-bold text-primary-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-600 rounded-full animate-ping"></span>
                Getting Address...
              </div>
            </div>
          )}
          <MapContainer center={[1.9441, 30.0619]} zoom={7} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler />

            {formData.pickupLocation.coordinates && (
              <Marker position={[formData.pickupLocation.coordinates.lat, formData.pickupLocation.coordinates.lng]}>
                <Popup>Pickup Location</Popup>
              </Marker>
            )}

            {formData.deliveryLocation.coordinates && (
              <Marker position={[formData.deliveryLocation.coordinates.lat, formData.deliveryLocation.coordinates.lng]}>
                <Popup>Delivery Location</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          {activeMapField ? 'Click anywhere on the map to automatically fill address details.' : 'Select "Set Pickup" or "Set Delivery" to enable map picking.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <FaMapMarkerAlt className="inline mr-2 text-primary-500 w-4 h-4" />
            Pickup Details
          </h3>
          <div className="space-y-3 p-3 bg-primary-50/50 rounded-lg border border-primary-100">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={formData.pickupLocation.address}
                onChange={(e) => handleInputChange('pickupLocation.address', e.target.value)}
                placeholder="Street address"
                required
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.pickupLocation.city}
                  onChange={(e) => handleInputChange('pickupLocation.city', e.target.value)}
                  placeholder="City"
                  required
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.pickupLocation.state}
                  onChange={(e) => handleInputChange('pickupLocation.state', e.target.value)}
                  placeholder="State"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
              <input
                type="text"
                value={formData.pickupLocation.zipCode}
                onChange={(e) => handleInputChange('pickupLocation.zipCode', e.target.value)}
                placeholder="ZIP code"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <FaMapMarkerAlt className="inline mr-2 text-green-500 w-4 h-4" />
            Delivery Details
          </h3>
          <div className="space-y-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={formData.deliveryLocation.address}
                onChange={(e) => handleInputChange('deliveryLocation.address', e.target.value)}
                placeholder="Street address"
                required
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.deliveryLocation.city}
                  onChange={(e) => handleInputChange('deliveryLocation.city', e.target.value)}
                  placeholder="City"
                  required
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.deliveryLocation.state}
                  onChange={(e) => handleInputChange('deliveryLocation.state', e.target.value)}
                  placeholder="State"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
              <input
                type="text"
                value={formData.deliveryLocation.zipCode}
                onChange={(e) => handleInputChange('deliveryLocation.zipCode', e.target.value)}
                placeholder="ZIP code"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
            <FaCalendarAlt className="inline mr-1 w-3 h-3" />
            Pickup Date *
          </label>
          <input
            type="datetime-local"
            value={formData.pickupDate}
            onChange={(e) => handleInputChange('pickupDate', e.target.value)}
            required
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
            <FaCalendarAlt className="inline mr-1 w-3 h-3" />
            Delivery Date *
          </label>
          <input
            type="datetime-local"
            value={formData.deliveryDate}
            onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
            required
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Route Intelligence Display */}
      {routeInsight && (
        <div className="mt-4 bg-primary-50 border border-primary-200 rounded-xl p-4 transition-all duration-500 animate-fadeIn">
          <h4 className="text-sm font-bold text-primary-900 flex items-center mb-3">
            <FaRoad className="mr-2 text-primary-600" />
            Smart Route Intelligence
            <span className="ml-auto text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full border border-primary-200">
              {routeInsight.priority === 'high' ? 'High Traffic Route' : 'Standard Route'}
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-3">
            <div className="flex items-center p-2 bg-white rounded-lg border border-primary-100 shadow-sm">
              <div className="p-1.5 bg-blue-100 rounded-full mr-2 text-blue-600">
                <FaClock />
              </div>
              <div>
                <div className="text-gray-500">Est. Time</div>
                <div className="font-bold text-gray-800">{routeInsight.estimatedTime} Hours</div>
              </div>
            </div>

            <div className="flex items-center p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
              <div className="p-1.5 bg-green-100 rounded-full mr-2 text-green-600">
                <FaGasPump />
              </div>
              <div>
                <div className="text-gray-500">Distance</div>
                <div className="font-bold text-gray-800">{routeInsight.distance} km</div>
              </div>
            </div>

            <div className="flex items-center p-2 bg-white rounded-lg border border-indigo-100 shadow-sm">
              <div className="p-1.5 bg-purple-100 rounded-full mr-2 text-purple-600">
                <FaShieldAlt />
              </div>
              <div>
                <div className="text-gray-500">Road Condition</div>
                <div className="font-bold text-gray-800 capitalize">{routeInsight.routeType}</div>
              </div>
            </div>
          </div>

          {(routeInsight.weatherConditions || routeInsight.trafficLevel === 'heavy') && (
            <div className="space-y-2">
              {routeInsight.weatherConditions && (
                <div className="text-xs text-primary-800 flex items-start bg-primary-100/50 p-2 rounded-lg">
                  <FaSnowflake className="mr-2 mt-0.5 flex-shrink-0 text-primary-500" />
                  <span><strong>Weather Alert:</strong> {routeInsight.weatherConditions}</span>
                </div>
              )}
              {routeInsight.trafficLevel === 'heavy' && (
                <div className="text-xs text-orange-800 flex items-start bg-orange-50 p-2 rounded-lg border border-orange-100">
                  <FaExclamationTriangle className="mr-2 mt-0.5 flex-shrink-0 text-orange-500" />
                  <span><strong>Traffic Warning:</strong> Heavy traffic reported on this route. Consider alternative departure times.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderSpecialRequirementsTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FaShieldAlt className="inline mr-2 text-primary-500 w-4 h-4" />
          Special Requirements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.insuranceRequired}
              onChange={(e) => handleInputChange('insuranceRequired', e.target.checked)}
              className="mr-2"
            />
            <div>
              <div className="text-xs font-medium">Insurance Required</div>
              <div className="text-[10px] text-gray-500">Additional cargo insurance coverage</div>
            </div>
          </label>

          <label className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.isHazmat}
              onChange={(e) => handleInputChange('isHazmat', e.target.checked)}
              className="mr-2"
            />
            <div>
              <div className="text-xs font-medium">
                <FaExclamationTriangle className="inline mr-1 text-orange-500 w-3 h-3" />
                Hazardous Materials
              </div>
              <div className="text-[10px] text-gray-500">Requires special handling permits</div>
            </div>
          </label>

          <label className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.isFragile}
              onChange={(e) => handleInputChange('isFragile', e.target.checked)}
              className="mr-2"
            />
            <div>
              <div className="text-xs font-medium">Fragile Items</div>
              <div className="text-[10px] text-gray-500">Requires careful handling</div>
            </div>
          </label>

          <label className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.isRefrigerated}
              onChange={(e) => handleInputChange('isRefrigerated', e.target.checked)}
              className="mr-2"
            />
            <div>
              <div className="text-xs font-medium">
                <FaSnowflake className="inline mr-1 text-primary-500 w-3 h-3" />
                Refrigerated
              </div>
              <div className="text-[10px] text-gray-500">Temperature-controlled transport</div>
            </div>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
          <FaFileUpload className="inline mr-1 w-3 h-3" />
          Upload Photos (Optional)
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        {formData.photos.length > 0 && (
          <div className="mt-1.5 text-xs text-gray-600">
            {formData.photos.length} photo(s) selected
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={generateAiSuggestions}
          className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Get AI Suggestions
        </button>
      </div>

      {aiSuggestions && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <h4 className="text-xs font-medium text-primary-900 mb-2">AI Recommendations</h4>
          <div className="space-y-1.5 text-xs text-primary-800">
            <div><strong>Truck Type:</strong> {aiSuggestions.recommendedTruckType}</div>
            <div><strong>Packaging:</strong> {aiSuggestions.packagingTips}</div>
            <div><strong>Route:</strong> {aiSuggestions.routeOptimization}</div>
            <div><strong>Insurance:</strong> {aiSuggestions.insuranceRecommendation}</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReviewTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Review Cargo Details</h3>

      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div><strong>Title:</strong> {formData.title}</div>
          <div><strong>Type:</strong> {formData.cargoType}</div>
          <div><strong>Weight:</strong> {formData.weight} kg</div>
          <div><strong>Value:</strong> ${formData.estimatedValue.toLocaleString()}</div>
          <div><strong>Urgency:</strong> {formData.urgency}</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Locations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Pickup:</strong><br />
            {formData.pickupLocation.address}<br />
            {formData.pickupLocation.city}, {formData.pickupLocation.state} {formData.pickupLocation.zipCode}
          </div>
          <div>
            <strong>Delivery:</strong><br />
            {formData.deliveryLocation.address}<br />
            {formData.deliveryLocation.city}, {formData.deliveryLocation.state} {formData.deliveryLocation.zipCode}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Special Requirements</h4>
        <div className="text-sm">
          {formData.insuranceRequired && <div className="mb-1">✓ Insurance Required</div>}
          {formData.isHazmat && <div className="mb-1">✓ Hazardous Materials</div>}
          {formData.isFragile && <div className="mb-1">✓ Fragile Items</div>}
          {formData.isRefrigerated && <div className="mb-1">✓ Refrigerated</div>}
          {formData.photos.length > 0 && <div className="mb-1">✓ {formData.photos.length} photo(s) uploaded</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="cargo-details-form">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentTab === 'basic' && 'Step 1: Cargo Information'}
            {currentTab === 'location' && 'Step 2: Route Details'}
            {currentTab === 'special' && 'Step 3: Special Requirements'}
            {currentTab === 'review' && 'Step 4: Final Review'}
          </h2>
          <p className="text-gray-600">
            {currentTab === 'basic' && 'Enter the dimensions, weight, and type of cargo you need to transport.'}
            {currentTab === 'location' && 'Specify the pickup and delivery locations to calculate accurate routing.'}
            {currentTab === 'special' && 'Add insurance, photo documentation, and handling instructions.'}
            {currentTab === 'review' && 'Verify all details to ensure a smooth shipping experience.'}
          </p>
        </div>
        {currentTab === 'basic' && (
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-md"
          >
            <FaBox /> Use Template
          </button>
        )}
      </div>

      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onTemplateSelected={handleTemplateSelection}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Navigation */}
      <div className="mb-12 px-4">
        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 rounded-full -translate-y-1/2" />

          {/* Active Progress Bar */}
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary-600 rounded-full -translate-y-1/2 transition-all duration-500 ease-in-out z-0"
            style={{
              width: `${(['basic', 'location', 'special', 'review'].indexOf(currentTab) / 3) * 100}%`
            }}
          />

          <div className="relative flex justify-between w-full">
            {[
              { id: 'basic', label: 'Cargo Details', icon: FaBox },
              { id: 'location', label: 'Route', icon: FaMapMarkerAlt },
              { id: 'special', label: 'Requirements', icon: FaShieldAlt },
              { id: 'review', label: 'Review', icon: FaCheck }
            ].map((tab, index) => {
              const steps = ['basic', 'location', 'special', 'review'];
              const currentIndex = steps.indexOf(currentTab);
              const stepIndex = steps.indexOf(tab.id);

              const isActive = currentTab === tab.id;
              const isCompleted = currentIndex > stepIndex;
              const isPending = currentIndex < stepIndex;

              return (
                <div key={tab.id} className="flex flex-col items-center group cursor-pointer" onClick={() => !isPending && setCurrentTab(tab.id as any)}>
                  <div
                    className={`
                      relative flex items-center justify-center w-12 h-12 rounded-full border-2 
                      transition-all duration-300 z-10 bg-white
                      ${isActive
                        ? 'border-primary-600 text-primary-600 shadow-xl shadow-primary-200 scale-110'
                        : isCompleted
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-gray-200 text-gray-300'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <FaCheck className="w-5 h-5" />
                    ) : (
                      <tab.icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="absolute mt-14 flex flex-col items-center">
                    <span className={`
                      text-xs font-bold uppercase tracking-wider transition-colors duration-300 mb-1
                      ${isActive ? 'text-primary-600' : isCompleted ? 'text-primary-600' : 'text-gray-400'}
                    `}>
                      Step {index + 1}
                    </span>
                    <span className={`
                      text-sm font-semibold whitespace-nowrap transition-colors duration-300
                      ${isActive ? 'text-gray-900' : isCompleted ? 'text-gray-900' : 'text-gray-400'}
                    `}>
                      {tab.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="min-h-[400px]">
              {currentTab === 'basic' && renderBasicInfoTab()}
              {currentTab === 'location' && renderLocationTab()}
              {currentTab === 'special' && renderSpecialRequirementsTab()}
              {currentTab === 'review' && renderReviewTab()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all mr-auto"
              >
                <FaSave className="mr-2 w-3 h-3" />
                Save Draft
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'location', 'special', 'review'];
                    const currentIndex = tabs.indexOf(currentTab);
                    if (currentIndex > 0) {
                      setCurrentTab(tabs[currentIndex - 1] as any);
                    }
                  }}
                  disabled={currentTab === 'basic'}
                  className={`flex items-center px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${currentTab === 'basic' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <FaArrowLeft className="mr-2 w-3 h-3" />
                  Back
                </button>

                {currentTab === 'review' ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-8 py-2.5 bg-primary-600 text-white rounded-2xl transition-all font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-900/10 hover:bg-primary-700"
                  >
                    {loading ? 'PROCESSING...' : 'POST CARGO NOW'}
                    {!loading && <FaCheck className="ml-2 w-3 h-3" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['basic', 'location', 'special', 'review'];
                      const currentIndex = tabs.indexOf(currentTab);
                      if (currentIndex < tabs.length - 1) {
                        setCurrentTab(tabs[currentIndex + 1] as any);
                      }
                    }}
                    className="flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-2xl transition-all font-black text-sm shadow-lg shadow-primary-900/10 hover:bg-primary-700"
                  >
                    NEXT STEP
                    <FaArrowRight className="ml-2 w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Contextual Help Panel */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-primary-50/50 rounded-2xl border border-primary-100 p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-4 text-primary-800">
              <FaInfoCircle className="w-5 h-5" />
              <h3 className="font-bold text-lg">Helpful Tips</h3>
            </div>

            {currentTab === 'basic' && (
              <div className="space-y-4 text-sm text-primary-900/80">
                <p><strong>Cargo Type:</strong> Selecting the right type helps us match you with trucks equipped for your goods.</p>
                <p><strong>Weight & Dimensions:</strong> Be as accurate as possible. Underestimating can lead to extra charges or rejected pickups.</p>
                <p><strong>Value:</strong> Used for insurance purposes. High-value loads might require special carriers.</p>
              </div>
            )}

            {currentTab === 'location' && (
              <div className="space-y-4 text-sm text-primary-900/80">
                <p><strong>Interactive Map:</strong> Click "Set Pickup" and tap on the map to auto-fill address details. Do the same for Delivery.</p>
                <p><strong>Dates:</strong> Flexible dates can often get you better rates.</p>
              </div>
            )}

            {currentTab === 'special' && (
              <div className="space-y-4 text-sm text-primary-900/80">
                <p><strong>Hazmat:</strong> Essential for safety compliance. Failure to declare can lead to severe fines.</p>
                <p><strong>Photos:</strong> Uploading photos of packed cargo increases driver confidence and reduces disputes.</p>
                <p><strong>AI Suggestions:</strong> Click the button to get smart tips on packaging and vehicles!</p>
              </div>
            )}

            {currentTab === 'review' && (
              <div className="space-y-4 text-sm text-primary-900/80">
                <p><strong>Double Check:</strong> Review all details carefully before posting.</p>
                <p><strong>Next Steps:</strong> After posting, you can instantly assign a broker or wait for bids.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CargoDetailsForm;