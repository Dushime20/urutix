import React from 'react';
import { MapPin, Navigation, Map as MapIcon, MoreVertical, Package, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui';

interface Shipment {
  id: string;
  title: string;
  driverName: string;
  currentLocation: string;
  progress: number;
  status: 'on-time' | 'delayed' | 'critical';
  eta: string;
}

interface ShipmentTrackingProps {
  shipments: Shipment[];
}

export const ShipmentTracking: React.FC<ShipmentTrackingProps> = ({ shipments }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-500" />
            Live Shipment Tracking
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor active shipments in real-time</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <MapIcon className="w-4 h-4" />
          View Full Map
        </Button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {shipments.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                No active shipments to track right now.
              </div>
            ) : (
              shipments.map((shipment) => (
                <div key={shipment.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow bg-gray-50/30 dark:bg-gray-800/30 relative overflow-hidden">
                  {/* Progress bar background */}
                  <div className="absolute top-0 left-0 h-1 bg-gray-100 dark:bg-gray-700 w-full">
                    <div 
                      className={`h-full ${
                        shipment.status === 'delayed' ? 'bg-amber-500' : 
                        shipment.status === 'critical' ? 'bg-red-500' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${shipment.progress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-start mt-2">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-1 ${
                        shipment.status === 'delayed' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                        shipment.status === 'critical' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                        'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{shipment.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {shipment.currentLocation}
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">Driver:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-300">{shipment.driverName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">ETA:</span>
                      <span className={`font-medium flex items-center gap-1 ${
                        shipment.status === 'delayed' ? 'text-amber-600 dark:text-amber-400' : 
                        shipment.status === 'critical' ? 'text-red-600 dark:text-red-400' : 
                        'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {shipment.status !== 'on-time' && <AlertCircle className="w-3.5 h-3.5" />}
                        {shipment.eta}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="hidden lg:block bg-gray-100 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 relative overflow-hidden min-h-[400px]">
            {/* Placeholder for actual map implementation */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <MapIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium">Interactive Map View</p>
              <p className="text-sm mt-1">Map implementation goes here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
