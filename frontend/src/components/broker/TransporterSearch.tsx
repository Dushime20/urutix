import React, { useState, useEffect } from 'react';
import { brokerAPI } from '../../services/brokerApi';
import { 
  Search, 
  Star, 
  Truck, 
  MapPin, 
  Phone,
  Mail,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';

interface Transporter {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  location?: string;
  averageRating?: number;
  totalRatings?: number;
  totalTrips?: number;
  verified?: boolean;
  specialties?: string[];
}

interface TransporterSearchProps {
  onSelect?: (transporter: Transporter) => void;
  selectedId?: string;
}

const TransporterSearch: React.FC<TransporterSearchProps> = ({ onSelect, selectedId }) => {
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minRating: '',
    verified: false,
  });

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchTransporters();
    } else {
      setTransporters([]);
    }
  }, [searchTerm, filters]);

  const searchTransporters = async () => {
    try {
      setLoading(true);
      const params: any = {
        search: searchTerm,
        role: 'TRUCK_OWNER',
      };

      if (filters.minRating) {
        params.minRating = parseFloat(filters.minRating);
      }

      if (filters.verified) {
        params.verified = true;
      }

      const response = await brokerAPI.searchTransporters(params);
      // Transform response to include ratings
      const transportersWithRatings = await Promise.all(
        (response.data.items || response.data || []).map(async (truck: any) => {
          try {
            const profileResponse = await brokerAPI.getTransporterProfile(truck.ownerId || truck.userId);
            const ratingsResponse = await fetch(`/api/ratings/user/${truck.ownerId || truck.userId}/transporter`);
            const ratings = ratingsResponse.ok ? await ratingsResponse.json() : null;
            
            return {
              id: truck.ownerId || truck.userId,
              name: profileResponse.data?.profile?.firstName + ' ' + profileResponse.data?.profile?.lastName || truck.ownerName,
              companyName: profileResponse.data?.profile?.companyName || truck.companyName,
              email: profileResponse.data?.email,
              phone: profileResponse.data?.profile?.phone || truck.phone,
              location: truck.location || 'N/A',
              averageRating: ratings?.averageRating || 0,
              totalRatings: ratings?.totalRatings || 0,
              totalTrips: truck.totalTrips || 0,
              verified: profileResponse.data?.verified || false,
              specialties: truck.specialties || [],
            };
          } catch (err) {
            return {
              id: truck.ownerId || truck.userId,
              name: truck.ownerName || 'Unknown',
              companyName: truck.companyName,
              averageRating: 0,
              totalRatings: 0,
              totalTrips: 0,
              verified: false,
            };
          }
        })
      );
      
      setTransporters(transportersWithRatings);
    } catch (err: any) {
      console.error('Failed to search transporters:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-200 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search transporters by name, company, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="verified"
            checked={filters.verified}
            onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <label htmlFor="verified" className="text-sm text-gray-700">
            Verified only
          </label>
        </div>
        <div>
          <input
            type="number"
            placeholder="Min rating"
            min="0"
            max="5"
            step="0.1"
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : transporters.length === 0 && searchTerm.length >= 2 ? (
        <div className="text-center py-8 text-gray-500">
          No transporters found
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transporters.map((transporter) => (
            <div
              key={transporter.id}
              onClick={() => onSelect?.(transporter)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedId === transporter.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Truck className="w-5 h-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">
                      {transporter.name}
                      {transporter.verified && (
                        <CheckCircle2 className="w-4 h-4 text-green-600 inline ml-2" />
                      )}
                    </h3>
                  </div>
                  
                  {transporter.companyName && (
                    <p className="text-sm text-gray-600 mb-2">{transporter.companyName}</p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    {transporter.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{transporter.location}</span>
                      </div>
                    )}
                    {transporter.totalTrips > 0 && (
                      <span>{transporter.totalTrips} trips</span>
                    )}
                  </div>

                  {transporter.averageRating > 0 && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {renderStars(transporter.averageRating)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {transporter.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({transporter.totalRatings} {transporter.totalRatings === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}

                  {transporter.specialties && transporter.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {transporter.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {selectedId === transporter.id && (
                  <div className="ml-4">
                    <CheckCircle2 className="w-6 h-6 text-primary-600" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransporterSearch;

