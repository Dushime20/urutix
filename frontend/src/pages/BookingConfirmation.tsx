import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaShieldAlt, FaDollarSign, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { cargoOwnerAPI } from '../services/cargoOwnerAPI';
import toast from 'react-hot-toast';

interface BookingData {
  matchId: string;
  loadId: string;
  truckId: string;
  driverId: string;
  agreedPrice: number;
  terms: any;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
}

const BookingConfirmation: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    // Simulate fetching booking data
    setTimeout(() => {
      setBookingData({
        matchId: matchId || '',
        loadId: 'load-123',
        truckId: 'truck-456',
        driverId: 'driver-789',
        agreedPrice: 2500,
        terms: {
          paymentTerms: 'escrow',
          deliveryTime: '48 hours',
          insuranceRequired: true,
          specialHandling: ['fragile', 'temperature-controlled']
        },
        status: 'PENDING'
      });
      setLoading(false);
    }, 1000);
  }, [matchId]);

  const handleConfirmBooking = async () => {
    setConfirming(true);
    try {
      if (!matchId) throw new Error('No match ID found');

      await cargoOwnerAPI.confirmBooking(matchId, {
        status: 'CONFIRMED',
        agreedPrice: bookingData?.agreedPrice,
        paymentTerms: bookingData?.terms?.paymentTerms,
        confirmedAt: new Date().toISOString()
      });

      toast.success('Booking confirmed successfully');

      // Navigate to contract negotiation
      navigate(`/dashboard/contract-negotiation/booking-${matchId}`);
    } catch (error: any) {
      console.error('Error confirming booking:', error);
      toast.error(error.message || 'Failed to confirm booking');
    } finally {
      setConfirming(false);
    }
  };

  const handleRejectBooking = () => {
    navigate('/dashboard/match-results');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaTimesCircle className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">The requested booking could not be found.</p>
          <button
            onClick={() => navigate('/dashboard/match-results')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Booking Confirmation</h1>
            <p className="text-primary-100 mt-1">Review and confirm your booking details</p>
          </div>

          <div className="p-6">
            {/* Booking Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  Booking Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Match ID:</span>
                    <span className="font-medium">{bookingData.matchId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agreed Price:</span>
                    <span className="font-medium text-green-600">${bookingData.agreedPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bookingData.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      bookingData.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                      {bookingData.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaShieldAlt className="text-blue-500" />
                  Payment & Security
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">Escrow</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Insurance:</span>
                    <span className="font-medium text-green-600">Required</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Time:</span>
                    <span className="font-medium">48 hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FaClock className="text-blue-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Delivery Timeline</h4>
                    <p className="text-sm text-gray-600">Delivery must be completed within 48 hours of pickup</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaDollarSign className="text-green-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Payment Terms</h4>
                    <p className="text-sm text-gray-600">Payment will be held in escrow until delivery confirmation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaShieldAlt className="text-purple-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Insurance Coverage</h4>
                    <p className="text-sm text-gray-600">Full insurance coverage required for this shipment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-red-500 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Special Handling</h4>
                    <p className="text-sm text-gray-600">Fragile cargo with temperature-controlled requirements</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleConfirmBooking}
                disabled={confirming}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Confirming...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Confirm Booking
                  </>
                )}
              </button>

              <button
                onClick={handleRejectBooking}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <FaTimesCircle />
                Reject Booking
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Contract negotiation will begin</li>
                <li>• Escrow account will be set up</li>
                <li>• Payment processing will be initiated</li>
                <li>• Trip planning and scheduling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
