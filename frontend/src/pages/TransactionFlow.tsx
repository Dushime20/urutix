import React from 'react';
import { FaRoute, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const TransactionFlow: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Transaction Flow</h1>
          <p className="text-gray-600 mb-8">Complete transaction management system</p>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
              <FaCheckCircle className="text-green-500 text-xl" />
              <div>
                <h3 className="font-semibold text-green-900">Matching Complete</h3>
                <p className="text-green-700 text-sm">Cargo-truck matching successful</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <FaClock className="text-blue-500 text-xl" />
              <div>
                <h3 className="font-semibold text-blue-900">Booking Confirmation</h3>
                <p className="text-blue-700 text-sm">Review and confirm booking details</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg">
              <FaRoute className="text-yellow-500 text-xl" />
              <div>
                <h3 className="font-semibold text-yellow-900">Contract Negotiation</h3>
                <p className="text-yellow-700 text-sm">Negotiate terms and conditions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
              <FaCheckCircle className="text-purple-500 text-xl" />
              <div>
                <h3 className="font-semibold text-purple-900">Escrow Setup</h3>
                <p className="text-purple-700 text-sm">Secure payment processing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionFlow;
