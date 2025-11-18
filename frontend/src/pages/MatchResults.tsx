import React from 'react';
import { FaTruck, FaStar, FaCheckCircle } from 'react-icons/fa';

const MatchResults: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Match Results</h1>
        <p className="text-gray-600 mb-8">AI-powered cargo-truck matching results</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((match) => (
            <div key={match} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FaTruck className="text-blue-500" />
                  <span className="font-semibold">Truck #{match}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaStar className="text-yellow-400" />
                  <span className="text-sm font-medium">{(0.9 - match * 0.1).toFixed(1)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Match Score:</span>
                  <span className="font-medium text-green-600">{(0.9 - match * 0.1) * 100}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">${(2500 + match * 200).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ETA:</span>
                  <span className="font-medium">{24 + match * 2}h</span>
                </div>
              </div>
              
              <button className="w-full mt-4 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2">
                <FaCheckCircle />
                <span>Select Match</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatchResults;
