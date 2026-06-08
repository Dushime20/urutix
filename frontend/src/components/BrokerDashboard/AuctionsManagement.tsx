import React from 'react';
import { AlertTriangle, Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui';

interface Auction {
  id: string;
  cargoTitle: string;
  bidsCount: number;
  lowestBid: string;
  timeLeft: string;
  status: 'active' | 'closing' | 'completed';
}

interface AuctionsManagementProps {
  auctions: Auction[];
}

export const AuctionsManagement: React.FC<AuctionsManagementProps> = ({ auctions }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Active Auctions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage transport bidding for your assigned cargo</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">Create Auction</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {auctions.length === 0 ? (
          <div className="col-span-full py-8 text-center text-gray-500 dark:text-gray-400">
            No active auctions at the moment.
          </div>
        ) : (
          auctions.map((auction) => (
            <div key={auction.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-800">
                  {auction.status === 'closing' ? 'Closing Soon' : 'Active'}
                </span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{auction.id}</span>
              </div>
              
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 line-clamp-1">{auction.cargoTitle}</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>Total Bids</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{auction.bidsCount}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <AlertTriangle className="w-4 h-4 text-emerald-500" />
                    <span>Lowest Bid</span>
                  </div>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{auction.lowestBid}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Time Left</span>
                  </div>
                  <span className="font-medium text-amber-600 dark:text-amber-400">{auction.timeLeft}</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                Review Bids <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
