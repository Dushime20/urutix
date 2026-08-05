import React from 'react';
import { FleetDashboard } from '../components/FleetDashboard';

const TestFleetDashboard: React.FC = () => {
  console.log('TestFleetDashboard component is rendering');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800/50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Fleet Dashboard Test</h1>
        <p className="text-gray-600 dark:text-slate-300 mb-4">This is a test page to verify the fleet dashboard components are working.</p>
        <FleetDashboard />
      </div>
    </div>
  );
};

export default TestFleetDashboard; 