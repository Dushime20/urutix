import React from 'react';
import { FaMapMarkedAlt, FaSatellite, FaEye, FaShieldAlt } from 'react-icons/fa';

interface TechnologyTrackingStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const TechnologyTrackingStep: React.FC<TechnologyTrackingStepProps> = ({
  formData,
  handleInputChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FaMapMarkedAlt className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Technology & Tracking</h3>
      </div>

      {/* GPS & Tracking */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaSatellite className="w-5 h-5 mr-2 text-gray-600" />
          GPS & Tracking Systems
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasGPS"
              checked={formData.hasGPS || false}
              onChange={(e) => handleInputChange('hasGPS', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasGPS" className="ml-2 text-sm font-medium text-gray-700">
              GPS Tracking
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasTracking"
              checked={formData.hasTracking || false}
              onChange={(e) => handleInputChange('hasTracking', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasTracking" className="ml-2 text-sm font-medium text-gray-700">
              Real-time Tracking
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasTelematics"
              checked={formData.hasTelematics || false}
              onChange={(e) => handleInputChange('hasTelematics', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasTelematics" className="ml-2 text-sm font-medium text-gray-700">
              Telematics
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasELD"
              checked={formData.hasELD || false}
              onChange={(e) => handleInputChange('hasELD', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasELD" className="ml-2 text-sm font-medium text-gray-700">
              ELD (Electronic Logging)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasRouteOptimization"
              checked={formData.hasRouteOptimization || false}
              onChange={(e) => handleInputChange('hasRouteOptimization', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasRouteOptimization" className="ml-2 text-sm font-medium text-gray-700">
              Route Optimization
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasRealTimeTracking"
              checked={formData.hasRealTimeTracking || false}
              onChange={(e) => handleInputChange('hasRealTimeTracking', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasRealTimeTracking" className="ml-2 text-sm font-medium text-gray-700">
              Real-time Tracking
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasGeofencing"
              checked={formData.hasGeofencing || false}
              onChange={(e) => handleInputChange('hasGeofencing', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasGeofencing" className="ml-2 text-sm font-medium text-gray-700">
              Geofencing
            </label>
          </div>
        </div>
      </div>

      {/* Safety Cameras & Monitoring */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaEye className="w-5 h-5 mr-2 text-gray-600" />
          Safety Cameras & Monitoring
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasDashCam"
              checked={formData.hasDashCam || false}
              onChange={(e) => handleInputChange('hasDashCam', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasDashCam" className="ml-2 text-sm font-medium text-gray-700">
              Dash Cam
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasSafetyCameras"
              checked={formData.hasSafetyCameras || false}
              onChange={(e) => handleInputChange('hasSafetyCameras', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasSafetyCameras" className="ml-2 text-sm font-medium text-gray-700">
              Safety Cameras
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasBackupCamera"
              checked={formData.hasBackupCamera || false}
              onChange={(e) => handleInputChange('hasBackupCamera', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasBackupCamera" className="ml-2 text-sm font-medium text-gray-700">
              Backup Camera
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Safety Systems */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaShieldAlt className="w-5 h-5 mr-2 text-gray-600" />
          Advanced Safety Systems
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasCollisionAvoidance"
              checked={formData.hasCollisionAvoidance || false}
              onChange={(e) => handleInputChange('hasCollisionAvoidance', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasCollisionAvoidance" className="ml-2 text-sm font-medium text-gray-700">
              Collision Avoidance
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasLaneDeparture"
              checked={formData.hasLaneDeparture || false}
              onChange={(e) => handleInputChange('hasLaneDeparture', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasLaneDeparture" className="ml-2 text-sm font-medium text-gray-700">
              Lane Departure Warning
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasAdaptiveCruise"
              checked={formData.hasAdaptiveCruise || false}
              onChange={(e) => handleInputChange('hasAdaptiveCruise', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasAdaptiveCruise" className="ml-2 text-sm font-medium text-gray-700">
              Adaptive Cruise Control
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasBlindSpot"
              checked={formData.hasBlindSpot || false}
              onChange={(e) => handleInputChange('hasBlindSpot', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasBlindSpot" className="ml-2 text-sm font-medium text-gray-700">
              Blind Spot Detection
            </label>
          </div>
        </div>
      </div>

      {/* Vehicle Monitoring */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800">Vehicle Monitoring</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasTirePressureMonitoring"
              checked={formData.hasTirePressureMonitoring || false}
              onChange={(e) => handleInputChange('hasTirePressureMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasTirePressureMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Tire Pressure Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasEngineMonitoring"
              checked={formData.hasEngineMonitoring || false}
              onChange={(e) => handleInputChange('hasEngineMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasEngineMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Engine Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasFuelMonitoring"
              checked={formData.hasFuelMonitoring || false}
              onChange={(e) => handleInputChange('hasFuelMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasFuelMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Fuel Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasMaintenanceAlerts"
              checked={formData.hasMaintenanceAlerts || false}
              onChange={(e) => handleInputChange('hasMaintenanceAlerts', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasMaintenanceAlerts" className="ml-2 text-sm font-medium text-gray-700">
              Maintenance Alerts
            </label>
          </div>
        </div>
      </div>

      {/* Driver Monitoring */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800">Driver Monitoring</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasDriverMonitoring"
              checked={formData.hasDriverMonitoring || false}
              onChange={(e) => handleInputChange('hasDriverMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasDriverMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Driver Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasFatigueMonitoring"
              checked={formData.hasFatigueMonitoring || false}
              onChange={(e) => handleInputChange('hasFatigueMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasFatigueMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Fatigue Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasSpeedMonitoring"
              checked={formData.hasSpeedMonitoring || false}
              onChange={(e) => handleInputChange('hasSpeedMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasSpeedMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Speed Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasIdleMonitoring"
              checked={formData.hasIdleMonitoring || false}
              onChange={(e) => handleInputChange('hasIdleMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasIdleMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Idle Monitoring
            </label>
          </div>
        </div>
      </div>

      {/* Cargo Monitoring */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800">Cargo Monitoring</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasTemperatureMonitoring"
              checked={formData.hasTemperatureMonitoring || false}
              onChange={(e) => handleInputChange('hasTemperatureMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasTemperatureMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Temperature Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasHumidityMonitoring"
              checked={formData.hasHumidityMonitoring || false}
              onChange={(e) => handleInputChange('hasHumidityMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasHumidityMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Humidity Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasShockMonitoring"
              checked={formData.hasShockMonitoring || false}
              onChange={(e) => handleInputChange('hasShockMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasShockMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Shock Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasCargoMonitoring"
              checked={formData.hasCargoMonitoring || false}
              onChange={(e) => handleInputChange('hasCargoMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasCargoMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Cargo Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasWeightMonitoring"
              checked={formData.hasWeightMonitoring || false}
              onChange={(e) => handleInputChange('hasWeightMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasWeightMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Weight Monitoring
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasVolumeMonitoring"
              checked={formData.hasVolumeMonitoring || false}
              onChange={(e) => handleInputChange('hasVolumeMonitoring', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasVolumeMonitoring" className="ml-2 text-sm font-medium text-gray-700">
              Volume Monitoring
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyTrackingStep; 
