import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaSave } from 'react-icons/fa';

const CargoCreatePageSimple: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    weight: 0,
    cargoType: 'GENERAL',
    pickupDate: '',
    deliveryDate: '',
    loadValue: 0,
    currencyCode: 'USD',
    isFragile: false,
    isHazardous: false,
    requiresRefrigeration: false,
    specialRequirements: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.title || !formData.weight || !formData.loadValue) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    
    // TEMPORARY: For testing, create mock cargo if no token
    if (!token) {
      console.log('No token found, creating mock cargo for testing...');
      const mockCargo = {
        ...formData,
        id: 'mock-cargo-' + Date.now(),
        createdAt: new Date().toISOString()
      };
      console.log('Mock cargo created:', mockCargo);
      alert('Mock cargo created successfully! Check console for details.');
      navigate('/dashboard/cargos');
      return;
    }
    
    try {
      // Create submission data
      const submissionData = {
        ...formData,
        locations: [
          {
            type: 'PICKUP',
            locationData: {
              name: 'Pickup Location',
              address: 'Default Address',
              coordinates: { latitude: 0, longitude: 0 },
              contactInfo: {
                contactPerson: formData.contactPerson || '',
                contactPhone: formData.contactPhone || '',
                contactEmail: formData.contactEmail || '',
              },
              operatingHours: {
                open: '08:00',
                close: '18:00',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              },
              specialInstructions: '',
              accessInstructions: '',
            },
            scheduledDate: formData.pickupDate,
            estimatedTime: 120,
            requirements: {
              requiresForklift: false,
              requiresCrane: false,
              requiresLoadingDock: false,
              hazmatCertified: formData.isHazardous || false,
              temperatureControlled: formData.requiresRefrigeration || false,
              securityClearance: 'Standard',
            },
            status: 'PENDING',
          },
          {
            type: 'DELIVERY',
            locationData: {
              name: 'Delivery Location',
              address: 'Default Address',
              coordinates: { latitude: 0, longitude: 0 },
              contactInfo: {
                contactPerson: formData.contactPerson || '',
                contactPhone: formData.contactPhone || '',
                contactEmail: formData.contactEmail || '',
              },
              operatingHours: {
                open: '09:00',
                close: '21:00',
                days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              },
              specialInstructions: '',
              accessInstructions: '',
            },
            scheduledDate: formData.deliveryDate,
            estimatedTime: 90,
            requirements: {
              requiresForklift: false,
              requiresCrane: false,
              requiresLoadingDock: false,
              hazmatCertified: formData.isHazardous || false,
              temperatureControlled: formData.requiresRefrigeration || false,
              securityClearance: 'None',
            },
            status: 'PENDING',
          },
        ],
      };

      console.log('Submitting cargo data:', submissionData);

      // Save cargo details to backend
      const response = await fetch('/api/loads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const savedCargo = await response.json();
        console.log('Cargo saved successfully:', savedCargo);
        alert('Cargo created successfully!');
        navigate('/dashboard/cargos');
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save cargo details');
      }
    } catch (error: any) {
      setError(`Failed to save cargo details: ${error.message}. Please try again.`);
      console.error('Cargo creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FaTruck className="text-blue-500 mr-3" size={24} />
            <h1 className="text-3xl font-bold text-gray-900">Create New Cargo</h1>
          </div>
          <p className="text-gray-600">
            Create your cargo with basic information
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter cargo title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo Type
                  </label>
                  <select
                    name="cargoType"
                    value={formData.cargoType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="FRAGILE">Fragile</option>
                    <option value="HAZARDOUS">Hazardous</option>
                    <option value="REFRIGERATED">Refrigerated</option>
                    <option value="LIQUID">Liquid</option>
                    <option value="OVERSIZED">Oversized</option>
                    <option value="VALUABLE">Valuable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter weight in kg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Load Value ($) *
                  </label>
                  <input
                    type="number"
                    name="loadValue"
                    value={formData.loadValue}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter load value"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your cargo"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Pickup & Delivery Dates</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    name="pickupDate"
                    value={formData.pickupDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formData.deliveryDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email address"
                  />
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Special Requirements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFragile"
                    checked={formData.isFragile}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Fragile</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isHazardous"
                    checked={formData.isHazardous}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Hazardous</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="requiresRefrigeration"
                    checked={formData.requiresRefrigeration}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Refrigerated</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions
                </label>
                <textarea
                  name="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special handling requirements"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard/cargos')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4 mr-2" />
                    Create Cargo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CargoCreatePageSimple; 