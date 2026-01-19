import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad, type LoadContract } from '../../services/brokerApi';
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
import BrokerTrackingSection from './components/BrokerTrackingSection';
import { CreateBrokerAuctionModal } from './components/CreateBrokerAuctionModal';
import { MatchTransportersModal } from './components/MatchTransportersModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';

const BrokerLoadDetail: React.FC = () => {
  const { loadId } = useParams<{ loadId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [load, setLoad] = useState<BrokerLoad | null>(null);
  const [contract, setContract] = useState<LoadContract | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Modal states
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

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
      const foundLoad = loads.find((l: BrokerLoad) => l.id === loadId) || null;
      setLoad(foundLoad);

      if (foundLoad) {
        try {
          // Fetch contract for this load
          const contractResponse = await brokerAPI.getBrokerContracts(user!.id, { loadId });
          const contracts = contractResponse.data || [];
          // We expect at most one active/pending contract for a specific load
          setContract(contracts[0] || null);
        } catch (contractErr) {
          console.error('Failed to load contract:', contractErr);
          // Don't fail the whole page load if contract fails
        }

        // Fetch tracking info
        fetchTrackingInfo(foundLoad.id);
      }
    } catch (err: any) {
      console.error('Failed to load details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingInfo = async (id: string) => {
    try {
      setTrackingLoading(true);
      const response = await brokerAPI.getLoadTracking(user!.id, id);
      setTrackingEvents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tracking info:', error);
    } finally {
      setTrackingLoading(false);
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
        <div className="rounded-xl shadow-lg p-6 mb-6 text-white" style={{ background: '#345E85' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8" />
                <h1 className="text-3xl font-bold">{load.title}</h1>
              </div>
              <p className="text-orange-100">Load ID: {load.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${load.status === 'ACTIVE'
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

            {/* Tracking Section */}
            {(load.status === 'IN_TRANSIT' || load.status === 'DELIVERED' || trackingEvents.length > 0) && (
              <BrokerTrackingSection
                trackingEvents={trackingEvents}
                onRefresh={() => fetchTrackingInfo(load.id)}
                loading={trackingLoading}
              />
            )}
          </div>

          {/* Right Column - Quick Info & Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowMatchModal(true)}
                  className="w-full px-4 py-3 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                  style={{ background: '#345E85' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a4d6b'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#345E85'}
                >
                  <Truck className="w-5 h-5" />
                  Find Carriers
                </button>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Contact Cargo Owner
                </button>
                <button
                  onClick={() => setShowAuctionModal(true)}
                  className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  Create Auction
                </button>
              </div>
            </div>

            {/* Contract Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Contract Status
              </h3>
              {contract ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${contract.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : contract.status === 'SIGNED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {contract.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Agreed Rate</span>
                    <span className="font-medium">
                      {contract.currencyCode} {contract.agreedRate.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/broker/contracts')}
                    className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                  >
                    View Contract Details
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">No contract found for this load</p>
                  <button
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Request Contract
                  </button>
                </div>
              )}
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
                    <p className="font-medium text-gray-900">
                      {load.cargoOwner.profile?.firstName && load.cargoOwner.profile?.lastName
                        ? `${load.cargoOwner.profile.firstName} ${load.cargoOwner.profile.lastName}`
                        : load.cargoOwner.email || 'N/A'}
                    </p>
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

      {/* Modals */}
      {load && (
        <>
          <MatchTransportersModal
            isOpen={showMatchModal}
            onClose={() => setShowMatchModal(false)}
            loadId={load.id}
          />

          <CreateBrokerAuctionModal
            isOpen={showAuctionModal}
            onClose={() => setShowAuctionModal(false)}
            loadId={load.id}
            loadTitle={load.title}
            onSuccess={() => {
              // Optionally refresh load details if auction status affects it
              loadLoadDetails();
            }}
          />

          <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Contact Cargo Owner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xl">
                    {(load.cargoOwner?.profile?.firstName || load.cargoOwner?.email || 'O').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {load.cargoOwner?.profile?.firstName || 'Unknown'} {load.cargoOwner?.profile?.lastName || 'Owner'}
                    </h3>
                    <p className="text-sm text-gray-500">{load.cargoOwner?.profile?.companyName || 'Cargo Owner'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${load.cargoOwner?.email}`} className="hover:text-primary-600 underline">
                    {load.cargoOwner?.email || 'No email available'}
                  </a>
                </div>
                {load.cargoOwner?.phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${load.cargoOwner.phone}`} className="hover:text-primary-600 underline">
                      {load.cargoOwner.phone}
                    </a>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default BrokerLoadDetail;

