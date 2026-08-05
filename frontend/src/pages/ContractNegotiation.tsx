import React from 'react';
import { FaFileContract, FaHandshake } from 'react-icons/fa';

const ContractNegotiation: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center">
          <FaFileContract className="text-blue-500 text-4xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Contract Negotiation</h1>
          <p className="text-gray-600 dark:text-slate-300 mb-6">Negotiate terms and conditions</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Proposed Terms</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Delivery within 48 hours</li>
                <li>• Full insurance coverage</li>
                <li>• Escrow payment protection</li>
                <li>• Real-time tracking</li>
              </ul>
            </div>
            
            <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2">
              <FaHandshake />
              Accept Terms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractNegotiation;
