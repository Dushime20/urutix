import React from 'react';
import { FaShieldAlt, FaEye, FaBell, FaMapMarkerAlt, FaThermometerHalf } from 'react-icons/fa';

interface SecurityMonitoringStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const SecurityMonitoringStep: React.FC<SecurityMonitoringStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const handleSecurityToggle = (feature: string) => {
    handleInputChange('securityFeatures', {
      ...formData.securityFeatures,
      [feature]: !formData.securityFeatures?.[feature],
    });
  };

  const securityCategories = [
    {
      title: 'GPS & Tracking',
      icon: <FaMapMarkerAlt className="w-4 h-4" />,
      features: [
        { key: 'hasGps', label: 'GPS Navigation', description: 'Real-time GPS tracking' },
        { key: 'hasTracking', label: 'Real-time Tracking', description: 'Live location tracking' },
        { key: 'hasTelematics', label: 'Telematics System', description: 'Advanced vehicle monitoring' },
        { key: 'hasRouteOptimization', label: 'Route Optimization', description: 'AI-powered route planning' },
        { key: 'hasRealTimeTracking', label: 'Real-time Updates', description: 'Live status updates' },
        { key: 'hasGeofencing', label: 'Geofencing', description: 'Virtual boundary alerts' },
      ],
    },
    {
      title: 'Safety & Monitoring',
      icon: <FaShieldAlt className="w-4 h-4" />,
      features: [
        { key: 'hasDashCam', label: 'Dash Cam', description: 'Forward-facing camera' },
        { key: 'hasSafetyCameras', label: 'Safety Cameras', description: 'Multi-angle surveillance' },
        { key: 'hasCollisionAvoidance', label: 'Collision Avoidance', description: 'Automatic braking system' },
        { key: 'hasLaneDeparture', label: 'Lane Departure', description: 'Lane departure warning' },
        { key: 'hasAdaptiveCruise', label: 'Adaptive Cruise', description: 'Smart cruise control' },
        { key: 'hasBlindSpot', label: 'Blind Spot Monitor', description: 'Blind spot detection' },
        { key: 'hasBackupCamera', label: 'Backup Camera', description: 'Rear-view camera' },
      ],
    },
    {
      title: 'Cargo Monitoring',
      icon: <FaEye className="w-4 h-4" />,
      features: [
        { key: 'hasCargoMonitoring', label: 'Cargo Monitoring', description: 'Cargo condition tracking' },
        { key: 'hasWeightMonitoring', label: 'Weight Monitoring', description: 'Real-time weight tracking' },
        { key: 'hasVolumeMonitoring', label: 'Volume Monitoring', description: 'Cargo volume tracking' },
        { key: 'hasDoorMonitoring', label: 'Door Monitoring', description: 'Door open/close alerts' },
        { key: 'hasShockMonitoring', label: 'Shock Monitoring', description: 'Impact detection' },
        { key: 'hasTiltMonitoring', label: 'Tilt Monitoring', description: 'Cargo tilt detection' },
      ],
    },
    {
      title: 'Temperature & Environment',
      icon: <FaThermometerHalf className="w-4 h-4" />,
      features: [
        { key: 'hasTemperatureAlerts', label: 'Temperature Alerts', description: 'Temperature deviation alerts' },
        { key: 'hasHumidityAlerts', label: 'Humidity Alerts', description: 'Humidity level monitoring' },
        { key: 'hasPressureMonitoring', label: 'Pressure Monitoring', description: 'Air pressure tracking' },
        { key: 'hasFlowMonitoring', label: 'Flow Monitoring', description: 'Liquid flow tracking' },
        { key: 'hasLevelMonitoring', label: 'Level Monitoring', description: 'Tank level tracking' },
        { key: 'hasQualityMonitoring', label: 'Quality Monitoring', description: 'Cargo quality tracking' },
        { key: 'hasContaminationMonitoring', label: 'Contamination Monitor', description: 'Contamination detection' },
      ],
    },
    {
      title: 'Driver Monitoring',
      icon: <FaBell className="w-4 h-4" />,
      features: [
        { key: 'hasELD', label: 'Electronic Logging Device', description: 'Hours of service tracking' },
        { key: 'hasDriverMonitoring', label: 'Driver Monitoring', description: 'Driver behavior tracking' },
        { key: 'hasFatigueMonitoring', label: 'Fatigue Monitoring', description: 'Driver fatigue detection' },
        { key: 'hasSpeedMonitoring', label: 'Speed Monitoring', description: 'Speed limit compliance' },
        { key: 'hasIdleMonitoring', label: 'Idle Monitoring', description: 'Engine idle tracking' },
      ],
    },
    {
      title: 'Vehicle Systems',
      icon: <FaShieldAlt className="w-4 h-4" />,
      features: [
        { key: 'hasTirePressureMonitoring', label: 'Tire Pressure Monitor', description: 'Tire pressure tracking' },
        { key: 'hasEngineMonitoring', label: 'Engine Monitoring', description: 'Engine health tracking' },
        { key: 'hasFuelMonitoring', label: 'Fuel Monitoring', description: 'Fuel consumption tracking' },
        { key: 'hasMaintenanceAlerts', label: 'Maintenance Alerts', description: 'Service reminder system' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FaShieldAlt className="w-5 h-5 text-gray-600" />
          Security & Monitoring Configuration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure security features and monitoring systems for this truck.
        </p>
      </div>

      {/* Security Features by Category */}
      <div className="space-y-6">
        {securityCategories.map((category) => (
          <div key={category.title} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              {category.icon}
              <h4 className="text-md font-medium text-gray-900">{category.title}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.features.map(({ key, label, description }) => (
                <div key={key} className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.securityFeatures?.[key] || false}
                      onChange={() => handleSecurityToggle(key)}
                      className="mt-1 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm flex items-center">
                        {label}
                        {key === 'hasGps' && (
                          <span className="ml-2 text-xs text-blue-600 font-normal">(Used in matching)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{description}</div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Security Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Security Features Summary</h4>
        <div className="space-y-2">
          {securityCategories.map((category) => {
            const selectedFeatures = category.features.filter(
              ({ key }) => formData.securityFeatures?.[key]
            );
            
            if (selectedFeatures.length === 0) return null;
            
            return (
              <div key={category.title} className="border-l-4 border-gray-500 pl-3">
                <div className="text-sm font-medium text-gray-900 mb-1">{category.title}</div>
                <div className="flex flex-wrap gap-1">
                  {selectedFeatures.map(({ key, label }) => (
                    <span key={key} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {Object.values(formData.securityFeatures || {}).filter(Boolean).length === 0 && (
          <span className="text-gray-500 text-sm">No security features selected</span>
        )}
      </div>
    </div>
  );
};
