import React, { useState } from 'react';
import { FaGavel, FaClock, FaDollarSign, FaUsers, FaChartLine, FaCheck, FaTimes, FaEye, FaEdit } from 'react-icons/fa';
import { cargoOwnerAPI } from '../../services/cargoApi';
import type { Bid, AuctionSettings as APIAuctionSettings } from '../../services/cargoApi';

interface CargoDetails {
  id?: string;
  title: string;
  description?: string;
  cargoType: string;
  weight: number;
  volume?: number;
  pickupLocationId?: string;
  deliveryLocationId?: string;
  pickupDate: string;
  deliveryDate: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  specialRequirements?: string;
  autoMatchEnabled: boolean;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  // For demo purposes, we'll add mock location data
  pickupLocation?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryLocation?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface AuctionSettings {
  auctionType: 'REVERSE' | 'FORWARD' | 'DUTCH' | 'SEALED';
  duration: number; // hours
  reservePrice: number;
  minimumBidIncrement: number;
  maximumBidAmount?: number;
  allowCounterOffers: boolean;
  allowBidModifications: boolean;
  autoExtendOnBid: boolean;
  extensionMinutes: number;
  requirePreApproval: boolean;
  allowAnonymousBids: boolean;
  notificationSettings: {
    notifyOnBid: boolean;
    notifyOnCounterOffer: boolean;
    notifyOnAuctionEnd: boolean;
    notifyOnAward: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

interface BidPreview {
  id: string;
  truckOwner: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
  };
  bidAmount: number;
  proposedPickupDate: string;
  proposedDeliveryDate: string;
  bidNotes: string;
  truckSpecifications: {
    truckType: string;
    capacity: number;
    equipment: string[];
  };
  driverInfo: {
    name: string;
    experience: number;
    rating: number;
    certifications: string[];
  };
  estimatedTime: number;
  distance: number;
  createdAt: string;
}

interface PublishForBidFlowProps {
  cargoDetails: CargoDetails;
  onComplete: (auctionData: any) => void;
}

const PublishForBidFlow: React.FC<PublishForBidFlowProps> = ({ cargoDetails, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<'settings' | 'preview' | 'active'>('settings');
  const [auctionSettings, setAuctionSettings] = useState<AuctionSettings>({
    auctionType: 'REVERSE',
    duration: 24,
    reservePrice: Math.round(cargoDetails.loadValue * 0.25),
    minimumBidIncrement: 50,
    allowCounterOffers: true,
    allowBidModifications: false,
    autoExtendOnBid: true,
    extensionMinutes: 15,
    requirePreApproval: false,
    allowAnonymousBids: false,
    notificationSettings: {
      notifyOnBid: true,
      notifyOnCounterOffer: true,
      notifyOnAuctionEnd: true,
      notifyOnAward: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auctionId, setAuctionId] = useState<string | null>(null);
  const [bids, setBids] = useState<BidPreview[]>([]);

  const handleSettingsSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, save the cargo to database if it doesn't have an ID
      let loadId = cargoDetails.id;
      
      if (!loadId) {
        // Create the load first
        const loadData = {
          title: cargoDetails.title,
          description: cargoDetails.description || '',
          cargoType: cargoDetails.cargoType,
          weight: cargoDetails.weight,
          volume: cargoDetails.volume,
          pickupLocationId: cargoDetails.pickupLocationId,
          deliveryLocationId: cargoDetails.deliveryLocationId,
          pickupDate: cargoDetails.pickupDate,
          deliveryDate: cargoDetails.deliveryDate,
          loadValue: cargoDetails.loadValue,
          offeredPrice: cargoDetails.offeredPrice,
          currencyCode: cargoDetails.currencyCode,
          isFragile: cargoDetails.isFragile,
          isHazardous: cargoDetails.isHazardous,
          requiresRefrigeration: cargoDetails.requiresRefrigeration,
          specialRequirements: cargoDetails.specialRequirements,
          autoMatchEnabled: cargoDetails.autoMatchEnabled,
          urgencyLevel: cargoDetails.urgencyLevel,
        };

        const loadResponse = await cargoOwnerAPI.createLoad(loadData);
        if (loadResponse.data && loadResponse.data.id) {
          loadId = loadResponse.data.id;
        } else {
          throw new Error('Failed to create load');
        }
      }

      // Now create auction with the load ID
      if (!loadId) {
        throw new Error('Load ID is required to create auction');
      }
      
      const response = await cargoOwnerAPI.createAuction(loadId, {
        auctionType: auctionSettings.auctionType,
        auctionStart: new Date().toISOString(),
        auctionEnd: new Date(Date.now() + auctionSettings.duration * 60 * 60 * 1000).toISOString(),
        reservePrice: auctionSettings.reservePrice,
        minimumBidIncrement: auctionSettings.minimumBidIncrement,
        maximumBidAmount: auctionSettings.maximumBidAmount,
        auctionRules: {
          allowCounterOffers: auctionSettings.allowCounterOffers,
          allowBidModifications: auctionSettings.allowBidModifications,
          autoExtendOnBid: auctionSettings.autoExtendOnBid,
          extensionMinutes: auctionSettings.extensionMinutes,
          requirePreApproval: auctionSettings.requirePreApproval,
          allowAnonymousBids: auctionSettings.allowAnonymousBids,
        },
        notificationSettings: auctionSettings.notificationSettings,
      });

      if (response.data) {
        setAuctionId(response.data.id);
        setCurrentStep('preview');
      } else {
        setError('Failed to create auction');
      }
    } catch (error) {
      console.error('Auction creation error:', error);
      setError('Failed to create auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Removed demo data - using real API data

  const handleActivateAuction = () => {
    setCurrentStep('active');
    // In a real implementation, this would activate the auction
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      // Accept the bid using real API
      const response = await cargoOwnerAPI.acceptBid(bidId);
      
      if (response.data) {
        const selectedBid = bids.find(bid => bid.id === bidId);
        if (selectedBid) {
          onComplete({
            auctionId,
            selectedBid,
            auctionSettings
          });
        }
      } else {
        setError('Failed to accept bid');
      }
    } catch (error) {
      console.error('Bid acceptance error:', error);
      setError('Failed to accept bid. Please try again.');
    }
  };

  const renderSettingsStep = () => (
    <div className="auction-settings">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          <FaGavel className="inline mr-2 text-blue-500" />
          Auction Settings
        </h3>
        <p className="text-gray-600 dark:text-slate-300">
          Configure your auction parameters to attract the best bids
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Auction Type
          </label>
          <select
            value={auctionSettings.auctionType}
            onChange={(e) => setAuctionSettings({
              ...auctionSettings,
              auctionType: e.target.value as any
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="REVERSE">Reverse Auction (Lowest Bid Wins)</option>
            <option value="FORWARD">Forward Auction (Highest Bid Wins)</option>
            <option value="DUTCH">Dutch Auction (Price Descends)</option>
            <option value="SEALED">Sealed Bid Auction</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Auction Duration (hours)
          </label>
          <input
            type="number"
            value={auctionSettings.duration}
            onChange={(e) => setAuctionSettings({
              ...auctionSettings,
              duration: parseInt(e.target.value)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max="168"
          />
        </div>

        {/* Reserve Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Reserve Price ($)
          </label>
          <input
            type="number"
            value={auctionSettings.reservePrice}
            onChange={(e) => setAuctionSettings({
              ...auctionSettings,
              reservePrice: parseInt(e.target.value)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>

        {/* Minimum Bid Increment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Minimum Bid Increment ($)
          </label>
          <input
            type="number"
            value={auctionSettings.minimumBidIncrement}
            onChange={(e) => setAuctionSettings({
              ...auctionSettings,
              minimumBidIncrement: parseInt(e.target.value)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Advanced Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={auctionSettings.allowCounterOffers}
              onChange={(e) => setAuctionSettings({
                ...auctionSettings,
                allowCounterOffers: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-slate-300">Allow Counter Offers</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={auctionSettings.allowBidModifications}
              onChange={(e) => setAuctionSettings({
                ...auctionSettings,
                allowBidModifications: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-slate-300">Allow Bid Modifications</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={auctionSettings.autoExtendOnBid}
              onChange={(e) => setAuctionSettings({
                ...auctionSettings,
                autoExtendOnBid: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-slate-300">Auto-extend on Last-Minute Bids</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={auctionSettings.requirePreApproval}
              onChange={(e) => setAuctionSettings({
                ...auctionSettings,
                requirePreApproval: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-slate-300">Require Pre-approval</label>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSettingsSubmit}
          disabled={loading}
          className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
            loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Creating Auction...' : 'Create Auction'}
        </button>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="auction-preview">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          <FaEye className="inline mr-2 text-blue-500" />
          Auction Preview
        </h3>
        <p className="text-gray-600 dark:text-slate-300">
          Review your auction settings before publishing
        </p>
      </div>

      {/* Auction Summary */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="text-lg font-medium text-blue-900 mb-3">Auction Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Type:</span> {auctionSettings.auctionType}
          </div>
          <div>
            <span className="font-medium">Duration:</span> {auctionSettings.duration} hours
          </div>
          <div>
            <span className="font-medium">Reserve Price:</span> ${auctionSettings.reservePrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Cargo Details */}
      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Cargo Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Title:</span> {cargoDetails.title}
          </div>
          <div>
                            <span className="font-medium">Weight:</span> {cargoDetails.weight} kg
          </div>
          <div>
                            <span className="font-medium">Route:</span> {cargoDetails.pickupLocation?.city || 'Pickup Location'} → {cargoDetails.deliveryLocation?.city || 'Delivery Location'}
          </div>
          <div>
            <span className="font-medium">Pickup Date:</span> {new Date(cargoDetails.pickupDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setCurrentStep('settings')}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          <FaEdit className="inline mr-2" />
          Edit Settings
        </button>
        <button
          onClick={handleActivateAuction}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <FaGavel className="inline mr-2" />
          Publish Auction
        </button>
      </div>
    </div>
  );

  const renderActiveStep = () => (
    <div className="active-auction">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          <FaGavel className="inline mr-2 text-green-500" />
          Active Auction
        </h3>
        <p className="text-gray-600 dark:text-slate-300">
          Your auction is live and receiving bids
        </p>
      </div>

      {/* Auction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{bids.length}</div>
          <div className="text-sm text-gray-600 dark:text-slate-300">Total Bids</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {bids.length > 0 
              ? `$${Math.min(...bids.map(bid => bid.bidAmount)).toLocaleString()}`
              : 'No bids yet'
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-300">Lowest Bid</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {new Set(bids.map(bid => bid.truckOwner.id)).size}
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-300">Unique Bidders</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {auctionId ? (
              (() => {
                const auctionEndTime = new Date(Date.now() + auctionSettings.duration * 60 * 60 * 1000);
                const timeRemaining = Math.max(0, Math.round((auctionEndTime.getTime() - Date.now()) / (1000 * 60 * 60)));
                return `${timeRemaining}h`;
              })()
            ) : (
              `${auctionSettings.duration}h`
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-300">Time Remaining</div>
        </div>
      </div>

      {/* Bids List */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">Received Bids</h4>
        {bids.map((bid) => (
          <div key={bid.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">{bid.truckOwner.name}</h5>
                <p className="text-sm text-gray-600 dark:text-slate-300">{bid.truckSpecifications.truckType}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  ${bid.bidAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(bid.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <span className="font-medium">Driver:</span> {bid.driverInfo.name} ({bid.driverInfo.rating}★)
              </div>
              <div>
                <span className="font-medium">Experience:</span> {bid.driverInfo.experience} years
              </div>
              <div>
                <span className="font-medium">Distance:</span> {bid.distance} miles
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">{bid.bidNotes}</p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleAcceptBid(bid.id)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
              >
                <FaCheck className="inline mr-1" />
                Accept Bid
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-600 dark:text-slate-300">Creating auction...</p>
      </div>
    );
  }

  return (
    <div className="publish-for-bid-flow">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'settings' && renderSettingsStep()}
      {currentStep === 'preview' && renderPreviewStep()}
      {currentStep === 'active' && renderActiveStep()}
    </div>
  );
};

export default PublishForBidFlow; 