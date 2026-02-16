import React from 'react';
import { RefreshCw, Download, Clock, MapPin, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface DriverHeaderProps {
  driver: any;
  lastUpdated: Date;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  driver,
  lastUpdated,
  isRefreshing,
  onRefresh,
  onExport
}) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Driver Info */}
          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
            >
              {driver?.profileImage ? (
                <img
                  src={driver.profileImage}
                  alt={`${driver.firstName} ${driver.lastName}`}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xl">
                  {driver?.firstName?.[0]}{driver?.lastName?.[0]}
                </span>
              )}
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {driver?.firstName} {driver?.lastName}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {driver?.currentLocation || 'Location unavailable'}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>

            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </motion.button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                <button
                  onClick={() => onExport('csv')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg transition-colors"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => onExport('excel')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => onExport('pdf')}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg transition-colors"
                >
                  Export as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
