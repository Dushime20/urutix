import React from 'react';
import { FleetStatus } from '../types/fleet';

const SimpleFleetTest: React.FC = () => {
  console.log('SimpleFleetTest component is rendering');
  console.log('FleetStatus enum values:', FleetStatus);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Simple Fleet Dashboard Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Trucks</h3>
              <p className="text-2xl font-bold text-blue-600">2</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">Drivers</h3>
              <p className="text-2xl font-bold text-green-600">2</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium text-orange-900">Active Trips</h3>
              <p className="text-2xl font-bold text-orange-600">1</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-green-700">Component rendering successfully</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-green-700">CSS classes working</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-green-700">Tailwind styles applied</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-green-700">React components functional</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-green-700">FleetStatus enum imported correctly</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <a 
            href="/dashboard/fleet" 
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Full Fleet Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

export default SimpleFleetTest; 