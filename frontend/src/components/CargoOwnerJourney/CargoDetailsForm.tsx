import React, { useState } from 'react';
import { FaWeightHanging, FaMapMarkerAlt, FaCalendarAlt, FaFileUpload, FaShieldAlt, FaExclamationTriangle, FaSnowflake, FaBox } from 'react-icons/fa';

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

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
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

  const handleSpecialRequirementToggle = (requirement: string) => {
    setFormData(prev => ({
      ...prev,
      specialRequirements: prev.specialRequirements.includes(requirement)
        ? prev.specialRequirements.filter(r => r !== requirement)
        : [...prev.specialRequirements, requirement]
    }));
  };

  const generateAiSuggestions = async () => {
    // Simulate AI suggestions based on cargo details
    const suggestions = {
      recommendedTruckType: formData.weight > 10000 ? 'Heavy Duty' : 'Standard',
      packagingTips: formData.isFragile ? 'Use bubble wrap and secure packaging' : 'Standard packaging sufficient',
      routeOptimization: 'Consider traffic patterns and toll roads',
      insuranceRecommendation: formData.estimatedValue > 5000 ? 'High-value insurance recommended' : 'Standard coverage sufficient'
    };
    setAiSuggestions(suggestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderBasicInfoTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Cargo Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., Electronics Shipment to NYC"
          required
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          placeholder="Describe your cargo, special handling requirements, etc."
          required
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Cargo Type *
          </label>
          <select
            value={formData.cargoType}
            onChange={(e) => handleInputChange('cargoType', e.target.value)}
            required
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Width"
            value={formData.dimensions.width}
            onChange={(e) => handleInputChange('dimensions.width', parseFloat(e.target.value))}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Height"
            value={formData.dimensions.height}
            onChange={(e) => handleInputChange('dimensions.height', parseFloat(e.target.value))}
            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Estimated Value ($)
        </label>
        <input
          type="number"
          value={formData.estimatedValue}
          onChange={(e) => handleInputChange('estimatedValue', parseFloat(e.target.value))}
          placeholder="Enter estimated value"
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Urgency Level
        </label>
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
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FaMapMarkerAlt className="inline mr-2 text-blue-500 w-4 h-4" />
          Pickup Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              value={formData.pickupLocation.address}
              onChange={(e) => handleInputChange('pickupLocation.address', e.target.value)}
              placeholder="Street address"
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
            <input
              type="text"
              value={formData.pickupLocation.city}
              onChange={(e) => handleInputChange('pickupLocation.city', e.target.value)}
              placeholder="City"
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
            <input
              type="text"
              value={formData.pickupLocation.state}
              onChange={(e) => handleInputChange('pickupLocation.state', e.target.value)}
              placeholder="State"
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code *</label>
            <input
              type="text"
              value={formData.pickupLocation.zipCode}
              onChange={(e) => handleInputChange('pickupLocation.zipCode', e.target.value)}
              placeholder="ZIP code"
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FaMapMarkerAlt className="inline mr-2 text-green-500 w-4 h-4" />
          Delivery Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              value={formData.deliveryLocation.address}
              onChange={(e) => handleInputChange('deliveryLocation.address', e.target.value)}
              placeholder="Street address"
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
            <input
              type="text"
              value={formData.deliveryLocation.city}
              onChange={(e) => handleInputChange('deliveryLocation.city', e.target.value)}
              placeholder="City"
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
            <input
              type="text"
              value={formData.deliveryLocation.state}
              onChange={(e) => handleInputChange('deliveryLocation.state', e.target.value)}
              placeholder="State"
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code *</label>
            <input
              type="text"
              value={formData.deliveryLocation.zipCode}
              onChange={(e) => handleInputChange('deliveryLocation.zipCode', e.target.value)}
              placeholder="ZIP code"
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderSpecialRequirementsTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <FaShieldAlt className="inline mr-2 text-blue-500 w-4 h-4" />
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
                <FaSnowflake className="inline mr-1 text-blue-500 w-3 h-3" />
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
          className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Get AI Suggestions
        </button>
      </div>

      {aiSuggestions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-xs font-medium text-blue-900 mb-2">AI Recommendations</h4>
          <div className="space-y-1.5 text-xs text-blue-800">
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Enter Cargo Details</h2>
        <p className="text-gray-600">
          Provide comprehensive information about your shipment to ensure accurate matching and pricing.
        </p>
      </div>

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

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'location', label: 'Location & Dates' },
            { id: 'special', label: 'Special Requirements' },
            { id: 'review', label: 'Review' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                currentTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit}>
        {currentTab === 'basic' && renderBasicInfoTab()}
        {currentTab === 'location' && renderLocationTab()}
        {currentTab === 'special' && renderSpecialRequirementsTab()}
        {currentTab === 'review' && renderReviewTab()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                const tabs = ['basic', 'location', 'special', 'review'];
                const currentIndex = tabs.indexOf(currentTab);
                if (currentIndex < tabs.length - 1) {
                  setCurrentTab(tabs[currentIndex + 1] as any);
                }
              }}
              disabled={currentTab === 'review'}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>

            {currentTab === 'review' && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Cargo Details'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CargoDetailsForm; 