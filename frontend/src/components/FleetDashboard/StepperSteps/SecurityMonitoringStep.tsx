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
        { key: 'hasGps', label: 'GPS', description: 'GPS hardware installed on the vehicle' },
        { key: 'hasRealTimeTracking', label: 'Real-Time Tracking', description: 'Live location tracking, distinct from basic GPS' },
        { key: 'hasGeofencing', label: 'Geofencing', description: 'Virtual boundary alerts' },
        { key: 'hasTelematics', label: 'Telematics', description: 'Advanced vehicle telematics' },
        { key: 'hasTracking', label: 'Asset Tracking', description: 'Asset / fleet tracking service' },
        { key: 'hasRouteOptimization', label: 'Route Optimization', description: 'AI-powered route planning' },
      ],
    },
    {
      title: 'Safety & Monitoring',
      icon: <FaShieldAlt className="w-4 h-4" />,
      features: [
        { key: 'hasDashCam', label: 'Dash Cam', description: 'Forward-facing dash camera' },
        { key: 'hasSafetyCameras', label: 'Cameras', description: 'Additional vehicle cameras, distinct from dash cam' },
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
      title: 'Environmental Monitoring',
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
      title: 'Vehicle Health Monitoring',
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
      <div className="flex items-center gap-2 mb-6">
        <FaShieldAlt className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Security & Telemetry Protocol</h3>
      </div>

      {/* Security Features by Category */}
      <div className="space-y-8">
        {securityCategories.map((category) => (
          <div key={category.title} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="text-blue-600 dark:text-blue-500">{category.icon}</span>
              <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{category.title}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.features.map(({ key, label, description }) => (
                <label key={key} className="group flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.securityFeatures?.[key] || false}
                      onChange={() => handleSecurityToggle(key)}
                      className="w-3.5 h-3.5 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors truncate">
                        {label}
                      </span>
                      {key === 'hasGps' && (
                        <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold italic uppercase tracking-tighter shrink-0">CRITICAL</span>
                      )}
                    </div>
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

      {/* Security Summary */}
      <div className="bg-blue-600/5 dark:bg-blue-600/10 rounded-lg p-4 border border-blue-600/10">
        <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-4">Protocol Compliance Summary</h4>
        <div className="space-y-4">
          {securityCategories.map((category) => {
            const selectedFeatures = category.features.filter(
              ({ key }) => formData.securityFeatures?.[key]
            );
            
            if (selectedFeatures.length === 0) return null;
            
            return (
              <div key={category.title} className="border-l-2 border-blue-600/20 pl-4 py-0.5">
                <div className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="opacity-50">{category.icon}</span>
                  {category.title}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFeatures.map(({ key, label }) => (
                    <span key={key} className="px-2 py-0.5 bg-white dark:bg-gray-800 text-[9px] font-bold text-gray-600 dark:text-gray-400 rounded border border-gray-100 dark:border-gray-700 uppercase tracking-wider">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {Object.values(formData.securityFeatures || {}).filter(Boolean).length === 0 && (
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">NO PROTOCOLS ACTIVATED</span>
        )}
      </div>
    </div>
  );
};

