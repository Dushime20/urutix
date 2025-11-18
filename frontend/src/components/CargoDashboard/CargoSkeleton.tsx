import React from 'react';

export const CargoSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-300 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
            <div className="w-20 h-8 bg-gray-300 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
