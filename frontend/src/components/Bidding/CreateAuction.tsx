import React, { useState } from 'react';
import { FaGavel } from 'react-icons/fa';

const CreateAuction: React.FC = () => {
  const [formData, setFormData] = useState({
    loadId: '',
    auctionType: 'REVERSE',
    auctionStart: '',
    auctionEnd: '',
    reservePrice: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Submit auction creation
      const response = await fetch('/api/bidding/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Auction created successfully!');
        setFormData({
          loadId: '',
          auctionType: 'REVERSE',
          auctionStart: '',
          auctionEnd: '',
          reservePrice: '',
        });
      } else {
        throw new Error('Failed to create auction');
      }
    } catch (error) {
      setError('Failed to create auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-auction">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            <FaGavel className="inline mr-2 text-blue-500" />
            Create New Auction
          </h4>
          <p className="text-gray-600">
            Create a new auction for your cargo to attract competitive bids from truck owners.
          </p>
        </div>

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

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Load ID *
              </label>
              <input
                type="text"
                value={formData.loadId}
                onChange={(e) => handleInputChange('loadId', e.target.value)}
                placeholder="Enter load ID"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auction Type *
              </label>
              <select
                value={formData.auctionType}
                onChange={(e) => handleInputChange('auctionType', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="REVERSE">Reverse Auction</option>
                <option value="FORWARD">Forward Auction</option>
                <option value="DUTCH">Dutch Auction</option>
                <option value="SEALED">Sealed Bid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auction Start Date *
              </label>
              <input
                type="datetime-local"
                value={formData.auctionStart}
                onChange={(e) => handleInputChange('auctionStart', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auction End Date *
              </label>
              <input
                type="datetime-local"
                value={formData.auctionEnd}
                onChange={(e) => handleInputChange('auctionEnd', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reserve Price (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.reservePrice}
                onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                placeholder="Enter reserve price"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  loadId: '',
                  auctionType: 'REVERSE',
                  auctionStart: '',
                  auctionEnd: '',
                  reservePrice: '',
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuction; 