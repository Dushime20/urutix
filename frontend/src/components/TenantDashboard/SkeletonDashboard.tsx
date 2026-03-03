import React from 'react';

const SkeletonDashboard: React.FC = () => {
    return (
        <div className="space-y-10 animate-pulse">
            {/* Quick Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-[24px] p-6 h-32 border border-gray-100">
                        <div className="h-2 w-20 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 w-32 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>

            {/* Charts Row Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-[24px] border border-gray-100 p-8 h-[400px]">
                        <div className="flex justify-between mb-8">
                            <div>
                                <div className="h-2 w-24 bg-gray-100 rounded mb-2"></div>
                                <div className="h-6 w-48 bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-8 w-24 bg-gray-50 rounded"></div>
                        </div>
                        <div className="w-full h-64 bg-gray-50 rounded-xl"></div>
                    </div>
                ))}
            </div>

            {/* Radar Chart Skeleton */}
            <div className="bg-white rounded-[24px] border border-gray-100 p-8 h-[450px]">
                <div className="h-2 w-32 bg-gray-100 rounded mb-2"></div>
                <div className="h-6 w-64 bg-gray-200 rounded mb-8"></div>
                <div className="w-full h-72 bg-gray-50 rounded-xl"></div>
            </div>

            {/* Activity Feed Skeleton */}
            <div className="bg-white rounded-[24px] border border-gray-100 p-8">
                <div className="h-6 w-48 bg-gray-200 rounded mb-8"></div>
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-gray-100 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                                <div className="h-2 w-1/2 bg-gray-100 rounded"></div>
                            </div>
                            <div className="h-2 w-16 bg-gray-50 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkeletonDashboard;
