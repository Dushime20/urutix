import React from 'react';
import { FaRoute, FaMapMarkerAlt, FaRoad, FaMountain, FaShip, FaPlane } from 'react-icons/fa';

interface RouteCapabilitiesStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const RouteCapabilitiesStep: React.FC<RouteCapabilitiesStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const handleRouteToggle = (capability: string) => {
    handleInputChange('routeCapabilities', {
      ...formData.routeCapabilities,
      [capability]: !formData.routeCapabilities?.[capability],
    });
  };

  const handleRouteInputChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleInputChange('routeCapabilities', {
      ...formData.routeCapabilities,
      [field]: numValue,
    });
  };

  const routeCategories = [
    {
      title: 'Route Types',
      icon: <FaRoad className="w-4 h-4" />,
      capabilities: [
        { key: 'supportsUrbanRoutes', label: 'Urban Routes', description: 'City and metropolitan areas' },
        { key: 'supportsRuralRoutes', label: 'Rural Routes', description: 'Country and remote areas' },
        { key: 'supportsHighwayRoutes', label: 'Highway Routes', description: 'Interstate and major highways' },
        { key: 'supportsTollRoads', label: 'Toll Roads', description: 'Toll road access' },
        { key: 'supportsBorderCrossing', label: 'Border Crossing', description: 'International border access' },
        { key: 'supportsPortAccess', label: 'Port Access', description: 'Seaport and harbor access' },
      ],
    },
    {
      title: 'Terrain & Conditions',
      icon: <FaMountain className="w-4 h-4" />,
      capabilities: [
        { key: 'supportsMountainRoutes', label: 'Mountain Routes', description: 'High elevation and steep grades' },
        { key: 'supportsDesertRoutes', label: 'Desert Routes', description: 'Hot and arid conditions' },
        { key: 'supportsSnowRoutes', label: 'Snow Routes', description: 'Winter and snow conditions' },
        { key: 'supportsOffRoad', label: 'Off-Road Capable', description: 'Unpaved and rough terrain' },
        { key: 'supportsTunnelRoutes', label: 'Tunnel Routes', description: 'Underground and tunnel access' },
        { key: 'supportsBridgeRoutes', label: 'Bridge Routes', description: 'Bridge weight and height restrictions' },
      ],
    },
    {
      title: 'Transport Modes',
      icon: <FaShip className="w-4 h-4" />,
      capabilities: [
        { key: 'supportsFerryTransport', label: 'Ferry Transport', description: 'Vehicle ferry compatibility' },
        { key: 'supportsRailTransport', label: 'Rail Transport', description: 'Rail car transport' },
        { key: 'supportsAirFreight', label: 'Air Freight', description: 'Air cargo compatibility' },
        { key: 'supportsIntermodal', label: 'Intermodal', description: 'Multi-modal transport' },
        { key: 'supportsContainerTransport', label: 'Container Transport', description: 'Container handling' },
        { key: 'supportsBulkTransport', label: 'Bulk Transport', description: 'Bulk material handling' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FaRoute className="w-5 h-5 text-gray-600" />
          Route Capabilities Configuration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure the types of routes and transport modes this truck can handle.
        </p>
      </div>

      {/* Route Categories */}
      <div className="space-y-6">
        {routeCategories.map((category) => (
          <div key={category.title} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              {category.icon}
              <h4 className="text-md font-medium text-gray-900">{category.title}</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.capabilities.map(({ key, label, description }) => (
                <div key={key} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.routeCapabilities?.[key] || false}
                      onChange={() => handleRouteToggle(key)}
                      className="mt-1 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{label}</div>
                      <div className="text-xs text-gray-600 mt-1">{description}</div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Distance & Time Limits */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="w-4 h-4 text-gray-500" />
          <label className="block text-sm font-medium text-gray-700">
            Distance & Time Limits
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Distance (km)</label>
            <input
              type="number"
              value={formData.routeCapabilities?.maxDistance || ''}
              onChange={(e) => handleRouteInputChange('maxDistance', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Hours to Availability</label>
            <input
              type="number"
              value={formData.routeCapabilities?.maxHoursToAvailability || ''}
              onChange={(e) => handleRouteInputChange('maxHoursToAvailability', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="24"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Max Ferry Length (m)</label>
            <input
              type="number"
              value={formData.routeCapabilities?.maxFerryLength || ''}
              onChange={(e) => handleRouteInputChange('maxFerryLength', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="20"
            />
          </div>
        </div>
      </div>

      {/* Route Restrictions */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Route Restrictions
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.routeCapabilities?.hasWeightRestrictions || false}
                  onChange={() => handleRouteToggle('hasWeightRestrictions')}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-700">Weight Restrictions</span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.routeCapabilities?.hasHeightRestrictions || false}
                  onChange={() => handleRouteToggle('hasHeightRestrictions')}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-700">Height Restrictions</span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.routeCapabilities?.hasWidthRestrictions || false}
                  onChange={() => handleRouteToggle('hasWidthRestrictions')}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-700">Width Restrictions</span>
              </label>
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.routeCapabilities?.hasLengthRestrictions || false}
                  onChange={() => handleRouteToggle('hasLengthRestrictions')}
                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-700">Length Restrictions</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Route Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Route Capabilities Summary</h4>
        <div className="space-y-2">
          {routeCategories.map((category) => {
            const selectedCapabilities = category.capabilities.filter(
              ({ key }) => formData.routeCapabilities?.[key]
            );
            
            if (selectedCapabilities.length === 0) return null;
            
            return (
              <div key={category.title} className="border-l-4 border-gray-500 pl-3">
                <div className="text-sm font-medium text-gray-900 mb-1">{category.title}</div>
                <div className="flex flex-wrap gap-1">
                  {selectedCapabilities.map(({ key, label }) => (
                    <span key={key} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {Object.values(formData.routeCapabilities || {}).filter(Boolean).length === 0 && (
          <span className="text-gray-500 text-sm">No route capabilities selected</span>
        )}
      </div>
    </div>
  );
};
