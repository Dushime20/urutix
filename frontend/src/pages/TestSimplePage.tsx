import React from 'react';

const TestSimplePage: React.FC = () => {
  console.log('TestSimplePage rendering');
  
  return (
    <div className="p-6 bg-red-100">
      <h1 className="text-2xl font-bold text-red-800">Test Simple Page</h1>
      <p className="text-red-600">This is a simple test page to verify routing is working.</p>
      <div className="mt-4 p-4 bg-white rounded">
        <p>If you can see this, the routing and component rendering is working correctly.</p>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default TestSimplePage; 