import React from 'react';

export const DriverSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
              <div>
                <div className="w-48 h-6 bg-gray-200 rounded mb-2"></div>
                <div className="w-64 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-24 h-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Range Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="w-64 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-12 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="w-48 h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="w-full h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="w-full h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
