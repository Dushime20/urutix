import React from 'react';
import { FaGavel, FaBalanceScale } from 'react-icons/fa';

const DisputeResolution: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center">
          <FaGavel className="text-blue-500 text-4xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dispute Resolution</h1>
          <p className="text-gray-600 mb-6">Professional dispute mediation</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Dispute Details</h3>
              <p className="text-sm text-yellow-800">No active disputes found</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Resolution Process</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Evidence collection</li>
                <li>• Mediation process</li>
                <li>• Resolution agreement</li>
                <li>• Settlement processing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeResolution;
