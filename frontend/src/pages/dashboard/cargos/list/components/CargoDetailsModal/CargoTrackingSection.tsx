import { Navigation, Play, Pause, RefreshCw, Settings, Route } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CargoTrackingSectionProps {
  isTrackingEnabled: boolean;
  onTrackingToggle: () => void;
}

const CargoTrackingSection = ({ isTrackingEnabled, onTrackingToggle }: CargoTrackingSectionProps) => {
  return (
    <div className="space-y-6">
      {/* Tracking Controls */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-indigo-600" />
            Tracking Information
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant={isTrackingEnabled ? "destructive" : "default"}
              size="sm"
              onClick={onTrackingToggle}
              className="h-9 px-4 rounded-lg transition-all duration-200"
            >
              {isTrackingEnabled ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Tracking
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Tracking
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isTrackingEnabled ? (
          <div className="space-y-6">
            {/* Tracking Status */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                  Current Status
                </h4>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                  Active
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <span className="text-xs text-gray-500 font-medium">Location</span>
                  <p className="text-sm font-semibold text-gray-900">Kigali, Rwanda</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <span className="text-xs text-gray-500 font-medium">Speed</span>
                  <p className="text-sm font-semibold text-gray-900">65 km/h</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <span className="text-xs text-gray-500 font-medium">ETA</span>
                  <p className="text-sm font-semibold text-gray-900">2 hours</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Delivery Progress</h4>
                <span className="text-sm font-semibold text-blue-600">75% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: "75%" }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                  Pickup
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                  In Transit
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mr-1"></div>
                  Delivery
                </span>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Tracking Timeline</h4>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Cargo picked up</p>
                    <p className="text-xs text-gray-500">2 hours ago • Kigali, Rwanda</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">In transit</p>
                    <p className="text-xs text-gray-500">1 hour ago • Highway A1</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Expected delivery</p>
                    <p className="text-xs text-gray-500">2 hours from now • Nairobi, Kenya</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Route className="w-10 h-10 text-indigo-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Tracking Disabled</h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Tracking is currently disabled. Click "Start Tracking" to enable real-time monitoring.
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              This will include GPS tracking, status updates, and delivery notifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CargoTrackingSection;

