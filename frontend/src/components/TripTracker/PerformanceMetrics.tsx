import React from 'react';

export const PerformanceMetrics = ({ metrics }: any) => (
  <div className="mb-4 p-2 bg-white rounded shadow">
    <h2 className="text-lg font-bold mb-2">Performance Metrics</h2>
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
      {metrics && Object.entries(metrics).map(([key, value]) => (
        <React.Fragment key={key}>
          <dt className="font-semibold text-gray-600">{key}</dt>
          <dd className="text-gray-900">{String(value)}</dd>
        </React.Fragment>
      ))}
    </dl>
  </div>
);
