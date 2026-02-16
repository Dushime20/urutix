import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  DollarSign,
  CreditCard,
  Smartphone,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  User,
  Info,
  Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { paymentsAPI } from '../../services/api';
import { loanRequestService } from '../../services/loanRequestService';
import toast from 'react-hot-toast';
import FinancialInformation from './FinancialInformation';
import type { AdvancePaymentCalculation } from '../../utils/paymentCalculations';
import {
  formatCurrency,
  formatPercentage
} from '../../utils/paymentCalculations';

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
  metadata?: {
    integrationType?: string;
    isLoanOfficer?: boolean;
    isExternalSystemLender?: boolean;
    parentLenderId?: string;
    loanOfficerId?: string;
    parentLenderName?: string;
    specialization?: string;
  };
}

interface LoanOfficer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  specialization?: string;
  maxLoanAmount?: number;
  minLoanAmount?: number;
  available?: boolean;
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
  const [selectedLenderData, setSelectedLenderData] = useState<Lender | null>(null);
  const [loanOfficers, setLoanOfficers] = useState<LoanOfficer[]>([]);
  const [selectedLoanOfficer, setSelectedLoanOfficer] = useState<string | null>(null);
  const [loadingLoanOfficers, setLoadingLoanOfficers] = useState(false);
  const [directPaymentMethod, setDirectPaymentMethod] = useState<'momo' | 'card' | null>(null);
  const [receiverPhoneNumber, setReceiverPhoneNumber] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [truckOwnerId, setTruckOwnerId] = useState<string | null>(null);
  const [truckOwnerName, setTruckOwnerName] = useState<string>('');
  const [advancePaymentCalculation, setAdvancePaymentCalculation] = useState<AdvancePaymentCalculation | null>(null);
  const [loadingAdvanceCalculation, setLoadingAdvanceCalculation] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const [lenderType, setLenderType] = useState<'internal' | 'external'>('internal');

  // Fetch loads with status LOADED
  useEffect(() => {
    fetchLoadsReadyForPayment();
  }, [user]);

  // Handle Deep Linking for Payment Action
  const [searchParams] = useSearchParams();
  const deepLinkLoadId = searchParams.get('loadId');
  const deepLinkAction = searchParams.get('action');

  useEffect(() => {
    if (deepLinkLoadId && deepLinkAction === 'pay' && loads.length > 0) {
      const targetLoad = loads.find(l => l.id === deepLinkLoadId);
      if (targetLoad) {
        // Delay slightly to ensure UI is ready
        const timer = setTimeout(() => {
          handleInitiatePayment(targetLoad);
          // Optional: Clear params to prevent reopening on refresh? 
          // Keeping them allows bookmarking/refreshing to work as expected for that action.
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [deepLinkLoadId, deepLinkAction, loads]);

  // Fetch available lenders when loan mode is selected
  useEffect(() => {
    if (paymentMode === 'loan' && user?.tenantId) {
      fetchLenders();
    }
  }, [paymentMode, user?.tenantId]);

  // Handle loan officer selection (if selected item is already a loan officer, no need to fetch)
  useEffect(() => {
    console.log('[useEffect] Loan officer selection effect triggered', {
      selectedLender,
      hasSelectedLenderData: !!selectedLenderData,
      lendersCount: lenders.length,
    });

    if (selectedLender) {
      const selectedItem = lenders.find(l => l.id === selectedLender);
      const isLoanOfficer = selectedItem?.metadata?.isLoanOfficer === true;

      console.log('[useEffect] Selected item:', {
        id: selectedItem?.id,
        name: selectedItem?.name,
        isLoanOfficer,
        metadata: selectedItem?.metadata,
      });

      if (isLoanOfficer) {
        // If it's already a loan officer, no need to fetch more
        console.log('[useEffect] Selected item is already a loan officer, skipping fetch');
        setLoanOfficers([]);
        setSelectedLoanOfficer(null);
      } else if (selectedLenderData) {
        // Regular lender - check if it uses external system
        const usesExternalSystem =
          selectedLenderData.metadata?.integrationType === 'uruti_lending_platform' ||
          selectedLenderData.metadata?.integrationType === 'external_lending_system';

        console.log('[useEffect] Checking external system:', {
          usesExternalSystem,
          integrationType: selectedLenderData.metadata?.integrationType,
        });

        if (usesExternalSystem) {
          console.log('[useEffect] Fetching loan officers for external system lender');
          fetchLoanOfficers(selectedLender);
        } else {
          console.log('[useEffect] Lender does not use external system, clearing loan officers');
          setLoanOfficers([]);
          setSelectedLoanOfficer(null);
        }
      } else {
        console.warn('[useEffect] selectedLender is set but selectedLenderData is null');
      }
    } else {
      console.log('[useEffect] No lender selected, clearing loan officers');
      setLoanOfficers([]);
      setSelectedLoanOfficer(null);
    }
  }, [selectedLender, selectedLenderData, lenders]);

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

  // Fetch truck owner information when a load is selected
  const fetchTruckOwnerInfo = async (load: Load) => {
    try {
      // Try to get truck owner from trip
      if (load.assignedTruckId) {
        // Fetch truck details
        const truckResponse = await api.get(`/fleet/trucks/${load.assignedTruckId}`);
        const truck = truckResponse.data?.data || truckResponse.data;

        if (truck?.ownerId) {
          setTruckOwnerId(truck.ownerId);

          // Fetch truck owner profile for name and phone number
          try {
            const ownerResponse = await api.get(`/users/${truck.ownerId}/profile`);
            const owner = ownerResponse.data?.data || ownerResponse.data;
            const ownerName = owner?.profile?.firstName && owner?.profile?.lastName
              ? `${owner.profile.firstName} ${owner.profile.lastName}`
              : owner?.profile?.companyName || owner?.email?.split('@')[0] || 'Truck Owner';
            setTruckOwnerName(ownerName);

            // Get truck owner's phone number for receiver
            const ownerPhone = owner?.phone || owner?.profile?.preferences?.paymentInfo?.phoneNumber;
            if (ownerPhone) {
              setReceiverPhoneNumber(ownerPhone);
            }
          } catch (err) {
            setTruckOwnerName('Truck Owner');
            // Try to get phone from auth profile endpoint
            try {
              const profileResponse = await api.get('/auth/profile', {
                params: { userId: truck.ownerId }
              });
              const profile = profileResponse.data?.data?.user || profileResponse.data?.user;
              const ownerPhone = profile?.phone || profile?.profile?.preferences?.paymentInfo?.phoneNumber;
              if (ownerPhone) {
                setReceiverPhoneNumber(ownerPhone);
              }
            } catch (profileErr) {
              console.log('Could not fetch truck owner phone number');
            }
          }
          return;
        }
      }

      // Try to get from trip if available
      try {
        const tripsResponse = await api.get('/trips', {
          params: { loadId: load.id, limit: 1 }
        });
        const trips = tripsResponse.data?.data || tripsResponse.data || [];
        if (trips.length > 0 && trips[0].truck?.ownerId) {
          const trip = trips[0];
          setTruckOwnerId(trip.truck.ownerId);

          // Set trip ID for advance payment calculation
          if (trip.id) {
            setTripId(trip.id);
            // Fetch advance payment calculation
            await fetchAdvancePaymentCalculation(trip.id, load);
          }

          // Fetch truck owner profile for name and phone number
          try {
            const ownerResponse = await api.get(`/users/${trip.truck.ownerId}/profile`);
            const owner = ownerResponse.data?.data || ownerResponse.data;
            const ownerName = owner?.profile?.firstName && owner?.profile?.lastName
              ? `${owner.profile.firstName} ${owner.profile.lastName}`
              : owner?.profile?.companyName || owner?.email?.split('@')[0] || 'Truck Owner';
            setTruckOwnerName(ownerName);

            // Get truck owner's phone number for receiver
            const ownerPhone = owner?.phone || owner?.profile?.preferences?.paymentInfo?.phoneNumber;
            if (ownerPhone) {
              setReceiverPhoneNumber(ownerPhone);
            }
          } catch (err) {
            setTruckOwnerName('Truck Owner');
            // Try to get phone from auth profile endpoint
            try {
              const profileResponse = await api.get('/auth/profile', {
                params: { userId: trip.truck.ownerId }
              });
              const profile = profileResponse.data?.data?.user || profileResponse.data?.user;
              const ownerPhone = profile?.phone || profile?.profile?.preferences?.paymentInfo?.phoneNumber;
              if (ownerPhone) {
                setReceiverPhoneNumber(ownerPhone);
              }
            } catch (profileErr) {
              console.log('Could not fetch truck owner phone number');
            }
          }
          return;
        }
      } catch (err) {
        console.warn('Could not fetch trip for truck owner:', err);
        setTripId(null);
        setAdvancePaymentCalculation(null);
      }

      // Reset if no truck owner found
      setTruckOwnerId(null);
      setTruckOwnerName('');
      setTripId(null);
      setAdvancePaymentCalculation(null);
    } catch (error: any) {
      console.error('Error fetching truck owner info:', error);
      setTruckOwnerId(null);
      setTruckOwnerName('');
      setTripId(null);
      setAdvancePaymentCalculation(null);
    }
  };

  // Fetch advance payment calculation for a trip
  const fetchAdvancePaymentCalculation = async (tripIdParam: string, load: Load) => {
    try {
      setLoadingAdvanceCalculation(true);
      const response = await paymentsAPI.getAdvancePaymentCalculation(tripIdParam);

      if (response.data?.success && response.data?.data) {
        // Ensure all numeric values are properly converted
        const calculation = response.data.data;
        const normalizedCalculation = {
          ...calculation,
          transportationFee: Number(calculation.transportationFee) || 0,
          advancePaymentPercentage: Number(calculation.advancePaymentPercentage) || 0,
          advanceAmount: Number(calculation.advanceAmount) || 0,
          finalAmount: Number(calculation.finalAmount) || 0,
          requireAdvancePayment: Boolean(calculation.requireAdvancePayment),
          currency: calculation.currency || 'USD',
        };
        setAdvancePaymentCalculation(normalizedCalculation);

        // Pre-fill payment amount with advance amount if advance payment is required
        if (normalizedCalculation.requireAdvancePayment && normalizedCalculation.advanceAmount > 0) {
          setPaymentAmount(normalizedCalculation.advanceAmount.toString());
        } else {
          // Otherwise, use the full transportation fee
          setPaymentAmount(load.offeredPrice ? load.offeredPrice.toString() : '');
        }
      } else {
        setAdvancePaymentCalculation(null);
        // Fallback to full amount
        setPaymentAmount(load.offeredPrice ? load.offeredPrice.toString() : '');
      }
    } catch (error: any) {
      console.warn('Could not fetch advance payment calculation:', error);
      setAdvancePaymentCalculation(null);
      // Fallback to full amount
      setPaymentAmount(load.offeredPrice ? load.offeredPrice.toString() : '');
    } finally {
      setLoadingAdvanceCalculation(false);
    }
  };

  const fetchLenders = async () => {
    if (!user?.tenantId) return;

    try {
      // Fetch Lender entities for the tenant
      // Try the tenant/lenders endpoint first (for tenant admins), then fallback to users with LENDER role
      let lendersList: Lender[] = [];

      try {
        console.log('[fetchLenders] Fetching lenders from /lending/tenant/lenders');
        const response = await api.get('/lending/tenant/lenders');
        const lendersData = response.data?.data || response.data || [];
        console.log('[fetchLenders] Received lenders data:', lendersData);

        lendersList = Array.isArray(lendersData)
          ? lendersData.map((l: any) => {
            const isLoanOfficer = l.metadata?.isLoanOfficer === true;
            console.log(`[fetchLenders] Processing ${isLoanOfficer ? 'loan officer' : 'lender'}:`, l.name || l.id);

            return {
              id: l.id,
              firstName: l.first_name || l.firstName,
              lastName: l.last_name || l.lastName,
              name: l.name || l.contact_email || 'Unknown Lender',
              email: l.contact_email || l.email,
              phone: l.contact_phone || l.phone,
              companyName: l.name,
              availableCredit: l.available_credit || 0,
              interestRate: l.interest_rate || 0,
              metadata: l.metadata || {},
            };
          })
          : [];

        console.log(`[fetchLenders] Processed ${lendersList.length} lenders/loan officers`);
        const loanOfficersCount = lendersList.filter(l => l.metadata?.isLoanOfficer).length;
        console.log(`[fetchLenders] Found ${loanOfficersCount} loan officers in the list`);
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
            metadata: {},
          }))
          : [];
      }

      console.log(`[fetchLenders] Setting ${lendersList.length} lenders/loan officers`);
      setLenders(lendersList);
    } catch (error: any) {
      console.error('Error fetching lenders:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error('Failed to load available lenders');
    }
  };

  const fetchLoanOfficers = async (lenderId: string) => {
    setLoadingLoanOfficers(true);
    setSelectedLoanOfficer(null);

    try {
      console.log(`[fetchLoanOfficers] Fetching loan officers for lender: ${lenderId}`);
      const response = await api.get(`/lending/external/loan-officers/${lenderId}`);
      console.log(`[fetchLoanOfficers] Response:`, response.data);

      const officersData = response.data?.loanOfficers || response.data || [];

      if (Array.isArray(officersData)) {
        console.log(`[fetchLoanOfficers] Found ${officersData.length} loan officers`);
        setLoanOfficers(officersData);
        if (officersData.length === 0) {
          console.warn(`[fetchLoanOfficers] No loan officers returned for lender ${lenderId}`);
          toast.success('No loan officers available for this lender');
        }
      } else {
        console.warn(`[fetchLoanOfficers] Invalid response format:`, officersData);
        setLoanOfficers([]);
      }
    } catch (error: any) {
      console.error('[fetchLoanOfficers] Error fetching loan officers:', error);
      console.error('[fetchLoanOfficers] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      if (error.response?.status === 404) {
        toast.error('Loan officers endpoint not implemented in external system yet');
      } else {
        toast.error('Failed to load loan officers. Check console for details.');
      }
      setLoanOfficers([]);
    } finally {
      setLoadingLoanOfficers(false);
    }
  };

  const handleInitiatePayment = async (load: Load) => {
    setSelectedLoad(load);
    setShowPaymentModal(true);
    setPaymentMode(null);
    setSelectedLender(null);
    setSelectedLenderData(null);
    setSelectedLoanOfficer(null);
    setLoanOfficers([]);
    setDirectPaymentMethod(null);
    setAdvancePaymentCalculation(null);
    setTripId(null);
    // Initialize payment amount with load's offered price (will be updated by fetchTruckOwnerInfo if advance payment exists)
    setPaymentAmount(load.offeredPrice ? load.offeredPrice.toString() : '');
    // Fetch truck owner information and advance payment calculation
    await fetchTruckOwnerInfo(load);
  };

  const handleDirectPayment = async () => {
    if (!selectedLoad || !directPaymentMethod) return;

    try {
      if (directPaymentMethod === 'momo') {
        // Validate payment amount
        const amount = paymentAmount ? parseFloat(paymentAmount) : (selectedLoad?.offeredPrice || 0);
        if (!amount || amount <= 0) {
          toast.error('Please enter a valid payment amount');
          return;
        }

        // Validate receiver phone number
        if (!receiverPhoneNumber || receiverPhoneNumber.trim() === '') {
          toast.error('Please enter the receiver phone number to proceed with payment');
          return;
        }

        // Use the tripId we already fetched (if available)


        // Use the entered receiver phone number (should be pre-filled with truck owner's phone if available)
        const finalReceiverPhone = receiverPhoneNumber.trim();

        // Send mobile money payment using the new endpoint
        toast.loading('Initiating Mobile Money payment...');
        const paymentPayload: any = {
          receiverPhoneNumber: finalReceiverPhone,
          amount: amount,
          currency: selectedLoad?.currencyCode || selectedLoad?.currency || 'RWF',
          message: `Payment for cargo: ${selectedLoad.title || selectedLoad.description}`,
          metadata: {
            isLenderPayment: false,
            cargoOwnerId: user?.id,
            loadId: selectedLoad.id,
          },
        };

        // Only include tripId if it exists
        if (tripId) {
          paymentPayload.tripId = tripId;
        }

        const response = await api.post('/payments/mobile-money/send', paymentPayload);

        toast.dismiss();
        if (response.data?.success) {
          toast.success(response.data.message || 'Mobile Money payment initiated! A confirmation popup has been sent to the API account. Once confirmed, the payment will be sent to the receiver.');
          setShowPaymentModal(false);
          setSelectedLoad(null);
          setReceiverPhoneNumber('');
          setPaymentAmount('');
          setDirectPaymentMethod(null);
          fetchLoadsReadyForPayment();
        } else {
          toast.error('Failed to initiate payment');
        }
      } else {
        // Card payment - TODO: implement card payment gateway
        toast.success(`Redirecting to Card payment...`);
        console.log('Processing card payment:', {
          loadId: selectedLoad.id,
          amount: selectedLoad.offeredPrice,
          method: directPaymentMethod,
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Payment processing failed');
    }
  };

  const handleLoanRequest = async () => {
    if (!selectedLoad || !selectedLender) {
      toast.error('Please select a lender');
      return;
    }

    try {
      // Check if selected "lender" is actually a loan officer
      const selectedItem = lenders.find(l => l.id === selectedLender);
      const isLoanOfficer = selectedItem?.metadata?.isLoanOfficer === true;

      let requestData: any = {};

      if (isLoanOfficer) {
        // If it's a loan officer, use the parent lender ID and include officer ID
        const parentLenderId = selectedItem?.metadata?.parentLenderId;
        const loanOfficerId = selectedItem?.metadata?.loanOfficerId;

        if (!parentLenderId) {
          toast.error('Invalid loan officer configuration');
          return;
        }

        requestData = {
          lender_id: parentLenderId,
          metadata: {
            loanOfficerId: loanOfficerId,
          },
        };
      } else {
        // Regular lender - check if it uses external system and requires loan officer
        const usesExternalSystem =
          selectedLenderData?.metadata?.integrationType === 'uruti_lending_platform' ||
          selectedLenderData?.metadata?.integrationType === 'external_lending_system';

        if (usesExternalSystem && loanOfficers.length > 0 && !selectedLoanOfficer) {
          toast.error('Please select a loan officer');
          return;
        }

        requestData = {
          lender_id: selectedLender,
        };

        // Include loan officer ID in metadata if selected
        if (selectedLoanOfficer) {
          requestData.metadata = {
            loanOfficerId: selectedLoanOfficer,
          };
        }
      }

      await loanRequestService.createLoanRequestForCargo(selectedLoad.id, requestData);

      toast.success('Loan request submitted successfully! The lender will review your request in their portal.');
      setShowPaymentModal(false);
      setSelectedLoad(null);
      setSelectedLender(null);
      setSelectedLenderData(null);
      setSelectedLoanOfficer(null);
      setLoanOfficers([]);
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
                style={{ backgroundColor: '#345E85' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2A4D6E'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#345E85'}
                className="w-full mt-4 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
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
                  onClick={() => {
                    setShowPaymentModal(false);
                    setReceiverPhoneNumber('');
                    setDirectPaymentMethod(null);
                    setPaymentMode(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-1">{selectedLoad.title}</p>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                Transportation Amount: {selectedLoad.currencyCode || selectedLoad.currency || 'USD'} {selectedLoad.offeredPrice?.toLocaleString() || '0'}
              </p>

              {/* Advance Payment Calculation Display */}
              {loadingAdvanceCalculation ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading payment breakdown...</span>
                </div>
              ) : advancePaymentCalculation ? (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm mb-2">Payment Breakdown</h4>
                      {advancePaymentCalculation.requireAdvancePayment ? (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Transportation Fee:</span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(advancePaymentCalculation.transportationFee, advancePaymentCalculation.currency || selectedLoad.currencyCode || 'USD')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Advance Payment ({formatPercentage(advancePaymentCalculation.advancePaymentPercentage)}):</span>
                            <span className="font-semibold text-blue-700">
                              {formatCurrency(advancePaymentCalculation.advanceAmount, advancePaymentCalculation.currency || selectedLoad.currencyCode || 'USD')}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-blue-200">
                            <span className="text-gray-600">Final Payment:</span>
                            <span className="font-semibold text-gray-700">
                              {formatCurrency(advancePaymentCalculation.finalAmount, advancePaymentCalculation.currency || selectedLoad.currencyCode || 'USD')}
                            </span>
                          </div>
                          <p className="text-blue-700 font-medium mt-2 pt-1 border-t border-blue-200">
                            💰 Pay Now: {formatCurrency(advancePaymentCalculation.advanceAmount, advancePaymentCalculation.currency || selectedLoad.currencyCode || 'USD')}
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">
                          <p>No advance payment required. Full payment of {formatCurrency(advancePaymentCalculation.transportationFee, advancePaymentCalculation.currency || selectedLoad.currencyCode || 'USD')} will be due upon completion.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
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

                  {/* Truck Owner Payment Information */}
                  {truckOwnerId && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Truck Owner Payment Information</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Use the payment information below to make payment to the truck owner:
                      </p>
                      <FinancialInformation
                        userId={truckOwnerId}
                        userName={truckOwnerName}
                        readOnly={true}
                        showTitle={false}
                      />
                    </div>
                  )}

                  <h4 className="font-semibold text-gray-900 mb-4">Select Payment Method</h4>

                  <button
                    onClick={() => setDirectPaymentMethod('momo')}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${directPaymentMethod === 'momo'
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

                  {/* Payment Amount and Receiver Phone Number Input for Mobile Money */}
                  {directPaymentMethod === 'momo' && (
                    <div className="mt-4 space-y-4">
                      {/* Payment Amount */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Payment Amount <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                          {advancePaymentCalculation?.requireAdvancePayment
                            ? `Enter the advance payment amount. Recommended: ${formatCurrency(advancePaymentCalculation.advanceAmount, advancePaymentCalculation.currency || selectedLoad?.currencyCode || 'USD')} (${formatPercentage(advancePaymentCalculation.advancePaymentPercentage)} of total).`
                            : 'Enter the amount you want to pay. Default amount is pre-filled from the cargo transportation fee.'}
                        </p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                            {selectedLoad?.currencyCode || selectedLoad?.currency || 'RWF'}
                          </span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={paymentAmount || (advancePaymentCalculation?.advanceAmount || selectedLoad?.offeredPrice || 0).toString()}
                            onChange={(e) => {
                              const value = e.target.value;
                              setPaymentAmount(value);
                            }}
                            onBlur={(e) => {
                              // If empty, reset to default (advance amount if available, otherwise full amount)
                              if (!e.target.value || parseFloat(e.target.value) <= 0) {
                                const defaultAmount = advancePaymentCalculation?.requireAdvancePayment
                                  ? advancePaymentCalculation.advanceAmount
                                  : (selectedLoad?.offeredPrice || 0);
                                setPaymentAmount(defaultAmount.toString());
                              }
                            }}
                            placeholder="Enter payment amount"
                            className="w-full pl-20 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="mt-2 space-y-1">
                          {advancePaymentCalculation?.requireAdvancePayment && (
                            <p className="text-xs text-blue-700 font-medium">
                              💡 Advance Payment: {formatCurrency(advancePaymentCalculation.advanceAmount, advancePaymentCalculation.currency || selectedLoad?.currencyCode || 'USD')}
                            </p>
                          )}
                          {selectedLoad?.offeredPrice && (
                            <p className="text-xs text-gray-500">
                              Total transportation fee: <span className="font-semibold">{selectedLoad.currencyCode || selectedLoad.currency || 'RWF'} {selectedLoad.offeredPrice.toLocaleString()}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Receiver Phone Number */}
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Receiver Phone Number <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                          Enter the phone number where the money will be sent. A confirmation popup will be sent to the API account phone to authorize the payment.
                        </p>
                        <input
                          type="tel"
                          value={receiverPhoneNumber}
                          onChange={(e) => setReceiverPhoneNumber(e.target.value)}
                          placeholder="e.g., 0783544364 or 250783544364"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {receiverPhoneNumber && (
                          <p className="text-xs text-gray-500 mt-2">
                            Money will be sent to: <span className="font-semibold">{receiverPhoneNumber}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setDirectPaymentMethod('card')}
                    className={`w-full p-4 border-2 rounded-lg transition-all text-left ${directPaymentMethod === 'card'
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
                      disabled={directPaymentMethod === 'momo' && !receiverPhoneNumber.trim()}
                      className={`w-full mt-6 px-4 py-3 rounded-lg transition-colors font-semibold ${directPaymentMethod === 'momo' && !receiverPhoneNumber.trim()
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      Proceed to Payment
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setPaymentMode(null);
                      setLenderType('internal');
                      setSelectedLender(null);
                      setSelectedLenderData(null);
                    }}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
                  >
                    ← Back
                  </button>

                  <h4 className="font-semibold text-gray-900 mb-4">Select a Lender</h4>

                  {/* Lender Type Selection Tabs */}
                  {(() => {
                    const usesExternalSystem = (lender: Lender) =>
                      lender.metadata?.integrationType === 'uruti_lending_platform' ||
                      lender.metadata?.integrationType === 'external_lending_system' ||
                      lender.metadata?.isExternalSystemLender === true;

                    const isLoanOfficer = (lender: Lender) =>
                      lender.metadata?.isLoanOfficer === true;

                    const internalLendersCount = lenders.filter(
                      (l) => !usesExternalSystem(l) && !isLoanOfficer(l)
                    ).length;

                    // External lending system shows loan officers
                    const externalLendersCount = lenders.filter(
                      (l) => isLoanOfficer(l)
                    ).length;

                    return (
                      <div className="flex gap-2 mb-4 border-b border-gray-200">
                        <button
                          onClick={() => {
                            setLenderType('internal');
                            setSelectedLender(null);
                            setSelectedLenderData(null);
                            setLoanOfficers([]);
                            setSelectedLoanOfficer(null);
                          }}
                          className={`px-4 py-2 font-medium transition-colors border-b-2 ${lenderType === 'internal'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          Internal Lenders
                          {internalLendersCount > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${lenderType === 'internal'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              {internalLendersCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setLenderType('external');
                            setSelectedLender(null);
                            setSelectedLenderData(null);
                            setLoanOfficers([]);
                            setSelectedLoanOfficer(null);
                          }}
                          className={`px-4 py-2 font-medium transition-colors border-b-2 ${lenderType === 'external'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          External Lending System
                          {externalLendersCount > 0 && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${lenderType === 'external'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              {externalLendersCount}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Filter lenders based on selected type */}
                  {(() => {
                    const usesExternalSystem = (lender: Lender) =>
                      lender.metadata?.integrationType === 'uruti_lending_platform' ||
                      lender.metadata?.integrationType === 'external_lending_system' ||
                      lender.metadata?.isExternalSystemLender === true;

                    const isLoanOfficer = (lender: Lender) =>
                      lender.metadata?.isLoanOfficer === true;

                    const filteredLenders = lenders.filter((lender) => {
                      if (lenderType === 'internal') {
                        // Show only internal lenders (not external system, not loan officers)
                        return !usesExternalSystem(lender) && !isLoanOfficer(lender);
                      } else {
                        // Show loan officers from external system (these ARE the external lenders)
                        // Loan officers are what cargo owners should select from external system
                        return isLoanOfficer(lender);
                      }
                    });

                    return filteredLenders.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium mb-2">
                          {lenderType === 'internal'
                            ? 'No internal lenders available in your tenant'
                            : 'No loan officers available from external lending system'}
                        </p>
                        {lenderType === 'external' && (
                          <div className="text-sm text-gray-500 space-y-1 mt-4">
                            <p>This might mean:</p>
                            <ul className="list-disc list-inside text-left max-w-md mx-auto space-y-1">
                              <li>External system hasn't implemented the loan officers endpoint</li>
                              <li>No loan officers exist in the external system</li>
                              <li>Lender is not configured for external system integration</li>
                              <li>API key is invalid or missing</li>
                            </ul>
                            <p className="mt-3 text-xs">Check backend logs for detailed error messages.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {filteredLenders.map((lender) => {
                          const usesExternalSystem =
                            lender.metadata?.integrationType === 'uruti_lending_platform' ||
                            lender.metadata?.integrationType === 'external_lending_system' ||
                            lender.metadata?.isExternalSystemLender === true;
                          const isLoanOfficer = lender.metadata?.isLoanOfficer === true;

                          return (
                            <button
                              key={lender.id}
                              onClick={() => {
                                setSelectedLender(lender.id);
                                setSelectedLenderData(lender);
                              }}
                              className={`w-full p-4 border-2 rounded-lg transition-all text-left ${selectedLender === lender.id
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-green-300'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-semibold text-gray-900">
                                      {lender.firstName && lender.lastName
                                        ? `${lender.firstName} ${lender.lastName}`
                                        : lender.companyName || lender.name}
                                    </h5>
                                    {isLoanOfficer && (
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                        Loan Officer
                                      </span>
                                    )}
                                    {usesExternalSystem && !isLoanOfficer && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        External System
                                      </span>
                                    )}
                                  </div>
                                  {isLoanOfficer && lender.metadata?.parentLenderName && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      From: {lender.metadata.parentLenderName}
                                    </p>
                                  )}
                                  {lender.email && (
                                    <p className="text-sm text-gray-600 mt-1">{lender.email}</p>
                                  )}
                                  {lender.metadata?.specialization && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {lender.metadata.specialization}
                                    </p>
                                  )}
                                  {lender.interestRate && !isLoanOfficer && (
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
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Loan Officers Selection - No longer needed since loan officers are displayed directly in External tab */}
                  {false && selectedLender &&
                    selectedLenderData &&
                    !selectedLenderData.metadata?.isLoanOfficer &&
                    (selectedLenderData.metadata?.integrationType === 'uruti_lending_platform' ||
                      selectedLenderData.metadata?.integrationType === 'external_lending_system') && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-600" />
                          Select Loan Officer
                          <span className="ml-2 text-xs text-gray-500 font-normal">(Required)</span>
                        </h4>
                        {loadingLoanOfficers ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-600">Loading loan officers...</span>
                          </div>
                        ) : loanOfficers.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {loanOfficers.map((officer) => (
                              <button
                                key={officer.id}
                                onClick={() => setSelectedLoanOfficer(officer.id)}
                                className={`w-full p-3 border-2 rounded-lg transition-all text-left ${selectedLoanOfficer === officer.id
                                  ? 'border-blue-500 bg-blue-100'
                                  : 'border-gray-200 hover:border-blue-300 bg-white'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900">{officer.name}</h5>
                                    {officer.email && (
                                      <p className="text-xs text-gray-600 mt-1">{officer.email}</p>
                                    )}
                                    {officer.specialization && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {officer.specialization}
                                      </p>
                                    )}
                                  </div>
                                  {selectedLoanOfficer === officer.id && (
                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center">
                            <p className="text-sm text-gray-600 mb-2">
                              No loan officers available for this lender.
                            </p>
                            <p className="text-xs text-gray-500">
                              This might mean the external system hasn't implemented the loan officers endpoint yet.
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Check browser console for details.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {selectedLender && (
                    <button
                      onClick={handleLoanRequest}
                      disabled={loanOfficers.length > 0 && !selectedLoanOfficer && !selectedLenderData?.metadata?.isLoanOfficer}
                      className={`w-full mt-6 px-4 py-3 rounded-lg transition-colors font-semibold ${loanOfficers.length > 0 && !selectedLoanOfficer && !selectedLenderData?.metadata?.isLoanOfficer
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
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

