import React from 'react';

const BrokerRouteTest = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Broker Route Test</h1>
      <p>If you can see this, the broker route is working!</p>
      <div className="mt-4">
        <p>Current URL: {window.location.pathname}</p>
        <p>Current Time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default BrokerRouteTest;