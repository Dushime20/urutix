import React from 'react';
import { FaShieldAlt, FaLock } from 'react-icons/fa';

const EscrowManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <FaShieldAlt className="text-blue-500 text-4xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Escrow Management</h1>
          <p className="text-gray-600 mb-6">Secure payment escrow system</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Escrow Amount:</span>
              <span className="font-medium text-green-600">$2,500.00</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Status:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Release Conditions:</span>
              <span className="font-medium">Delivery Confirmed</span>
            </div>
          </div>
          
          <div className="mt-6">
            <FaLock className="text-blue-500 text-2xl mx-auto mb-2" />
            <p className="text-sm text-gray-600">Payment secured in escrow</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowManagement;
