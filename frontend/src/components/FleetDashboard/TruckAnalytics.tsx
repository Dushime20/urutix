import React from 'react';
import { FaChartBar, FaTruck, FaBox, FaShieldAlt, FaTools, FaRoute, FaDollarSign, FaThermometerHalf } from 'react-icons/fa';

interface TruckAnalyticsProps {
  trucks: any[];
}

export const TruckAnalytics: React.FC<TruckAnalyticsProps> = ({ trucks }) => {
  const calculateCargoAlignmentStats = () => {
    const stats = {
      totalTrucks: trucks.length,
      cargoTypeCoverage: {
        GENERAL: 0,
        FRAGILE: 0,
        HAZARDOUS: 0,
        REFRIGERATED: 0,
        LIQUID: 0,
        OVERSIZED: 0,
        VALUABLE: 0,
      },
      specialHandling: {
        fragile: 0,
        hazardous: 0,
        refrigerated: 0,
        liquid: 0,
        oversized: 0,
        valuable: 0,
      },
      equipmentCoverage: {
        forklift: 0,
        crane: 0,
        tailLift: 0,
        sideLift: 0,
      },
      securityFeatures: {
        gps: 0,
        tracking: 0,
        temperatureMonitoring: 0,
        cargoMonitoring: 0,
      },
      temperatureRanges: {
        frozen: 0, // -40 to -10
        chilled: 0, // -10 to 5
        ambient: 0, // 5 to 25
        heated: 0, // 25+
      },
    };

    trucks.forEach(truck => {
      if (truck.cargoCapabilities) {
        // Cargo type coverage
        truck.cargoCapabilities.supportedCargoTypes?.forEach((type: string) => {
          if (stats.cargoTypeCoverage[type as keyof typeof stats.cargoTypeCoverage] !== undefined) {
            stats.cargoTypeCoverage[type as keyof typeof stats.cargoTypeCoverage]++;
          }
        });

        // Special handling capabilities
        if (truck.cargoCapabilities.maxFragileHandling) stats.specialHandling.fragile++;
        if (truck.cargoCapabilities.maxHazardousHandling) stats.specialHandling.hazardous++;
        if (truck.cargoCapabilities.maxRefrigeratedHandling) stats.specialHandling.refrigerated++;
        if (truck.cargoCapabilities.maxLiquidHandling) stats.specialHandling.liquid++;
        if (truck.cargoCapabilities.maxOversizedHandling) stats.specialHandling.oversized++;
        if (truck.cargoCapabilities.maxValuableHandling) stats.specialHandling.valuable++;

        // Temperature range analysis
        if (truck.cargoCapabilities.temperatureRange) {
          const { min, max } = truck.cargoCapabilities.temperatureRange;
          if (min <= -10 && max <= -10) stats.temperatureRanges.frozen++;
          else if (min <= 5 && max <= 5) stats.temperatureRanges.chilled++;
          else if (min <= 25 && max <= 25) stats.temperatureRanges.ambient++;
          else if (min >= 25) stats.temperatureRanges.heated++;
        }
      }

      if (truck.loadingCapabilities) {
        if (truck.loadingCapabilities.hasForklift) stats.equipmentCoverage.forklift++;
        if (truck.loadingCapabilities.hasCrane) stats.equipmentCoverage.crane++;
        if (truck.loadingCapabilities.hasTailLift) stats.equipmentCoverage.tailLift++;
        if (truck.loadingCapabilities.hasSideLift) stats.equipmentCoverage.sideLift++;
      }

      if (truck.securityFeatures) {
        if (truck.securityFeatures.hasGps) stats.securityFeatures.gps++;
        if (truck.securityFeatures.hasTracking) stats.securityFeatures.tracking++;
        if (truck.securityFeatures.hasTemperatureAlerts) stats.securityFeatures.temperatureMonitoring++;
        if (truck.securityFeatures.hasCargoMonitoring) stats.securityFeatures.cargoMonitoring++;
      }
    });

    return stats;
  };

  const stats = calculateCargoAlignmentStats();

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-2xl text-gray-400">{icon}</div>
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{value}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${(value / total) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaChartBar className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">Truck Analytics & Cargo Alignment</h2>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Trucks"
          value={stats.totalTrucks}
          icon={<FaTruck />}
          color=""
        />
        <StatCard
          title="GPS Enabled"
          value={stats.securityFeatures.gps}
          icon={<FaShieldAlt />}
          color=""
        />
        <StatCard
          title="Refrigerated"
          value={stats.specialHandling.refrigerated}
          icon={<FaThermometerHalf />}
          color=""
        />
        <StatCard
          title="Hazmat Certified"
          value={stats.specialHandling.hazardous}
          icon={<FaBox />}
          color=""
        />
      </div>

      {/* Cargo Type Coverage */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FaBox className="w-5 h-5 text-primary-600" />
          Cargo Type Coverage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ProgressBar
              label="General Cargo"
              value={stats.cargoTypeCoverage.GENERAL}
              total={stats.totalTrucks}
              color="bg-blue-500"
            />
            <ProgressBar
              label="Fragile Cargo"
              value={stats.cargoTypeCoverage.FRAGILE}
              total={stats.totalTrucks}
              color="bg-yellow-500"
            />
            <ProgressBar
              label="Hazardous Cargo"
              value={stats.cargoTypeCoverage.HAZARDOUS}
              total={stats.totalTrucks}
              color="bg-red-500"
            />
            <ProgressBar
              label="Refrigerated Cargo"
              value={stats.cargoTypeCoverage.REFRIGERATED}
              total={stats.totalTrucks}
              color="bg-blue-500"
            />
          </div>
          <div className="space-y-4">
            <ProgressBar
              label="Liquid Cargo"
              value={stats.cargoTypeCoverage.LIQUID}
              total={stats.totalTrucks}
              color="bg-green-500"
            />
            <ProgressBar
              label="Oversized Cargo"
              value={stats.cargoTypeCoverage.OVERSIZED}
              total={stats.totalTrucks}
              color="bg-purple-500"
            />
            <ProgressBar
              label="Valuable Cargo"
              value={stats.cargoTypeCoverage.VALUABLE}
              total={stats.totalTrucks}
              color="bg-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Equipment & Security Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loading Equipment */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FaTools className="w-5 h-5 text-primary-600" />
            Loading Equipment Coverage
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="Forklift"
              value={stats.equipmentCoverage.forklift}
              total={stats.totalTrucks}
              color="bg-gray-500"
            />
            <ProgressBar
              label="Crane"
              value={stats.equipmentCoverage.crane}
              total={stats.totalTrucks}
              color="bg-gray-500"
            />
            <ProgressBar
              label="Tail Lift"
              value={stats.equipmentCoverage.tailLift}
              total={stats.totalTrucks}
              color="bg-gray-500"
            />
            <ProgressBar
              label="Side Lift"
              value={stats.equipmentCoverage.sideLift}
              total={stats.totalTrucks}
              color="bg-gray-500"
            />
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FaShieldAlt className="w-5 h-5 text-primary-600" />
            Security Features Coverage
          </h3>
          <div className="space-y-4">
            <ProgressBar
              label="GPS Tracking"
              value={stats.securityFeatures.gps}
              total={stats.totalTrucks}
              color="bg-green-500"
            />
            <ProgressBar
              label="Real-time Tracking"
              value={stats.securityFeatures.tracking}
              total={stats.totalTrucks}
              color="bg-green-500"
            />
            <ProgressBar
              label="Temperature Monitoring"
              value={stats.securityFeatures.temperatureMonitoring}
              total={stats.totalTrucks}
              color="bg-blue-500"
            />
            <ProgressBar
              label="Cargo Monitoring"
              value={stats.securityFeatures.cargoMonitoring}
              total={stats.totalTrucks}
              color="bg-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Temperature Range Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FaThermometerHalf className="w-5 h-5 text-primary-600" />
          Temperature Range Coverage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.temperatureRanges.frozen}</div>
            <div className="text-sm text-gray-600">Frozen (-40°C to -10°C)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.temperatureRanges.chilled}</div>
            <div className="text-sm text-gray-600">Chilled (-10°C to 5°C)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.temperatureRanges.ambient}</div>
            <div className="text-sm text-gray-600">Ambient (5°C to 25°C)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.temperatureRanges.heated}</div>
            <div className="text-sm text-gray-600">Heated (25°C+)</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Cargo Alignment Recommendations</h3>
        <div className="space-y-3 text-sm text-blue-800">
          {stats.cargoTypeCoverage.HAZARDOUS < stats.totalTrucks * 0.3 && (
            <p>• Consider adding more hazmat-certified trucks for hazardous cargo transport</p>
          )}
          {stats.cargoTypeCoverage.REFRIGERATED < stats.totalTrucks * 0.4 && (
            <p>• Increase refrigerated truck capacity for temperature-sensitive cargo</p>
          )}
          {stats.securityFeatures.gps < stats.totalTrucks * 0.8 && (
            <p>• Improve GPS tracking coverage for better fleet visibility</p>
          )}
          {stats.equipmentCoverage.forklift < stats.totalTrucks * 0.5 && (
            <p>• Add more forklift-equipped trucks for efficient loading/unloading</p>
          )}
          {stats.temperatureRanges.frozen === 0 && (
            <p>• Consider adding frozen cargo capability for cold chain logistics</p>
          )}
        </div>
      </div>
    </div>
  );
};
