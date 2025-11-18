import React from 'react';

const FleetSkeletonComp: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-300 rounded w-20"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-48"></div>
              <div className="h-4 bg-gray-300 rounded w-40"></div>
              <div className="h-4 bg-gray-300 rounded w-36"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const FleetSkeleton = React.memo(FleetSkeletonComp);