import React from 'react';

const FleetSkeletonComp: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
              <div className="size-12 bg-slate-100 rounded-2xl" />
              <div className="w-16 h-5 bg-slate-100 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-5 bg-slate-100 rounded-xl w-32" />
              <div className="h-3 bg-slate-100 rounded-lg w-20" />
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-slate-100 rounded-lg w-full" />
              <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
            </div>
            <div className="flex gap-2 pt-4">
              <div className="flex-1 h-10 bg-slate-100 rounded-xl" />
              <div className="size-10 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const FleetSkeleton = React.memo(FleetSkeletonComp);