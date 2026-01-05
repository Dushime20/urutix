import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad } from '../../services/brokerApi';
import { 
  Package, 
  MapPin, 
  DollarSign, 
  Calendar,
  Truck,
  User,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Clock,
  Weight,
  Box
} from 'lucide-react';

const BrokerLoadDetail: React.FC = () => {
  const { loadId } = useParams<{ loadId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [load, setLoad] = useState<BrokerLoad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadId) {
      loadLoadDetails();
    }
  }, [loadId]);

  const loadLoadDetails = async () => {
    try {
      setLoading(true);
      const response = await brokerAPI.getBrokerLoads(user!.id, { loadId });
      const loads = response.data || [];
      setLoad(loads.find((l: BrokerLoad) => l.id === loadId) || null);
    } catch (err: any) {
      console.error('Failed to load details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!load) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Load Not Found</h2>
          <p className="text-gray-600 mb-4">This load doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/dashboard/broker/loads')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to My Loads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard/broker/loads')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Loads
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-rose-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8" />
                <h1 className="text-3xl font-bold">{load.title}</h1>
              </div>
              <p className="text-orange-100">Load ID: {load.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              load.status === 'ACTIVE' 
                ? 'bg-green-500 text-white'
                : load.status === 'COMPLETED'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {load.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Commission Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Your Commission
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <p className="text-sm text-gray-600 mb-1">Commission Rate</p>
                  <p className="text-3xl font-bold text-emerald-700">
                    {load.brokerCommissionRate || 0}%
                  </p>
                </div>
                {load.brokerCommissionAmount && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Potential Earnings</p>
                    <p className="text-3xl font-bold text-blue-700">
                      ${load.brokerCommissionAmount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Load Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Load Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Description</label>
                  <p className="text-gray-900">{load.description || 'No description provided'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Load Type</label>
                  <p className="text-gray-900">{load.loadType || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2 flex items-center gap-2">
                    <Weight className="w-4 h-4" />
                    Weight
                  </label>
                  <p className="text-gray-900">{load.weight || 'N/A'} kg</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2 flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    Equipment Type
                  </label>
                  <p className="text-gray-900">{load.equipmentType || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Load Value
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {load.currencyCode} {load.loadValue.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created Date
                  </label>
                  <p className="text-gray-900">
                    {new Date(load.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Locations */}
            {(load.pickupLocation || load.deliveryLocation) && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  Locations
                </h2>
                <div className="space-y-4">
                  {load.pickupLocation && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">Pickup Location</p>
                        <p className="text-gray-700">{load.pickupLocation}</p>
                      </div>
                    </div>
                  )}
                  {load.deliveryLocation && (
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-900">Delivery Location</p>
                        <p className="text-gray-700">{load.deliveryLocation}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Info & Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-lg hover:from-orange-600 hover:to-rose-700 transition-colors font-semibold flex items-center justify-center gap-2">
                  <Truck className="w-5 h-5" />
                  Find Carriers
                </button>
                <button className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Cargo Owner
                </button>
                <button className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" />
                  Generate Quote
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assigned to You</p>
                    <p className="text-xs text-gray-500">
                      {new Date(load.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {load.status === 'ACTIVE' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">In Progress</p>
                      <p className="text-xs text-gray-500">Working on carrier assignment</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cargo Owner Info */}
            {load.cargoOwner && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Cargo Owner
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{load.cargoOwner.name || 'N/A'}</p>
                  </div>
                  {load.cargoOwner.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${load.cargoOwner.email}`} className="text-primary-600 hover:underline">
                        {load.cargoOwner.email}
                      </a>
                    </div>
                  )}
                  {load.cargoOwner.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${load.cargoOwner.phone}`} className="text-primary-600 hover:underline">
                        {load.cargoOwner.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerLoadDetail;

