import React, { useState, useEffect } from 'react';
import { FaGavel, FaSpinner } from 'react-icons/fa';
import { loadsAPI } from '../../services/load';
import { biddingAPI } from '../../services/biddingApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Cargo {
  id: string;
  title?: string;
  description?: string;
  origin?: string;
  destination?: string;
  status?: string;
}

const CreateAuction: React.FC = () => {
  const { user } = useAuth();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(false);
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

  useEffect(() => {
    loadCargos();
  }, [user]);

  const loadCargos = async () => {
    if (!user) return;

    setLoadingCargos(true);
    try {
      const response = await loadsAPI.getAll();
      // Handle different response structures
      let cargosList: Cargo[] = [];
      if (response.data?.items) {
        cargosList = response.data.items;
      } else if (response.data?.cargos) {
        cargosList = response.data.cargos;
      } else if (Array.isArray(response.data)) {
        cargosList = response.data;
      } else if (Array.isArray(response)) {
        cargosList = response;
      }

      // Filter cargos that can be auctioned (CREATED, PUBLISHED status)
      const availableCargos = cargosList.filter(
        (cargo: Cargo) =>
          cargo.status === 'CREATED' ||
          cargo.status === 'PUBLISHED' ||
          !cargo.status // Include cargos without status if needed
      );

      setCargos(availableCargos);
    } catch (err: any) {
      console.error('Error loading cargos:', err);
      toast.error('Failed to load cargos. Please try again.');
      setCargos([]);
    } finally {
      setLoadingCargos(false);
    }
  };

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

    if (!formData.loadId) {
      setError('Please select a cargo');
      setLoading(false);
      return;
    }

    try {
      // Submit auction creation using biddingAPI
      const auctionData = {
        loadId: formData.loadId,
        auctionType: formData.auctionType as 'REVERSE' | 'FORWARD' | 'DUTCH' | 'SEALED',
        auctionStart: formData.auctionStart,
        auctionEnd: formData.auctionEnd,
        reservePrice: formData.reservePrice ? parseFloat(formData.reservePrice) : undefined,
      };

      await biddingAPI.createAuction(auctionData);

      toast.success('Auction created successfully!');
      setSuccess('Auction created successfully!');
      setFormData({
        loadId: '',
        auctionType: 'REVERSE',
        auctionStart: '',
        auctionEnd: '',
        reservePrice: '',
      });

      // Reload cargos to refresh the list
      await loadCargos();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to create auction. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-auction">
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
        <div className="mb-4 sm:mb-6">
          <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FaGavel className="text-gray-500 flex-shrink-0" />
            <span>Create New Auction</span>
          </h4>
          <p className="text-xs sm:text-sm text-gray-600">
            Create a new auction for your cargo to attract competitive bids from truck owners.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start sm:items-center">
              <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-red-800 break-words">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start sm:items-center">
              <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-medium text-green-800 break-words">{success}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Select Cargo *
              </label>
              {loadingCargos ? (
                <div className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md flex items-center gap-2 text-gray-500 touch-manipulation min-h-[44px] sm:min-h-0">
                  <FaSpinner className="animate-spin" />
                  <span className="text-xs sm:text-sm">Loading cargos...</span>
                </div>
              ) : (
                <select
                  value={formData.loadId}
                  onChange={(e) => handleInputChange('loadId', e.target.value)}
                  required
                  className="w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  <option value="">-- Select a cargo --</option>
                  {cargos.map((cargo) => (
                    <option key={cargo.id} value={cargo.id}>
                      {cargo.title || cargo.description || `Cargo ${cargo.id.slice(0, 8)}`}
                      {cargo.origin && cargo.destination && ` (${cargo.origin} → ${cargo.destination})`}
                      {cargo.status && ` [${cargo.status}]`}
                    </option>
                  ))}
                </select>
              )}
              {cargos.length === 0 && !loadingCargos && (
                <p className="mt-1 text-xs text-gray-500">
                  No cargos available. Create a cargo first to create an auction.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Auction Type *
              </label>
              <select
                value={formData.auctionType}
                onChange={(e) => handleInputChange('auctionType', e.target.value)}
                required
                className="w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                <option value="REVERSE">Reverse Auction</option>
                <option value="FORWARD">Forward Auction</option>
                <option value="DUTCH">Dutch Auction</option>
                <option value="SEALED">Sealed Bid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Auction Start Date *
              </label>
              <input
                type="datetime-local"
                value={formData.auctionStart}
                onChange={(e) => handleInputChange('auctionStart', e.target.value)}
                required
                className="w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Auction End Date *
              </label>
              <input
                type="datetime-local"
                value={formData.auctionEnd}
                onChange={(e) => handleInputChange('auctionEnd', e.target.value)}
                required
                className="w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Reserve Price (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.reservePrice}
                onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                placeholder="Enter reserve price"
                className="w-full px-3 py-2.5 sm:py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:space-x-3">
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
                setError(null);
                setSuccess(null);
              }}
              className="px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0"
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