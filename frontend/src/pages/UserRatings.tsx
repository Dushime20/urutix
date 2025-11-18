import React, { useState, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar, FaUsers, FaHandshake, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

interface Rating {
  id: string;
  ratedUserId: string;
  raterUserId: string;
  ratingType: 'transporter' | 'financing_community' | 'platform';
  category: 'reliability' | 'payment_punctuality' | 'communication' | 'cargo_condition' | 'professionalism' | 'overall';
  rating: number;
  comment?: string;
  createdAt: string;
  raterUser?: {
    profile?: {
      firstName: string;
      lastName: string;
      companyName?: string;
    };
  };
}

interface RatingStats {
  transporterRatings: { average: number; count: number };
  financingRatings: { average: number; count: number };
  platformRatings: { average: number; count: number };
}

const UserRatings: React.FC = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    ratedUserId: '',
    ratingType: 'transporter' as const,
    category: 'overall' as const,
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadUserRatings();
      loadRatingStats();
    }
  }, [user?.id]);

  const loadUserRatings = async () => {
    try {
      const response = await fetch(`/api/ratings/user/${user?.id}`);
      if (!response.ok) {
        console.error('Failed to load ratings:', response.status);
        setRatings([]);
        return;
      }
      const data = await response.json();
      // Handle different response structures
      const ratingsArray = Array.isArray(data) 
        ? data 
        : Array.isArray(data?.data) 
        ? data.data 
        : Array.isArray(data?.ratings)
        ? data.ratings
        : [];
      setRatings(ratingsArray);
    } catch (error) {
      console.error('Error loading ratings:', error);
      setRatings([]);
    }
  };

  const loadRatingStats = async () => {
    try {
      const response = await fetch(`/api/ratings/user/${user?.id}/stats`);
      const data = await response.json();
      // Ensure all required properties exist with defaults
      setStats({
        transporterRatings: data.transporterRatings || { average: 0, count: 0 },
        financingRatings: data.financingRatings || { average: 0, count: 0 },
        platformRatings: data.platformRatings || { average: 0, count: 0 },
      });
    } catch (error) {
      console.error('Error loading rating stats:', error);
      // Set default stats on error
      setStats({
        transporterRatings: { average: 0, count: 0 },
        financingRatings: { average: 0, count: 0 },
        platformRatings: { average: 0, count: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(ratingForm),
      });

      if (response.ok) {
        setShowRatingForm(false);
        setRatingForm({
          ratedUserId: '',
          ratingType: 'transporter',
          category: 'overall',
          rating: 5,
          comment: '',
        });
        loadUserRatings();
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-300" />);
      }
    }

    return stars;
  };

  const getRatingTypeIcon = (type: string) => {
    switch (type) {
      case 'transporter':
        return <FaUsers className="text-blue-500" />;
      case 'financing_community':
        return <FaHandshake className="text-green-500" />;
      case 'platform':
        return <FaShieldAlt className="text-purple-500" />;
      default:
        return <FaStar className="text-gray-500" />;
    }
  };

  const getRatingTypeLabel = (type: string) => {
    switch (type) {
      case 'transporter':
        return 'Transporter';
      case 'financing_community':
        return 'Financing Community';
      case 'platform':
        return 'Platform';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">User Ratings & Reviews</h1>
        <p className="text-gray-600">View and manage ratings from transporters and financing communities</p>
      </div>

      {/* Rating Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FaUsers className="text-blue-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold">Transporter Ratings</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.transporterRatings?.average?.toFixed(1) || '0.0'}
            </div>
            <div className="flex mb-2">
              {renderStars(stats.transporterRatings?.average || 0)}
            </div>
            <p className="text-sm text-gray-600">{stats.transporterRatings?.count || 0} ratings</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FaHandshake className="text-green-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold">Financing Ratings</h3>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.financingRatings?.average?.toFixed(1) || '0.0'}
            </div>
            <div className="flex mb-2">
              {renderStars(stats.financingRatings?.average || 0)}
            </div>
            <p className="text-sm text-gray-600">{stats.financingRatings?.count || 0} ratings</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FaShieldAlt className="text-purple-500 text-2xl mr-3" />
              <h3 className="text-lg font-semibold">Platform Ratings</h3>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.platformRatings?.average?.toFixed(1) || '0.0'}
            </div>
            <div className="flex mb-2">
              {renderStars(stats.platformRatings?.average || 0)}
            </div>
            <p className="text-sm text-gray-600">{stats.platformRatings?.count || 0} ratings</p>
          </div>
        </div>
      )}

      {/* Rating Form */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Rate a User</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmitRating} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID to Rate
                </label>
                <input
                  type="text"
                  value={ratingForm.ratedUserId}
                  onChange={(e) => setRatingForm({ ...ratingForm, ratedUserId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating Type
                </label>
                <select
                  value={ratingForm.ratingType}
                  onChange={(e) => setRatingForm({ ...ratingForm, ratingType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="transporter">Transporter</option>
                  <option value="financing_community">Financing Community</option>
                  <option value="platform">Platform</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={ratingForm.category}
                  onChange={(e) => setRatingForm({ ...ratingForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="overall">Overall</option>
                  <option value="reliability">Reliability</option>
                  <option value="payment_punctuality">Payment Punctuality</option>
                  <option value="communication">Communication</option>
                  <option value="cargo_condition">Cargo Condition</option>
                  <option value="professionalism">Professionalism</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1-5)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                      className="text-2xl"
                    >
                      {star <= ratingForm.rating ? (
                        <FaStar className="text-yellow-400" />
                      ) : (
                        <FaRegStar className="text-gray-300" />
                      )}
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{ratingForm.rating}/5</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={ratingForm.comment}
                onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Share your experience..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Submit Rating
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Ratings List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Ratings</h2>
        </div>
        <div className="p-6">
          {ratings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No ratings yet</p>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getRatingTypeIcon(rating.ratingType)}
                        <span className="ml-2 text-sm font-medium text-gray-600">
                          {getRatingTypeLabel(rating.ratingType)}
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-sm text-gray-500 capitalize">
                          {rating.category.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        {renderStars(rating.rating)}
                        <span className="ml-2 text-sm text-gray-600">
                          {rating.rating}/5
                        </span>
                      </div>

                      {rating.comment && (
                        <p className="text-gray-700 mb-2">{rating.comment}</p>
                      )}

                      <div className="flex items-center text-xs text-gray-500">
                        <span>
                          Rated by: {rating.raterUser?.profile?.firstName} {rating.raterUser?.profile?.lastName}
                          {rating.raterUser?.profile?.companyName && ` (${rating.raterUser.profile.companyName})`}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{new Date(rating.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRatings; 