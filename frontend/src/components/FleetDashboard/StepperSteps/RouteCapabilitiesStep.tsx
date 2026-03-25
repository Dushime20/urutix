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
      <div className="flex items-center gap-2 mb-6">
        <FaRoute className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Global Navigation & Transit Protocol</h3>
      </div>

      {/* Route Categories */}
      <div className="space-y-8">
        {routeCategories.map((category) => (
          <div key={category.title} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="text-blue-600 dark:text-blue-500">{category.icon}</span>
              <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{category.title}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {category.capabilities.map(({ key, label, description }) => (
                <label key={key} className="group flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.routeCapabilities?.[key] || false}
                      onChange={() => handleRouteToggle(key)}
                      className="w-3.5 h-3.5 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors mb-0.5">
                      {label}
                    </span>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      {description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Distance & Time Limits */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
          <FaMapMarkerAlt className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Range & Operational Latency
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">MAX Operational Radius (KM)</label>
            <input
              type="number"
              value={formData.routeCapabilities?.maxDistance || ''}
              onChange={(e) => handleRouteInputChange('maxDistance', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">MAX Ready Latency (HRS)</label>
            <input
              type="number"
              value={formData.routeCapabilities?.maxHoursToAvailability || ''}
              onChange={(e) => handleRouteInputChange('maxHoursToAvailability', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="24"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">MAX Ferry Entry Width (M)</label>
            <input
              type="number"
              value={formData.routeCapabilities?.maxFerryLength || ''}
              onChange={(e) => handleRouteInputChange('maxFerryLength', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="20"
            />
          </div>
        </div>
      </div>

      {/* Route Restrictions */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
          Regulatory Constraints
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'hasWeightRestrictions', label: 'Weight' },
            { key: 'hasHeightRestrictions', label: 'Height' },
            { key: 'hasWidthRestrictions', label: 'Width' },
            { key: 'hasLengthRestrictions', label: 'Length' },
          ].map(({ key, label }) => (
            <label key={key} className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
              <input
                type="checkbox"
                checked={formData.routeCapabilities?.[key] || false}
                onChange={() => handleRouteToggle(key)}
                className="w-3.5 h-3.5 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
              />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Route Summary */}
      <div className="bg-blue-600/5 dark:bg-blue-600/10 rounded-lg p-4 border border-blue-600/10">
        <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-4">Transit Profile Summary</h4>
        <div className="space-y-4">
          {routeCategories.map((category) => {
            const selectedCapabilities = category.capabilities.filter(
              ({ key }) => formData.routeCapabilities?.[key]
            );
            
            if (selectedCapabilities.length === 0) return null;
            
            return (
              <div key={category.title} className="border-l-2 border-blue-600/20 pl-4 py-0.5">
                <div className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="opacity-50">{category.icon}</span>
                  {category.title}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCapabilities.map(({ key, label }) => (
                    <span key={key} className="px-2 py-0.5 bg-white dark:bg-gray-800 text-[9px] font-bold text-gray-600 dark:text-gray-400 rounded border border-gray-100 dark:border-gray-700 uppercase tracking-wider">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {Object.values(formData.routeCapabilities || {}).filter(Boolean).length === 0 && (
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">NO CAPABILITIES REGISTERED</span>
        )}
      </div>
    </div>
  );
};

