import React from 'react';
import { FaCheckCircle, FaBoxOpen } from 'react-icons/fa';

const DeliveryConfirmation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <FaBoxOpen className="text-green-500 text-4xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Delivery Confirmation</h1>
          <p className="text-gray-600 mb-6">Confirm successful delivery</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Delivery Status:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Completed</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Delivery Time:</span>
              <span className="font-medium">2:30 PM</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Condition:</span>
              <span className="font-medium text-green-600">Excellent</span>
            </div>
          </div>
          
          <button className="w-full mt-6 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2">
            <FaCheckCircle />
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryConfirmation;
