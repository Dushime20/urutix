import React, { useState, useEffect } from 'react';
import { FaDollarSign, FaCalendarAlt, FaTruck, FaUser, FaChartLine } from 'react-icons/fa';

interface Auction {
  id: string;
  loadId: string;
  auctionType: string;
  status: string;
  reservePrice?: number;
  minimumBidIncrement?: number;
  currentHighestBid?: number;
  load: {
    title: string;
    weight: number;
    loadValue: number;
    pickupDate: string;
    deliveryDate: string;
  };
}

interface BidFormProps {
  auction: Auction;
  onSubmit: (bidData: any) => void;
  onCancel: () => void;
}

const BidForm: React.FC<BidFormProps> = ({ auction, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    bidAmount: '',
    bidCurrency: 'USD',
    proposedPickupDate: '',
    proposedDeliveryDate: '',
    bidNotes: '',
    bidDetails: {
      truckSpecifications: {
        truckId: '',
        capacityWeight: '',
        capacityVolume: '',
        truckType: '',
        hasRefrigeration: false,
        hasHazmatPermit: false,
      },
      driverInfo: {
        driverId: '',
        experience: '',
        rating: '',
        certifications: [],
      },
      routeOptimization: {
        estimatedDistance: '',
        estimatedFuelCost: '',
        estimatedTime: '',
      },
      additionalServices: {
        insurance: false,
        tracking: false,
        loadingAssistance: false,
        unloadingAssistance: false,
      },
    },
    isAutoBid: false,
    isCounterOffer: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successProbability, setSuccessProbability] = useState<number>(0);

  useEffect(() => {
    // Set default dates based on load requirements
    if (auction.load.pickupDate) {
      setFormData(prev => ({
        ...prev,
        proposedPickupDate: auction.load.pickupDate.split('T')[0],
        proposedDeliveryDate: auction.load.deliveryDate.split('T')[0],
      }));
    }
  }, [auction]);

  useEffect(() => {
    // Calculate success probability based on bid amount
    if (formData.bidAmount && auction.currentHighestBid) {
      const bidAmount = parseFloat(formData.bidAmount);
      const currentBid = auction.currentHighestBid;
      const loadValue = auction.load.loadValue;
      
      let probability = 50; // Base probability
      
      if (bidAmount < currentBid) {
        probability += 30; // Higher chance if bidding lower
      } else if (bidAmount < loadValue * 0.8) {
        probability += 20; // Good value proposition
      }
      
      setSuccessProbability(Math.min(probability, 95));
    }
  }, [formData.bidAmount, auction.currentHighestBid, auction.load.loadValue]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate bid amount
      const bidAmount = parseFloat(formData.bidAmount);
      if (isNaN(bidAmount) || bidAmount <= 0) {
        throw new Error('Please enter a valid bid amount');
      }

      if (auction.minimumBidIncrement && auction.currentHighestBid) {
        const minBid = auction.currentHighestBid + auction.minimumBidIncrement;
        if (bidAmount < minBid) {
          throw new Error(`Minimum bid amount is ${minBid.toFixed(2)}`);
        }
      }

      await onSubmit(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit bid');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderAuctionSummary = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h6 className="text-lg font-medium text-gray-900 mb-4">Auction Summary</h6>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-2">
            <span className="font-medium">Load:</span> {auction.load.title}
          </div>
          <div className="mb-2">
            <span className="font-medium">Weight:</span> {auction.load.weight} kg
          </div>
          <div className="mb-2">
            <span className="font-medium">Value:</span> {formatCurrency(auction.load.loadValue)}
          </div>
        </div>
        <div>
          <div className="mb-2">
            <span className="font-medium">Type:</span> 
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {auction.auctionType}
            </span>
          </div>
          {auction.currentHighestBid && (
            <div className="mb-2">
              <span className="font-medium">Current Bid:</span> {formatCurrency(auction.currentHighestBid)}
            </div>
          )}
          {auction.minimumBidIncrement && (
            <div className="mb-2">
              <span className="font-medium">Min Increment:</span> {formatCurrency(auction.minimumBidIncrement)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBidDetails = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h6 className="text-lg font-medium text-gray-900 mb-4">Bid Details</h6>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaDollarSign className="inline mr-1" />
            Bid Amount *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.bidAmount}
            onChange={(e) => handleInputChange('bidAmount', e.target.value)}
            placeholder="Enter bid amount"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {auction.currentHighestBid && (
            <p className="text-sm text-gray-500 mt-1">
              Current highest: {formatCurrency(auction.currentHighestBid)}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={formData.bidCurrency}
            onChange={(e) => handleInputChange('bidCurrency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaCalendarAlt className="inline mr-1" />
            Proposed Pickup Date
          </label>
          <input
            type="date"
            value={formData.proposedPickupDate}
            onChange={(e) => handleInputChange('proposedPickupDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaCalendarAlt className="inline mr-1" />
            Proposed Delivery Date
          </label>
          <input
            type="date"
            value={formData.proposedDeliveryDate}
            onChange={(e) => handleInputChange('proposedDeliveryDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
        <textarea
          rows={3}
          value={formData.bidNotes}
          onChange={(e) => handleInputChange('bidNotes', e.target.value)}
          placeholder="Any additional information about your bid..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isAutoBid}
            onChange={(e) => handleInputChange('isAutoBid', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Auto-bid (increase automatically if outbid)</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isCounterOffer}
            onChange={(e) => handleInputChange('isCounterOffer', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Counter-offer</span>
        </label>
      </div>
    </div>
  );

  const renderTruckSpecifications = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h6 className="text-lg font-medium text-gray-900 mb-4">
        <FaTruck className="inline mr-1" />
        Truck Specifications
      </h6>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Truck ID</label>
          <input
            type="text"
            value={formData.bidDetails.truckSpecifications.truckId}
            onChange={(e) => handleInputChange('bidDetails.truckSpecifications.truckId', e.target.value)}
            placeholder="Enter truck ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity Weight (kg)</label>
          <input
            type="number"
            value={formData.bidDetails.truckSpecifications.capacityWeight}
            onChange={(e) => handleInputChange('bidDetails.truckSpecifications.capacityWeight', e.target.value)}
            placeholder="Enter capacity"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Truck Type</label>
          <select
            value={formData.bidDetails.truckSpecifications.truckType}
            onChange={(e) => handleInputChange('bidDetails.truckSpecifications.truckType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select truck type</option>
            <option value="FLATBED">Flatbed</option>
            <option value="REEFER">Reefer</option>
            <option value="DRY_VAN">Dry Van</option>
            <option value="POWER_ONLY">Power Only</option>
            <option value="STEP_DECK">Step Deck</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity Volume (m³)</label>
          <input
            type="number"
            value={formData.bidDetails.truckSpecifications.capacityVolume}
            onChange={(e) => handleInputChange('bidDetails.truckSpecifications.capacityVolume', e.target.value)}
            placeholder="Enter volume capacity"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.bidDetails.truckSpecifications.hasRefrigeration}
            onChange={(e) => handleInputChange('bidDetails.truckSpecifications.hasRefrigeration', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Has Refrigeration</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.bidDetails.truckSpecifications.hasHazmatPermit}
            onChange={(e) => handleInputChange('bidDetails.truckSpecifications.hasHazmatPermit', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Has Hazmat Permit</span>
        </label>
      </div>
    </div>
  );

  const renderSuccessProbability = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h6 className="text-lg font-medium text-gray-900 mb-4">
        <FaChartLine className="inline mr-1" />
        Bid Analysis
      </h6>
      <div className="text-center">
        <h4 className={`text-2xl font-bold mb-2 ${
          successProbability > 70 ? 'text-green-600' : 
          successProbability > 40 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {successProbability}% Success Probability
        </h4>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full ${
              successProbability > 70 ? 'bg-green-500' : 
              successProbability > 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${successProbability}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500">
          Based on bid amount, market conditions, and historical data
        </p>
      </div>
    </div>
  );

  return (
    <div className="bid-form">
      {renderAuctionSummary()}
      
      <form onSubmit={handleSubmit}>
        {renderBidDetails()}
        {renderTruckSpecifications()}
        {renderSuccessProbability()}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.bidAmount}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Bid'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BidForm; 