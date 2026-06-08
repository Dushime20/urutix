import React from 'react';
import { Zap, Truck, Star, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '../../components/ui';

interface Match {
  id: string;
  carrierName: string;
  rating: number;
  matchScore: number;
  vehicleType: string;
  estimatedCost: string;
  status: 'available' | 'busy';
}

interface SmartMatchingCenterProps {
  matches: Match[];
}

export const SmartMatchingCenter: React.FC<SmartMatchingCenterProps> = ({ matches }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Smart Matching Center
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">AI-suggested carriers for your pending cargo</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-100 dark:border-purple-800">
          <Zap className="w-4 h-4" />
          <span>Auto-Match Enabled</span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
        {matches.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No smart matches available at the moment.
          </div>
        ) : (
          matches.map((match) => (
            <div key={match.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">{match.carrierName}</h3>
                    {match.rating >= 4.5 && (
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-300">{match.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      <span>{match.vehicleType}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${match.status === 'available' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                      <span className="capitalize">{match.status}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{match.matchScore}%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Match Score</div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{match.estimatedCost}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Est. Cost</div>
                </div>
                
                <Button className="w-full md:w-auto ml-auto" disabled={match.status !== 'available'}>
                  Assign Load
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
