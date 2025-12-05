import React, { useState, useEffect } from 'react';
import { 
  Package, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { loanRequestService } from '../../services/loanRequestService';
import toast from 'react-hot-toast';

interface Load {
  id: string;
  title: string;
  description?: string;
  status: string;
  loadValue?: number;
  offeredPrice?: number;
  currencyCode?: string;
  currency?: string;
  pickupDate?: string;
  deliveryDate?: string;
  cargoOwner?: {
    id: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  assignedTruckId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Lender {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  availableCredit?: number;
  interestRate?: number;
}

type PaymentMode = 'direct' | 'loan';

const CargoOwnerPayment: React.FC = () => {
  const { user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [selectedLender, setSelectedLender] = useState<string | null>(null);
  const [directPaymentMethod, setDirectPaymentMethod] = useState<'momo' | 'card' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch loads with status LOADED
  useEffect(() => {
    fetchLoadsReadyForPayment();
  }, [user]);

  // Fetch available lenders when loan mode is selected
  useEffect(() => {
    if (paymentMode === 'loan' && user?.tenantId) {
      fetchLenders();
    }
  }, [paymentMode, user?.tenantId]);

  const fetchLoadsReadyForPayment = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await api.get('/loads-v2/my-loads', {
        params: {
          status: 'LOADED',
          limit: 100,
          page: 1,
        },
      });
      
      // Handle paginated response
      const responseData = response.data;
      let loadsData: Load[] = [];
      
      if (responseData?.data && Array.isArray(responseData.data)) {
        // Paginated response
        loadsData = responseData.data;
      } else if (Array.isArray(responseData)) {
        // Direct array response
        loadsData = responseData;
      } else if (responseData?.items && Array.isArray(responseData.items)) {
        // Alternative paginated format
        loadsData = responseData.items;
      }
      
      setLoads(loadsData);
    } catch (error: any) {
      console.error('Error fetching loads:', error);
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.message || 'Failed to load cargo ready for payment');
      }
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLenders = async () => {
    if (!user?.tenantId) return;

    try {
      // Fetch Lender entities for the tenant
      // Try the tenant/lenders endpoint first (for tenant admins), then fallback to users with LENDER role
      let lendersList: Lender[] = [];
      
      try {
        const response = await api.get('/lending/tenant/lenders');
        const lendersData = response.data?.data || response.data || [];
        lendersList = Array.isArray(lendersData) 
          ? lendersData.map((l: any) => ({
              id: l.id,
              firstName: l.first_name || l.firstName,
              lastName: l.last_name || l.lastName,
              name: l.name || l.contact_email || 'Unknown Lender',
              email: l.contact_email || l.email,
              phone: l.contact_phone || l.phone,
              companyName: l.name,
              availableCredit: l.available_credit || 0,
              interestRate: l.interest_rate || 0,
            }))
          : [];
      } catch (lenderError: any) {
        // Fallback: Fetch users with LENDER role and try to find corresponding Lender entities
        console.warn('Could not fetch from /lending/tenant/lenders, trying users endpoint:', lenderError);
        const response = await api.get(`/users/tenant/${user.tenantId}/role/LENDER`);
        const usersData = response.data?.data || response.data || [];
        lendersList = Array.isArray(usersData) 
          ? usersData.map((u: any) => ({
              id: u.id, // This will be the user ID, we'll need to map it to lender ID
              firstName: u.profile?.firstName,
              lastName: u.profile?.lastName,
              name: u.profile?.firstName && u.profile?.lastName
                ? `${u.profile.firstName} ${u.profile.lastName}`
                : u.profile?.companyName || u.email || 'Unknown',
              email: u.email,
              phone: u.phone || u.profile?.phone,
              companyName: u.profile?.companyName,
              availableCredit: u.availableCredit || 0,
              interestRate: u.interestRate || 0,
            }))
          : [];
      }
      
      setLenders(lendersList);
    } catch (error: any) {
      console.error('Error fetching lenders:', error);
      toast.error('Failed to load available lenders');
    }
  };

  const handleInitiatePayment = (load: Load) => {
    setSelectedLoad(load);
    setShowPaymentModal(true);
    setPaymentMode(null);
    setSelectedLender(null);
    setDirectPaymentMethod(null);
  };

  const handleDirectPayment = async () => {
    if (!selectedLoad || !directPaymentMethod) return;

    try {
      // TODO: Integrate with actual payment gateway (Momo/Card)
      toast.success(`Redirecting to ${directPaymentMethod === 'momo' ? 'Mobile Money' : 'Card'} payment...`);
      
      // Simulate payment processing
      // In production, this would redirect to payment gateway
      console.log('Processing direct payment:', {
        loadId: selectedLoad.id,
        amount: selectedLoad.offeredPrice,
        method: directPaymentMethod,
      });

      // After successful payment, update load status
      // await api.patch(`/loads-v2/${selectedLoad.id}`, { status: 'PAID' });
      
      setShowPaymentModal(false);
      setSelectedLoad(null);
      fetchLoadsReadyForPayment();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed');
    }
  };

  const handleLoanRequest = async () => {
    if (!selectedLoad || !selectedLender) {
      toast.error('Please select a lender');
      return;
    }

    try {
      // Create loan request with selected lender
      // trip_id is optional - backend will find it from the load if not provided
      await loanRequestService.createLoanRequestForCargo(selectedLoad.id, {
        lender_id: selectedLender, // Pass the selected lender ID
        // trip_id is optional - backend will find it from the load
      });

      toast.success('Loan request submitted successfully! The lender will review your request in their portal.');
      setShowPaymentModal(false);
      setSelectedLoad(null);
      fetchLoadsReadyForPayment();
    } catch (error: any) {
      console.error('Loan request error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit loan request');
    }
  };

  const filteredLoads = loads.filter(load => {
    const matchesSearch = searchTerm === '' || 
      load.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || load.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Management</h2>
          <p className="text-gray-600 mt-1">Manage payments for accepted cargo loads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by cargo title or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="LOADED">Ready for Payment</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loads List */}
      {filteredLoads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No cargo ready for payment</h3>
          <p className="text-gray-600">Cargo loads will appear here after drivers accept and load them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLoads.map((load) => (
            <div key={load.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{load.title || 'Untitled Cargo'}</h3>
                  <p className="text-sm text-gray-500">ID: {load.id.substring(0, 8)}...</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Ready
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="font-semibold">
                    {load.offeredPrice ? `${load.currencyCode || load.currency || 'USD'} ${load.offeredPrice.toLocaleString()}` : 'Amount not set'}
                  </span>
                </div>
                {load.pickupDate && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Pickup: {new Date(load.pickupDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleInitiatePayment(load)}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>Make Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLoad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Payment for Cargo</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-1">{selectedLoad.title}</p>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                Transportation Amount: {selectedLoad.currencyCode || selectedLoad.currency || 'USD'} {selectedLoad.offeredPrice?.toLocaleString() || '0'}
              </p>
            </div>

            <div className="p-6">
              {!paymentMode ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Select Payment Method</h4>
                  
                  <button
                    onClick={() => setPaymentMode('direct')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">Direct Payment</h5>
                          <p className="text-sm text-gray-600">Pay directly with Mobile Money or Card</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMode('loan')}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">Loan Request</h5>
                          <p className="text-sm text-gray-600">Request a loan from available lenders</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                </div>
              ) : paymentMode === 'direct' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setPaymentMode(null)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
                  >
                    ← Back
                  </button>
                  
                  <h4 className="font-semibold text-gray-900 mb-4">Select Payment Method</h4>
                  
                  <button
                    onClick={() => setDirectPaymentMethod('momo')}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                      directPaymentMethod === 'momo'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                      <div>
                        <h5 className="font-semibold text-gray-900">Mobile Money (Momo)</h5>
                        <p className="text-sm text-gray-600">Pay with your mobile money account</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setDirectPaymentMethod('card')}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                      directPaymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <div>
                        <h5 className="font-semibold text-gray-900">Credit/Debit Card</h5>
                        <p className="text-sm text-gray-600">Pay with your card</p>
                      </div>
                    </div>
                  </button>

                  {directPaymentMethod && (
                    <button
                      onClick={handleDirectPayment}
                      className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      Proceed to Payment
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setPaymentMode(null)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
                  >
                    ← Back
                  </button>
                  
                  <h4 className="font-semibold text-gray-900 mb-4">Select a Lender</h4>
                  
                  {lenders.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No lenders available in your tenant</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {lenders.map((lender) => (
                        <button
                          key={lender.id}
                          onClick={() => setSelectedLender(lender.id)}
                          className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                            selectedLender === lender.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-semibold text-gray-900">
                                {lender.firstName && lender.lastName
                                  ? `${lender.firstName} ${lender.lastName}`
                                  : lender.companyName || lender.name}
                              </h5>
                              {lender.email && (
                                <p className="text-sm text-gray-600 mt-1">{lender.email}</p>
                              )}
                              {lender.interestRate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Interest Rate: {lender.interestRate}%
                                </p>
                              )}
                            </div>
                            {selectedLender === lender.id && (
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedLender && (
                    <button
                      onClick={handleLoanRequest}
                      className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      Submit Loan Request
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoOwnerPayment;

