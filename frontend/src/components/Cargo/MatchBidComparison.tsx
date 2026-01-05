import { useState } from 'react';
import { X, CheckCircle2, Star, Truck, DollarSign, Clock, MapPin, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';

interface MatchBidItem {
  id: string;
  type: 'match' | 'bid';
  transporterName: string;
  companyName?: string;
  rating?: number;
  totalTrips?: number;
  bidAmount?: number;
  estimatedCost?: number;
  estimatedTime?: number; // in hours
  distance?: number; // in km
  matchScore?: number; // 0-100
  successProbability?: number; // 0-100
  vehicleType?: string;
  experience?: string;
  specializations?: string[];
  notes?: string;
  createdAt: string;
}

interface MatchBidComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  items: MatchBidItem[];
  onSelect: (item: MatchBidItem) => void;
  cargoTitle?: string;
}

const MatchBidComparison: React.FC<MatchBidComparisonProps> = ({
  isOpen,
  onClose,
  items,
  onSelect,
  cargoTitle,
}) => {
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'time' | 'rating'>('score');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return (b.matchScore || 0) - (a.matchScore || 0);
      case 'price':
        return (a.bidAmount || a.estimatedCost || 0) - (b.bidAmount || b.estimatedCost || 0);
      case 'time':
        return (a.estimatedTime || 0) - (b.estimatedTime || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return 0;
    }
  });

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkAction = (action: 'accept' | 'reject') => {
    if (selectedItems.size === 0) return;
    // Handle bulk action
    console.log(`${action} selected items:`, Array.from(selectedItems));
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score?: number) => {
    if (!score) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            Compare {items[0]?.type === 'match' ? 'Matches' : 'Bids'}
            {cargoTitle && <span className="text-base text-gray-600 font-normal"> - {cargoTitle}</span>}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[44px]"
              >
                <option value="score">Match Score</option>
                <option value="price">Price (Low to High)</option>
                <option value="time">Estimated Time</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedItems.size} selected</span>
                <button
                  onClick={() => handleBulkAction('accept')}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                >
                  Accept Selected
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                >
                  Reject Selected
                </button>
              </div>
            )}
          </div>

          {/* Comparison Table - Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === sortedItems.length && sortedItems.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(new Set(sortedItems.map(item => item.id)));
                        } else {
                          setSelectedItems(new Set());
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Transporter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Score/Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Distance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedItems.has(item.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelection(item.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Truck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">{item.transporterName}</div>
                          {item.companyName && (
                            <div className="text-xs text-gray-500 truncate">{item.companyName}</div>
                          )}
                          {item.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs text-gray-600">{item.rating.toFixed(1)}</span>
                              {item.totalTrips && (
                                <span className="text-xs text-gray-400">({item.totalTrips} trips)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {item.matchScore !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-12 h-12 rounded-lg ${getScoreBg(item.matchScore)} flex items-center justify-center`}>
                            <span className={`text-sm font-bold ${getScoreColor(item.matchScore)}`}>
                              {item.matchScore}%
                            </span>
                          </div>
                          {item.successProbability && (
                            <div className="text-xs text-gray-500">
                              {item.successProbability}% success
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold">{item.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">
                        ${((item.bidAmount || item.estimatedCost || 0) / 1000).toFixed(1)}k
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.type === 'bid' ? 'Bid Amount' : 'Est. Cost'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {item.estimatedTime ? `${Math.round(item.estimatedTime / 24)} days` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {item.distance ? `${item.distance} km` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700">{item.vehicleType || 'N/A'}</div>
                      {item.specializations && item.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.specializations.slice(0, 2).map((spec, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelect(item)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors min-h-[32px]"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comparison Cards - Mobile */}
          <div className="lg:hidden space-y-4">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className={`border-2 rounded-xl p-4 ${
                  selectedItems.has(item.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="rounded border-gray-300 mt-1 flex-shrink-0"
                    />
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 text-sm truncate">{item.transporterName}</div>
                      {item.companyName && (
                        <div className="text-xs text-gray-500 truncate">{item.companyName}</div>
                      )}
                    </div>
                  </div>
                  {item.matchScore !== undefined && (
                    <div className={`w-12 h-12 rounded-lg ${getScoreBg(item.matchScore)} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-sm font-bold ${getScoreColor(item.matchScore)}`}>
                        {item.matchScore}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Price</div>
                    <div className="font-semibold text-gray-900">
                      ${((item.bidAmount || item.estimatedCost || 0) / 1000).toFixed(1)}k
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Time</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {item.estimatedTime ? `${Math.round(item.estimatedTime / 24)} days` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Distance</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {item.distance ? `${item.distance} km` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Rating</div>
                    <div className="font-semibold text-gray-900 flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {item.rating?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">{item.notes}</div>
                  </div>
                )}

                <button
                  onClick={() => onSelect(item)}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px]"
                >
                  View Details & Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatchBidComparison;

