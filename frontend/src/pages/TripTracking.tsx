import React from 'react';
import { FaMapMarkerAlt, FaTruck, FaClock } from 'react-icons/fa';

const TripTracking: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center">
          <FaTruck className="text-blue-500 text-4xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Tracking</h1>
          <p className="text-gray-600 mb-6">Real-time shipment tracking</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Current Location:</span>
              <span className="font-medium">San Jose, CA</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">ETA:</span>
              <span className="font-medium">2 hours</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Status:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">In Transit</span>
            </div>
          </div>
          
          <div className="mt-6">
            <FaMapMarkerAlt className="text-green-500 text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-600">GPS tracking active</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripTracking;
