import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { lendingApi } from '../services/lending/lendingApi';
import type { CreateLoanRequestDto } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import api, { paymentsAPI } from '../services/api';
import { fleetApi } from '../services/fleetApi';
import { FaSearch, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import {
  X, DollarSign, CheckCircle, AlertTriangle, FileText,
  RefreshCw, ChevronDown, Landmark, CalendarDays, CircleDollarSign,
  Plus, TrendingUp, Package, MapPin, Loader2, Info,
} from 'lucide-react';
import LoanRequestsEnlite from '../components/LenderDashboard/LoanRequests.enlite.tsx';
import LoanDetailModal from '../components/LenderDashboard/LoanDetailModal';
import EnhancedRepayButton from '../components/Lending/EnhancedRepayButton';
import LoanTermsAcceptanceModal from '../components/Lending/LoanTermsAcceptanceModal';
import LoanAppealModal from '../components/Lending/LoanAppealModal';
import { buildLoanWorkflowView, workflowStageBadgeClass } from '../utils/loanWorkflow';
import { StandardDataTable, type Column } from '../components/EnliteUI/Tables';

interface Lender { id: string; name: string; type: string; email: string; phone: string; }
interface LoanRequest {
  id: string; cargo_id: string; tenant_id: string; trip_id: string;
  requested_amount: number; approved_amount?: number;
  interest_amount?: number;
  currency?: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string; due_date?: string;
  borrower_name: string; borrower_email: string; borrower_phone: string; borrower_company?: string;
  cargo_type: string; cargo_weight: number; cargo_value: number;
  pickup_location: string; delivery_location: string; distance: number; estimated_duration: number;
  risk_score?: number | null; credit_score?: number | null; interest_rate?: number | null; effective_annual_rate?: number | null;
  collateral_type?: string; collateral_value?: number; purpose: string;
  lender_id?: string; lender?: Lender; processing_fee: number; total_amount: number;
  monthly_payment?: number; loan_term_months: number;
  requested_split?: Array<{ type: string; id: string; amount: number }>;
  rejection_reason?: string;
  terms_offered_at?: string | null;
  borrower_accepted_at?: string | null;
  terms_declined_at?: string | null;
  metadata?: any;
  workflow_stage?: string;
  workflow_label?: string;
  is_partial_offer?: boolean;
  amount_reduction?: number | null;
  can_appeal?: boolean;
  has_open_appeal?: boolean;
  appeal_comment?: string | null;
}
interface LoanAnalytics {
  totalRequests: number; pendingRequests: number; approvedRequests: number; rejectedRequests: number;
  totalAmountRequested: number; totalAmountApproved: number; averageAmount: number;
  averageRiskScore: number | null; approvalRate: number; monthlyGrowth: number;
}

const BENEFICIARY_TYPES = ['fuel', 'driver', 'maintenance', 'tolls', 'truck_owner', 'other'] as const;

const StatusBadge: React.FC<{ loan: LoanRequest }> = ({ loan }) => {
  const wf = buildLoanWorkflowView(loan);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${workflowStageBadgeClass(wf.workflow_stage)}`}>
      {wf.workflow_label}
    </span>
  );
};

interface LoanRequestFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
  userId: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// CARGO OWNER LOAN REQUEST MODAL
// ══════════════════════════════════════════════════════════════════════════════
const CargoOwnerLoanRequestModal: React.FC<LoanRequestFormModalProps> = ({ onClose, onSuccess, tenantId, userId }) => {
  const [lenders, setLenders] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [loadingLenders, setLoadingLenders] = useState(true);
  const [loadingCargos, setLoadingCargos] = useState(true);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [beneficiaryOptions, setBeneficiaryOptions] = useState<{ id: string; label: string }[]>([]);
  const [loadingBeneficiary, setLoadingBeneficiary] = useState(false);
  const [form, setForm] = useState({
    requested_amount: '',
    lender_id: '',
    due_date: '',
    purpose: '',
    cargo_id: '',
    trip_id: '',
    beneficiary_type: 'fuel' as typeof BENEFICIARY_TYPES[number],
    beneficiary_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedCargo = cargos.find((c: any) => c.id === form.cargo_id);

  // Fetch lenders and cargo owner's cargos on mount
  useEffect(() => {
    lendingApi.getTenantLenders()
      .then(data => setLenders(Array.isArray(data) ? data : []))
      .catch(() => setLenders([]))
      .finally(() => setLoadingLenders(false));

    setLoadingCargos(true);
    // Fetch only cargos that have an active trip — lenders only finance active trips
    // Valid trip statuses: PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, DELAYED
    const ACTIVE_TRIP_STATUSES = ['IN_PROGRESS', 'PLANNED', 'DELAYED'];
    // Match backend: a cargo/trip can only have one active financing request
    const ACTIVE_LOAN_STATUSES = new Set(['pending', 'approved', 'disbursed']);
    Promise.all([
      api.get('/trips', { params: { page: 1, limit: 100, status: 'IN_PROGRESS,PLANNED,DELAYED' } }),
      api.get('/lending/my-loans').catch(() => ({ data: [] })),
    ])
      .then(async ([tripsRes, loansRes]) => {
        const rawTrips = tripsRes.data?.data || tripsRes.data?.trips || tripsRes.data?.items || tripsRes.data || [];
        const tripsList: any[] = Array.isArray(rawTrips) ? rawTrips : [];
        // Keep only trips with an active status
        const activeTrips = tripsList.filter((t: any) =>
          ACTIVE_TRIP_STATUSES.includes((t.status || '').toUpperCase())
        );
        // Extract unique load/cargo IDs from active trips
        const activeLoadIds = new Set(
          activeTrips.map((t: any) => t.loadId || t.load_id || t.load?.id).filter(Boolean)
        );
        if (activeLoadIds.size === 0) { setCargos([]); return; }

        const rawLoans = loansRes.data?.data || loansRes.data?.loans || loansRes.data || [];
        const loansList: any[] = Array.isArray(rawLoans) ? rawLoans : [];
        const financedCargoIds = new Set(
          loansList
            .filter((loan: any) => ACTIVE_LOAN_STATUSES.has(String(loan.status || '').toLowerCase()))
            .map((loan: any) => loan.cargo_id || loan.cargoId)
            .filter(Boolean)
        );

        // Fetch the matching loads
        const loadRes = await api.get('/loads', { params: { page: 1, limit: 50 } });
        const rawLoads = loadRes.data?.items || loadRes.data?.data || loadRes.data?.loads || loadRes.data || [];
        let cargosList: any[] = Array.isArray(rawLoads) ? rawLoads : [];
        cargosList = cargosList.filter((cargo: any) => {
          const isOwner =
            cargo.cargoOwner?.id === userId ||
            cargo.createdBy === userId ||
            cargo.created_by === userId ||
            cargo.ownerId === userId ||
            cargo.owner_id === userId;
          const hasActiveTrip = activeLoadIds.has(cargo.id);
          const alreadyFinanced = financedCargoIds.has(cargo.id);
          return isOwner && hasActiveTrip && !alreadyFinanced;
        });
        setCargos(cargosList);
      })
      .catch(() => setCargos([]))
      .finally(() => setLoadingCargos(false));
  }, [userId]);

  // When cargo is selected, auto-fetch its linked trip (1 cargo = 1 trip)
  useEffect(() => {
    if (!form.cargo_id) {
      setSelectedTrip(null);
      setForm(p => ({ ...p, trip_id: '' }));
      return;
    }
    setLoadingTrip(true);
    setSelectedTrip(null);
    // Fetch trips for this cargo — only active trips are eligible for loan financing
    api.get('/trips', { params: { loadId: form.cargo_id, limit: 10 } })
      .then(res => {
        const raw = res.data?.data || res.data?.trips || res.data?.items || res.data || [];
        const tripsList = Array.isArray(raw) ? raw : [];
        // Only consider active trips (PLANNED, IN_PROGRESS, DELAYED)
        const ACTIVE_STATUSES = ['IN_PROGRESS', 'PLANNED', 'DELAYED'];
        const activeTrips = tripsList.filter((t: any) =>
          ACTIVE_STATUSES.includes((t.status || '').toUpperCase())
        );
        if (activeTrips.length > 0) {
          // Prefer IN_PROGRESS over PLANNED over DELAYED
          const priority = (s: string) =>
            s === 'IN_PROGRESS' ? 0 : s === 'PLANNED' ? 1 : 2;
          const trip = [...activeTrips].sort((a, b) =>
            priority(a.status) - priority(b.status)
          )[0];
          setSelectedTrip(trip);
          setForm(p => ({ ...p, trip_id: trip.id }));
        } else {
          setSelectedTrip(null);
          setForm(p => ({ ...p, trip_id: '' }));
        }
      })
      .catch(() => { setSelectedTrip(null); setForm(p => ({ ...p, trip_id: '' })); })
      .finally(() => setLoadingTrip(false));
  }, [form.cargo_id]);

  // Auto-fill beneficiary based on fund purpose + trip/cargo data
  useEffect(() => {
    setBeneficiaryOptions([]);
    setForm(p => ({ ...p, beneficiary_id: '' }));

    if (!selectedTrip && !selectedCargo) return;

    const type = form.beneficiary_type;

    if (type === 'truck_owner') {
      // Trip has truckId — fetch the truck to get its owner
      if (!selectedTrip?.id) return;
      setLoadingBeneficiary(true);
      api.get(`/trips/${selectedTrip.id}`)
        .then(async res => {
          const trip = res.data?.data || res.data;
          const truckId = trip?.truckId || trip?.truck_id;
          if (!truckId) return;
          // Fetch truck details to get ownerId
          const truckRes = await api.get(`/fleet/trucks/${truckId}`);
          const truck = truckRes.data?.truck || truckRes.data?.data || truckRes.data;
          console.log('🚛 Truck details:', truck);
          const ownerId = truck?.ownerId || truck?.owner_id || truck?.owner?.id;
          const ownerName = truck?.owner?.firstName
            ? `${truck.owner.firstName} ${truck.owner.lastName || ''}`.trim()
            : truck?.owner?.name
            || truck?.owner?.email
            || `Truck ${truck?.plateNumber || truckId.slice(0, 8)}`;
          console.log('🚛 Owner ID:', ownerId, 'Owner Name:', ownerName);
          if (ownerId) {
            setBeneficiaryOptions([{ id: ownerId, label: ownerName }]);
            setForm(p => ({ ...p, beneficiary_id: ownerId }));
          }
        })
        .catch((err) => { console.error('🚛 Truck fetch error:', err.response?.data || err.message); })
        .finally(() => setLoadingBeneficiary(false));
    } else if (type === 'driver') {
      // Driver comes from the trip's assigned driver
      const driverId = selectedTrip?.driverId || selectedTrip?.driver?.id || selectedTrip?.assignedDriver?.id;
      const driverName = selectedTrip?.driver?.firstName
        ? `${selectedTrip.driver.firstName} ${selectedTrip.driver.lastName || ''}`.trim()
        : selectedTrip?.assignedDriver?.name || selectedTrip?.driverName || 'Assigned Driver';
      if (driverId) {
        setBeneficiaryOptions([{ id: driverId, label: driverName }]);
        setForm(p => ({ ...p, beneficiary_id: driverId }));
      } else if (selectedTrip?.id) {
        setLoadingBeneficiary(true);
        api.get(`/trips/${selectedTrip.id}`)
          .then(res => {
            const trip = res.data?.data || res.data;
            const dId = trip?.driverId || trip?.driver?.id;
            const dName = trip?.driver?.firstName
              ? `${trip.driver.firstName} ${trip.driver.lastName || ''}`.trim()
              : 'Assigned Driver';
            if (dId) {
              setBeneficiaryOptions([{ id: dId, label: dName }]);
              setForm(p => ({ ...p, beneficiary_id: dId }));
            }
          })
          .catch(() => {})
          .finally(() => setLoadingBeneficiary(false));
      }
    } else if (type === 'maintenance') {
      // Truck from the trip
      const truckId = selectedTrip?.truckId || selectedTrip?.truck?.id || selectedTrip?.assignedTruck?.id;
      const truckLabel = selectedTrip?.assignedTruck?.plateNumber
        || selectedTrip?.truck?.plateNumber
        || selectedTrip?.truckPlate
        || 'Assigned Truck';
      if (truckId) {
        setBeneficiaryOptions([{ id: truckId, label: truckLabel }]);
        setForm(p => ({ ...p, beneficiary_id: truckId }));
      }
    } else if (type === 'fuel') {
      // Use the trip ID itself as the fuel reference (fuel is for the trip)
      if (selectedTrip?.id) {
        const label = `Trip ${selectedTrip.tripNumber || selectedTrip.id.slice(0, 8)} — Fuel`;
        setBeneficiaryOptions([{ id: selectedTrip.id, label }]);
        setForm(p => ({ ...p, beneficiary_id: selectedTrip.id }));
      }
    } else if (type === 'tolls') {
      // Use the trip ID as toll reference
      if (selectedTrip?.id) {
        const label = `Trip ${selectedTrip.tripNumber || selectedTrip.id.slice(0, 8)} — Tolls`;
        setBeneficiaryOptions([{ id: selectedTrip.id, label }]);
        setForm(p => ({ ...p, beneficiary_id: selectedTrip.id }));
      }
    }
    // 'other' — leave empty for manual input
  }, [form.beneficiary_type, selectedTrip, selectedCargo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(form.requested_amount);
    if (!amount || amount <= 0) { setError('Enter a valid loan amount.'); return; }
    if (amount > 50000) { setError('Maximum loan amount is $50,000.'); return; }
    if (!form.cargo_id) { setError('Please select a cargo.'); return; }
    if (!form.trip_id) { setError('Please select a trip.'); return; }
    if (!form.beneficiary_id.trim()) { setError('Please enter a beneficiary.'); return; }
    if (!form.lender_id) { setError('Please select a preferred lender.'); return; }
    
    const payload: CreateLoanRequestDto = {
      tenant_id: tenantId,
      cargo_id: form.cargo_id,
      trip_id: form.trip_id,
      requested_amount: amount,
      created_by: userId,
      requested_split: [{ type: form.beneficiary_type, id: form.beneficiary_id.trim(), amount }],
      lender_id: form.lender_id,
      ...(form.due_date && { due_date: form.due_date }),
      metadata: { purpose: form.purpose || form.beneficiary_type },
    };
    
    try {
      setSubmitting(true);
      await lendingApi.createLoanRequest(payload);
      setSuccess(true);
      toast.success('Loan request submitted successfully!', {
        icon: '✅',
        duration: 4000,
      });
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit loan request.';
      const errorMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      setError(errorMsg);
      toast.error(errorMsg, {
        duration: 5000,
      });
    } finally { setSubmitting(false); }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-8 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-[#345E85] px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Cargo Financing</p>
            <h3 className="text-xl font-black text-white tracking-tight">New Loan Request</h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 overflow-y-auto custom-scrollbar flex-1">

          {/* Amount */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Loan Amount (USD) <span className="text-rose-400">*</span></label>
            <div className="relative">
              <CircleDollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="number" min="1" max="50000" step="0.01" value={form.requested_amount}
                onChange={e => setForm(p => ({ ...p, requested_amount: e.target.value }))}
                placeholder="e.g. 5000"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all"
                required />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Max $50,000 per request</p>
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Cargo <span className="text-rose-400">*</span></label>
            <div className="relative">
              <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              {loadingCargos && <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10" />}
              <select value={form.cargo_id}
                onChange={e => setForm(p => ({ ...p, cargo_id: e.target.value, trip_id: '' }))}
                className={selectCls(true)} disabled={loadingCargos} required>
                <option value="">{loadingCargos ? 'Loading your cargos…' : cargos.length === 0 ? 'No eligible cargos available' : 'Select your cargo'}</option>
                {cargos.map((c: any) => {
                  const originCity = typeof c.origin?.city === 'object'
                    ? (c.origin.city.name || c.origin.city.address || '')
                    : (c.origin?.city || '');
                  const destCity = typeof c.destination?.city === 'object'
                    ? (c.destination.city.name || c.destination.city.address || '')
                    : (c.destination?.city || '');
                  const route = originCity && destCity
                    ? ` · ${originCity} → ${destCity}`
                    : originCity ? ` · ${originCity}` : '';
                  const label = c.title || c.loadNumber || `Cargo ${c.id.slice(0, 8)}`;
                  const type = c.cargoType ? ` (${c.cargoType.charAt(0) + c.cargoType.slice(1).toLowerCase()})` : '';
                  return (
                    <option key={c.id} value={c.id}>
                      {label}{type}{route}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            </div>
            {selectedCargo && (
              <p className="text-[10px] text-[#345E85] mt-1 font-semibold flex items-center gap-1">
                <MapPin size={10} />
                {(typeof selectedCargo.origin?.address === 'object' ? selectedCargo.origin.address.address : (selectedCargo.origin?.address || (typeof selectedCargo.pickupLocation === 'object' ? selectedCargo.pickupLocation.address : selectedCargo.pickupLocation) || ''))}
                {(selectedCargo.destination?.address || selectedCargo.deliveryLocation) ? ' → ' + (typeof selectedCargo.destination?.address === 'object' ? selectedCargo.destination.address.address : (selectedCargo.destination?.address || (typeof selectedCargo.deliveryLocation === 'object' ? selectedCargo.deliveryLocation.address : selectedCargo.deliveryLocation) || '')) : ''}
              </p>
            )}
            {!loadingCargos && cargos.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-1.5 font-semibold flex items-center gap-1">
                <Info size={10} /> Only cargos with an active trip and no existing loan request are eligible.
              </p>
            )}
          </div>

          {/* Trip — auto-resolved from cargo, shown as read-only */}
          {form.cargo_id && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Linked Trip
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                loadingTrip ? 'bg-slate-50 border-slate-200' :
                selectedTrip ? 'bg-emerald-50 border-emerald-200' :
                'bg-rose-50 border-rose-200'
              }`}>
                {loadingTrip ? (
                  <><Loader2 size={14} className="animate-spin text-slate-400" />
                  <span className="text-sm text-slate-400 font-medium">Fetching linked trip…</span></>
                ) : selectedTrip ? (
                  <><CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-black text-emerald-800">
                      {selectedTrip.tripNumber || selectedTrip.id?.slice(0, 8)}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-widest">
                      Status: {selectedTrip.status} · Auto-linked to cargo
                    </p>
                  </div></>
                ) : (
                  <><AlertTriangle size={14} className="text-rose-500 flex-shrink-0" />
                  <span className="text-sm text-rose-600 font-semibold">
                    No trip found for this cargo. A trip must be assigned first.
                  </span></>
                )}
              </div>
            </div>
          )}

          {/* Fund Allocation */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-100">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Info size={12} /> Fund Allocation
            </p>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fund Purpose <span className="text-rose-400">*</span></label>
              <div className="relative">
                <select value={form.beneficiary_type}
                  onChange={e => setForm(p => ({ ...p, beneficiary_type: e.target.value as any }))}
                  className={selectCls()}>
                  <option value="fuel">⛽ Fuel</option>
                  <option value="driver">👤 Driver</option>
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="tolls">🛣️ Tolls</option>
                  <option value="truck_owner">🚛 Truck Owner Payment</option>
                  <option value="other">📦 Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Beneficiary <span className="text-rose-400">*</span></label>
              {loadingBeneficiary ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Loader2 size={14} className="animate-spin text-slate-400" />
                  <span className="text-sm text-slate-400 font-medium">Resolving beneficiary…</span>
                </div>
              ) : beneficiaryOptions.length > 0 ? (
                // Auto-filled — show as read-only info card
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-black text-emerald-800">{beneficiaryOptions[0].label}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-widest">
                      Auto-filled · {form.beneficiary_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ) : form.beneficiary_type === 'other' ? (
                // 'Other' — free text input
                <input type="text" value={form.beneficiary_id}
                  onChange={e => setForm(p => ({ ...p, beneficiary_id: e.target.value }))}
                  placeholder="Enter beneficiary name or reference"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all"
                  required />
              ) : (
                // No data found — show warning
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-amber-700 font-semibold">
                    {!form.cargo_id
                      ? 'Select a cargo first to auto-fill beneficiary'
                      : !selectedTrip
                      ? 'Waiting for trip to load…'
                      : `No ${form.beneficiary_type.replace('_', ' ')} found for this trip`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lender */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Preferred Lender <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              {loadingLenders && <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10" />}
              <select value={form.lender_id} onChange={e => setForm(p => ({ ...p, lender_id: e.target.value }))}
                className={selectCls(true)} disabled={loadingLenders} required>
                <option value="">
                  {loadingLenders ? 'Loading lenders…' : lenders.length === 0 ? 'No lenders available in your tenant' : 'Select a lender'}
                </option>
                {lenders.map((l: any) => <option key={l.id} value={l.id}>{l.name}{l.contact_email ? ' — ' + l.contact_email : ''}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            </div>
            {!loadingLenders && lenders.length === 0 && (
              <p className="text-[10px] text-rose-500 mt-1.5 font-semibold flex items-center gap-1">
                <AlertTriangle size={10} /> No active lenders found in your tenant. Ask your admin to add a lender first.
              </p>
            )}
          </div>

          {/* Date + Note */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Repayment Date <span className="text-slate-300 normal-case font-medium">(optional)</span></label>
              <div className="relative">
                <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" value={form.due_date} min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Note <span className="text-slate-300 normal-case font-medium">(optional)</span></label>
              <input type="text" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                placeholder="e.g. Fuel advance for trip"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all" />
            </div>
          </div>

          {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"><AlertTriangle size={14} className="flex-shrink-0" /> {error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"><CheckCircle size={14} className="flex-shrink-0" /> Loan request submitted successfully!</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={submitting || success}
              className="flex-1 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><RefreshCw size={12} className="animate-spin" /> Submitting…</> : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TRUCK OWNER LOAN REQUEST MODAL (Original)
// ══════════════════════════════════════════════════════════════════════════════

const selectCls = (hasIcon = false) =>
  `w-full ${hasIcon ? 'pl-10' : 'pl-4'} pr-8 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed`;

const LoanRequestFormModal: React.FC<LoanRequestFormModalProps> = ({ onClose, onSuccess, tenantId, userId }) => {
  const { user } = useAuth(); // Get user context to check role
  const [lenders, setLenders]     = useState<any[]>([]);
  const [loads, setLoads]         = useState<any[]>([]);
  const [trips, setTrips]         = useState<any[]>([]);
  const [drivers, setDrivers]     = useState<any[]>([]);
  const [trucks, setTrucks]       = useState<any[]>([]);
  const [loadingLenders, setLoadingLenders] = useState(true);
  const [loadingLoads,   setLoadingLoads]   = useState(true);
  const [loadingTrips,   setLoadingTrips]   = useState(false);
  const [loadingBenef,   setLoadingBenef]   = useState(false);
  const [form, setForm] = useState({
    requested_amount: '',
    lender_id: '',
    due_date: '',
    purpose: '',
    cargo_id: '',
    trip_id: '',
    beneficiary_type: 'fuel' as typeof BENEFICIARY_TYPES[number],
    beneficiary_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);

  const selectedLoad = loads.find((l: any) => l.id === form.cargo_id);

  useEffect(() => {
    lendingApi.getTenantLenders()
      .then(data => setLenders(Array.isArray(data) ? data : []))
      .catch(() => setLenders([]))
      .finally(() => setLoadingLenders(false));
    
    // Fetch only loads that have an active trip — lenders only finance active trips
    const ACTIVE_TRIP_STATUSES = ['IN_PROGRESS', 'PLANNED', 'DELAYED'];
    const ACTIVE_LOAN_STATUSES = new Set(['pending', 'approved', 'disbursed']);
    const isCargoOwner = user?.role === 'CARGO_OWNER';

    Promise.all([
      api.get('/trips', { params: { page: 1, limit: 100 } }),
      api.get('/lending/my-loans').catch(() => ({ data: [] })),
    ])
      .then(async ([tripsRes, loansRes]) => {
        const rawTrips = tripsRes.data?.data || tripsRes.data?.trips || tripsRes.data?.items || tripsRes.data || [];
        const tripsList: any[] = Array.isArray(rawTrips) ? rawTrips : [];

        // Keep only active trips
        const activeTrips = tripsList.filter((t: any) =>
          ACTIVE_TRIP_STATUSES.includes((t.status || '').toUpperCase())
        );
        const activeLoadIds = new Set(
          activeTrips.map((t: any) => t.loadId || t.load_id || t.load?.id).filter(Boolean)
        );
        if (activeLoadIds.size === 0) { setLoads([]); setLoadingLoads(false); return; }

        const rawLoans = loansRes.data?.data || loansRes.data?.loans || loansRes.data || [];
        const loansList: any[] = Array.isArray(rawLoans) ? rawLoans : [];
        const financedCargoIds = new Set(
          loansList
            .filter((loan: any) => ACTIVE_LOAN_STATUSES.has(String(loan.status || '').toLowerCase()))
            .map((loan: any) => loan.cargo_id || loan.cargoId)
            .filter(Boolean)
        );

        // Fetch loads and cross-filter against active trip load IDs
        const loadsEndpoint = isCargoOwner ? '/loads-v2' : '/loads-v2/assigned-loads';
        const loadRes = await api.get(loadsEndpoint);
        const raw = loadRes.data?.data || loadRes.data?.loads || loadRes.data || [];
        let loadsList: any[] = Array.isArray(raw) ? raw : [];

        // For cargo owners, additionally filter by ownership
        if (isCargoOwner && userId) {
          loadsList = loadsList.filter((load: any) =>
            load.created_by === userId ||
            load.createdBy === userId ||
            load.owner_id === userId ||
            load.ownerId === userId
          );
        }

        // Keep only loads with an active trip and no active loan request
        loadsList = loadsList.filter(
          (load: any) => activeLoadIds.has(load.id) && !financedCargoIds.has(load.id)
        );
        setLoads(loadsList);
      })
      .catch(() => setLoads([]))
      .finally(() => setLoadingLoads(false));
  }, [user, userId]);

  // Auto-fetch and auto-select trip when cargo is selected (TruckOwner modal)
  useEffect(() => {
    if (!form.cargo_id) { setTrips([]); setForm(p => ({ ...p, trip_id: '' })); return; }
    setLoadingTrips(true);
    api.get('/trips', { params: { loadId: form.cargo_id, limit: 50 } })
      .then(res => {
        const raw = res.data?.data || res.data?.trips || res.data || [];
        const tripsList = Array.isArray(raw) ? raw : [];
        // Only show active trips — lenders finance active trips only
        const ACTIVE_TRIP_STATUSES = ['IN_PROGRESS', 'PLANNED', 'DELAYED'];
        const activeTrips = tripsList.filter((t: any) =>
          ACTIVE_TRIP_STATUSES.includes((t.status || '').toUpperCase())
        );
        setTrips(activeTrips);
        if (activeTrips.length === 1) {
          setForm(p => ({ ...p, trip_id: activeTrips[0].id }));
        } else if (activeTrips.length > 1) {
          // Auto-select the most recently started active trip
          const sorted = [...activeTrips].sort((a, b) =>
            new Date(b.created_at || b.createdAt || 0).getTime() -
            new Date(a.created_at || a.createdAt || 0).getTime()
          );
          setForm(p => ({ ...p, trip_id: sorted[0].id }));
        }
      })
      .catch(() => setTrips([]))
      .finally(() => setLoadingTrips(false));
  }, [form.cargo_id]);

  useEffect(() => {
    setForm(p => ({ ...p, beneficiary_id: '' }));
    if (form.beneficiary_type === 'driver') {
      setLoadingBenef(true);
      fleetApi.getDrivers()
        .then(data => setDrivers(Array.isArray(data) ? data : []))
        .catch(() => setDrivers([]))
        .finally(() => setLoadingBenef(false));
    } else if (form.beneficiary_type === 'maintenance') {
      setLoadingBenef(true);
      fleetApi.getTrucks()
        .then(data => setTrucks(Array.isArray(data) ? data : []))
        .catch(() => setTrucks([]))
        .finally(() => setLoadingBenef(false));
    }
  }, [form.beneficiary_type]);

  const beneficiaryOptions = (): { id: string; label: string }[] => {
    if (form.beneficiary_type === 'driver')
      return drivers.map((d: any) => ({ id: d.userId || d.id, label: `${d.firstName} ${d.lastName}${d.licenseNumber ? ' — ' + d.licenseNumber : ''}` }));
    if (form.beneficiary_type === 'maintenance')
      return trucks.map((t: any) => ({ id: t.id, label: `${t.plateNumber}${t.make ? ' (' + t.make + ' ' + (t.model || '') + ')' : ''}` }));
    return [];
  };
  const benefOptions = beneficiaryOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(form.requested_amount);
    if (!amount || amount <= 0)      { setError('Enter a valid loan amount.'); return; }
    if (amount > 50000)              { setError('Maximum loan amount is $50,000.'); return; }
    if (!form.cargo_id)              { setError('Please select a cargo/load.'); return; }
    if (!form.trip_id)               { setError('Please select a trip.'); return; }
    if (!form.beneficiary_id.trim()) { setError('Please select or enter a beneficiary.'); return; }
    const payload: CreateLoanRequestDto = {
      tenant_id: tenantId,
      cargo_id: form.cargo_id,
      trip_id: form.trip_id,
      requested_amount: amount,
      created_by: userId,
      requested_split: [{ type: form.beneficiary_type, id: form.beneficiary_id.trim(), amount }],
      ...(form.lender_id && { lender_id: form.lender_id }),
      ...(form.due_date   && { due_date: form.due_date }),
      metadata: { purpose: form.purpose || form.beneficiary_type },
    };
    try {
      setSubmitting(true);
      await lendingApi.createLoanRequest(payload);
      setSuccess(true);
      toast.success('Loan request submitted successfully!', {
        icon: '✅',
        duration: 4000,
      });
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit loan request.';
      const errorMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      setError(errorMsg);
      toast.error(errorMsg, {
        duration: 5000,
      });
    } finally { setSubmitting(false); }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-8 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="bg-[#345E85] px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Fleet Financing</p>
            <h3 className="text-xl font-black text-white tracking-tight">New Loan Request</h3>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 overflow-y-auto custom-scrollbar flex-1">

          {/* Amount */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Loan Amount (USD) <span className="text-rose-400">*</span></label>
            <div className="relative">
              <CircleDollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="number" min="1" max="50000" step="0.01" value={form.requested_amount}
                onChange={e => setForm(p => ({ ...p, requested_amount: e.target.value }))}
                placeholder="e.g. 5000"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all"
                required />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Max $50,000 per request</p>
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cargo / Load <span className="text-rose-400">*</span></label>
            <div className="relative">
              <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              {loadingLoads && <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10" />}
              <select value={form.cargo_id}
                onChange={e => setForm(p => ({ ...p, cargo_id: e.target.value, trip_id: '' }))}
                className={selectCls(true)} disabled={loadingLoads} required>
                <option value="">{loadingLoads ? 'Loading loads…' : loads.length === 0 ? 'No loads with active trips found' : 'Select a load'}</option>
                {loads.map((l: any) => {
                  const originCity = typeof l.origin?.city === 'object'
                    ? (l.origin.city.name || l.origin.city.address || '')
                    : (l.origin?.city || '');
                  const destCity = typeof l.destination?.city === 'object'
                    ? (l.destination.city.name || l.destination.city.address || '')
                    : (l.destination?.city || '');
                  const route = originCity && destCity
                    ? ` · ${originCity} → ${destCity}`
                    : originCity ? ` · ${originCity}` : '';
                  const label = l.title || l.loadNumber || `Cargo ${l.id.slice(0, 8)}`;
                  const type = l.cargoType ? ` (${l.cargoType.charAt(0) + l.cargoType.slice(1).toLowerCase()})` : '';
                  return (
                    <option key={l.id} value={l.id}>
                      {label}{type}{route}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            </div>
            {selectedLoad && (
              <p className="text-[10px] text-[#345E85] mt-1 font-semibold flex items-center gap-1">
                <MapPin size={10} />
                {(typeof selectedLoad.origin?.address === 'object' ? selectedLoad.origin.address.address : (selectedLoad.origin?.address || (typeof selectedLoad.pickupLocation === 'object' ? selectedLoad.pickupLocation.address : selectedLoad.pickupLocation) || ''))}
                {(selectedLoad.destination?.address || selectedLoad.deliveryLocation) ? ' → ' + (typeof selectedLoad.destination?.address === 'object' ? selectedLoad.destination.address.address : (selectedLoad.destination?.address || (typeof selectedLoad.deliveryLocation === 'object' ? selectedLoad.deliveryLocation.address : selectedLoad.deliveryLocation) || '')) : ''}
              </p>
            )}
          </div>

          {/* Trip */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Trip <span className="text-rose-400">*</span></label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              {loadingTrips && <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10" />}
              <select value={form.trip_id}
                onChange={e => setForm(p => ({ ...p, trip_id: e.target.value }))}
                className={selectCls(true)} disabled={!form.cargo_id || loadingTrips} required>
                <option value="">{!form.cargo_id ? 'Select a load first' : loadingTrips ? 'Loading trips…' : trips.length === 0 ? 'No active trips for this load' : 'Select a trip'}</option>
                {trips.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber || t.id.slice(0, 8)} — {t.status || 'Trip'}{t.createdAt ? ' · ' + new Date(t.createdAt).toLocaleDateString() : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            </div>
          </div>

          {/* Fund Allocation */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-100">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Info size={12} /> Fund Allocation
            </p>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fund Purpose <span className="text-rose-400">*</span></label>
              <div className="relative">
                <select value={form.beneficiary_type}
                  onChange={e => setForm(p => ({ ...p, beneficiary_type: e.target.value as any }))}
                  className={selectCls()}>
                  <option value="fuel">⛽ Fuel</option>
                  <option value="driver">👤 Driver</option>
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="tolls">🛣️ Tolls</option>
                  <option value="other">📦 Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Beneficiary <span className="text-rose-400">*</span></label>
              {(form.beneficiary_type === 'driver' || form.beneficiary_type === 'maintenance') ? (
                <div className="relative">
                  {loadingBenef && <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10" />}
                  <select value={form.beneficiary_id}
                    onChange={e => setForm(p => ({ ...p, beneficiary_id: e.target.value }))}
                    className={selectCls()} disabled={loadingBenef} required>
                    <option value="">{loadingBenef ? 'Loading…' : benefOptions.length === 0 ? 'No options found' : form.beneficiary_type === 'driver' ? 'Select a driver' : 'Select a truck'}</option>
                    {benefOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                </div>
              ) : (
                <input type="text" value={form.beneficiary_id}
                  onChange={e => setForm(p => ({ ...p, beneficiary_id: e.target.value }))}
                  placeholder={form.beneficiary_type === 'fuel' ? 'Fuel supplier ID or account' : form.beneficiary_type === 'tolls' ? 'Toll account ID' : 'Beneficiary ID or reference'}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all"
                  required />
              )}
            </div>
          </div>

          {/* Lender */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Preferred Lender <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              {loadingLenders && <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10" />}
              <select value={form.lender_id} onChange={e => setForm(p => ({ ...p, lender_id: e.target.value }))}
                className={selectCls(true)} disabled={loadingLenders} required>
                <option value="">
                  {loadingLenders ? 'Loading lenders…' : lenders.length === 0 ? 'No lenders available in your tenant' : 'Select a lender'}
                </option>
                {lenders.map((l: any) => <option key={l.id} value={l.id}>{l.name}{l.contact_email ? ' — ' + l.contact_email : ''}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            </div>
            {!loadingLenders && lenders.length === 0 && (
              <p className="text-[10px] text-rose-500 mt-1.5 font-semibold flex items-center gap-1">
                <AlertTriangle size={10} /> No active lenders found in your tenant. Ask your admin to add a lender first.
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Note <span className="text-slate-300 normal-case font-medium">(optional)</span></label>
            <input type="text" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
              placeholder="e.g. Fuel advance for trip"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all" />
          </div>

          {/* Repayment terms notice */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
            <CalendarDays size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 font-semibold leading-relaxed">
              <span className="font-black uppercase tracking-wide">Repayment date & terms</span> are set by the lender upon approval, based on their policy (loan term, interest rate, grace period). You will be notified once terms are confirmed.
            </p>
          </div>

          {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"><AlertTriangle size={14} className="flex-shrink-0" /> {error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2"><CheckCircle size={14} className="flex-shrink-0" /> Loan request submitted successfully!</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={submitting || success}
              className="flex-1 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><RefreshCw size={12} className="animate-spin" /> Submitting…</> : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// BORROWER LOAN REQUESTS VIEW (Truck Owner / Cargo Owner)
// ══════════════════════════════════════════════════════════════════════════════

const TruckOwnerLoanRequestsView: React.FC<{
  requests: LoanRequest[];
  analytics?: LoanAnalytics | null;
  loading: boolean;
  error: string | null;
  onNewRequest: () => void;
  onRefresh: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  autoReviewLoanId?: string | null;
  autoAppealLoanId?: string | null;
}> = ({ requests, loading, error, onNewRequest, onRefresh, search, onSearchChange, autoReviewLoanId, autoAppealLoanId }) => {
  const { compactIn } = useCurrencyFormat();
  const fmtLoan = (amount: number, currency?: string) =>
    compactIn(amount, currency || 'RWF', currency || 'RWF');
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [acceptLoanId, setAcceptLoanId] = useState<string | null>(null);
  const [appealLoan, setAppealLoan] = useState<any | null>(null);

  useEffect(() => {
    if (!autoReviewLoanId || !requests?.length) return;
    const loan = requests.find((r) => r.id === autoReviewLoanId);
    if (!loan) return;
    const wf = buildLoanWorkflowView(loan);
    if (wf.awaiting_borrower_response) {
      setAcceptLoanId(loan.id);
    }
  }, [autoReviewLoanId, requests]);

  useEffect(() => {
    if (!autoAppealLoanId || !requests?.length) return;
    const loan = requests.find((r) => r.id === autoAppealLoanId);
    if (!loan) return;
    const wf = buildLoanWorkflowView(loan);
    if (wf.can_appeal) {
      setAppealLoan(loan);
    }
  }, [autoAppealLoanId, requests]);

  const filtered = requests.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.purpose?.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );

  const loanHistoryColumns: Column<LoanRequest>[] = useMemo(() => [
    {
      key: 'id',
      label: 'Loan ID',
      render: (_v, req) => (
        <>
          <p className="text-xs font-black text-slate-900 font-mono">{req.id.slice(0, 8)}…</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {req.trip_id ? `Trip: ${req.trip_id.slice(0, 8)}…` : '—'}
          </p>
        </>
      ),
    },
    {
      key: 'requested_amount',
      label: 'Amount',
      render: (_v, req) => (
        <>
          <p className="text-sm font-black text-slate-900">{fmtLoan(req.requested_amount, req.currency)}</p>
          {req.approved_amount != null && (
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              ✓ Approved: {fmtLoan(req.approved_amount, req.currency)}
            </p>
          )}
        </>
      ),
    },
    {
      key: 'purpose',
      label: 'Purpose',
      render: (_v, req) => (
        <p className="text-sm font-semibold text-slate-700 capitalize">
          {req.purpose || 'Fleet financing'}
        </p>
      ),
    },
    {
      key: 'requested_split',
      label: 'Fund Split',
      render: (_v, req) =>
        req.requested_split && req.requested_split.length > 0 ? (
          <div className="space-y-1">
            {req.requested_split.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                  {s.type}
                </span>
                <span className="text-xs font-bold text-slate-800">{fmtLoan(s.amount, req.currency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-slate-300">—</span>
        ),
    },
    {
      key: 'lender',
      label: 'Lender',
      render: (_v, req) =>
        req.lender?.name ? (
          <p className="text-xs font-semibold text-slate-700">{req.lender.name}</p>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Auto-assigned</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, req) => <StatusBadge loan={req} />,
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (_v, req) => (
        <p className="text-sm text-slate-600 font-medium whitespace-nowrap">
          {req.due_date ? new Date(req.due_date).toLocaleDateString() : '—'}
        </p>
      ),
    },
    {
      key: 'created_at',
      label: 'Submitted',
      render: (_v, req) => (
        <p className="text-sm text-slate-600 font-medium whitespace-nowrap">
          {new Date(req.created_at).toLocaleDateString()}
        </p>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      alwaysVisible: true,
      hideable: false,
      render: (_v, req) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedLoan(req)}
            title="View loan details & terms"
            className="p-2 rounded-xl bg-slate-100 hover:bg-[#345E85] hover:text-white text-slate-500 transition-all"
          >
            <FileText size={13} />
          </button>
          {(() => {
            const wf = buildLoanWorkflowView(req);
            if (wf.awaiting_borrower_response) {
              return (
                <button
                  onClick={() => setAcceptLoanId(req.id)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all ${
                    wf.is_partial_offer
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-[#345E85] hover:bg-[#2a4d6d]'
                  }`}
                >
                  {wf.is_partial_offer ? 'Agree / Reject' : 'Review Terms'}
                </button>
              );
            }
            if (wf.can_appeal) {
              return (
                <button
                  onClick={() => setAppealLoan(req)}
                  className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white bg-violet-700 hover:bg-violet-800 transition-all"
                  title={req.rejection_reason || 'Appeal rejection'}
                >
                  Appeal / Comment
                </button>
              );
            }
            if (wf.has_open_appeal) {
              return (
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-1 rounded-lg">
                  Appeal sent
                </span>
              );
            }
            return null;
          })()}
          {req.status === 'rejected' && req.rejection_reason && (
            <span className="text-[10px] text-rose-500 font-semibold max-w-[120px] truncate" title={req.rejection_reason}>
              {req.rejection_reason}
            </span>
          )}
          {req.status === 'disbursed' && req.borrower_accepted_at && (
            <EnhancedRepayButton
              loanId={req.id}
              amount={req.approved_amount ?? req.requested_amount}
              interestAmount={req.interest_amount ?? 0}
              interestRate={req.interest_rate}
              currency={req.currency || 'RWF'}
              onRepaymentSuccess={onRefresh}
            />
          )}
        </div>
      ),
    },
  ], [fmtLoan, onRefresh]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 bg-gray-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            My Loan <span className="text-[#2c5173]">Requests</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Fleet financing & advance management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onRefresh} className="h-11 w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all">
            <RefreshCw size={16} />
          </button>
          <button onClick={onNewRequest}
            className="flex items-center gap-2 px-6 py-3 bg-[#2c5173] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1e3850] transition-all shadow-lg shadow-[#2c5173]/20 active:scale-95">
            <Plus size={14} /> Request Loan
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
        <input type="text" placeholder="Search by ID, purpose or status..."
          value={search} onChange={e => onSearchChange(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#2c5173]/10 focus:border-[#2c5173] transition-all shadow-sm" />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-3xl flex items-center gap-3">
          <AlertTriangle size={16} /> <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#2c5173]/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-[#2c5173]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Loan History</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{filtered.length} records</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 rounded-full border-4 border-slate-100 border-t-[#345E85] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <FileText size={24} className="text-slate-400" />
            </div>
            <p className="text-slate-900 font-black text-lg mb-1">No loan requests yet</p>
            <p className="text-slate-400 text-sm mb-6">Submit your first loan request to get started</p>
            <button onClick={onNewRequest}
              className="flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100">
              <Plus size={14} /> Request Loan
            </button>
          </div>
        ) : (
          <StandardDataTable<LoanRequest>
            embedded
            columns={loanHistoryColumns}
            data={filtered}
            getRowId={(row) => row.id}
            searchable={false}
            pagination={false}
            hoverable
            ariaLabel="Loan history"
          />
        )}
      </div>

      {selectedLoan && (
        <LoanDetailModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
        />
      )}

      {acceptLoanId && (
        <LoanTermsAcceptanceModal
          loanId={acceptLoanId}
          onClose={() => setAcceptLoanId(null)}
          onAccepted={() => { setAcceptLoanId(null); onRefresh(); }}
          onDeclined={() => { setAcceptLoanId(null); onRefresh(); }}
        />
      )}

      {appealLoan && (
        <LoanAppealModal
          loan={appealLoan}
          onClose={() => setAppealLoan(null)}
          onSuccess={() => { setAppealLoan(null); onRefresh(); }}
        />
      )}
    </div>
  );
};

const EnhancedLoanRequestsPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isTruckOwner = user?.role === 'TRUCK_OWNER' || user?.role === 'FLEET_OWNER';
  const isCargoOwner = user?.role === 'CARGO_OWNER';
  const isBorrower = isTruckOwner || isCargoOwner; // Both can request loans

  const deepLinkLoanId = searchParams.get('loan');
  const deepLinkAction = searchParams.get('action');
  const autoDisburseLoanId =
    deepLinkLoanId && (deepLinkAction === 'disburse' || deepLinkAction === 'revise')
      ? deepLinkLoanId
      : null;
  const autoReviewLoanId =
    deepLinkLoanId && deepLinkAction === 'review-offer'
      ? deepLinkLoanId
      : null;
  const autoAppealLoanId =
    deepLinkLoanId && deepLinkAction === 'appeal'
      ? deepLinkLoanId
      : null;

  useEffect(() => {
    // Clear one-shot deep-link params after the target modal has a chance to open
    if (!deepLinkLoanId) return;
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      next.delete('loan');
      next.delete('action');
      setSearchParams(next, { replace: true });
    }, 2500);
    return () => window.clearTimeout(t);
  }, [deepLinkLoanId]); // eslint-disable-line react-hooks/exhaustive-deps

  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [analytics, setAnalytics] = useState<LoanAnalytics | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy] = useState<'created_at' | 'requested_amount' | 'risk_score' | 'borrower_name'>('created_at');
  const [sortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'overdue'>('all');
  const [priorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [lenderFilter] = useState<'all' | string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<LoanRequest | null>(null);
  const [pendingApprovalPayload, setPendingApprovalPayload] = useState<{ approvedAmount: number; loanTermMonths: number; dueDate: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card' | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [truckOwnerPhone, setTruckOwnerPhone] = useState<string | null>(null);

  const [advancePaymentCalculations, setAdvancePaymentCalculations] = useState<Record<string, any>>({});
  const [loadingCalculations, setLoadingCalculations] = useState<Record<string, boolean>>({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<LoanRequest | null>(null);
  const [loanPayments, setLoanPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedLoanForPaymentDetails, setSelectedLoanForPaymentDetails] = useState<LoanRequest | null>(null);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);

  const lenderId = user?.id; // Dynamically use the logged-in user's ID

  const fetchAdvancePaymentCalculation = async (tripId: string, loanRequestId: string) => {
    if (!tripId || advancePaymentCalculations[loanRequestId] || loadingCalculations[loanRequestId]) return;
    setLoadingCalculations(prev => ({ ...prev, [loanRequestId]: true }));
    try {
      const response = await paymentsAPI.getAdvancePaymentCalculation(tripId);
      if (response.data?.success && response.data?.data) {
        const c = response.data.data;
        setAdvancePaymentCalculations(prev => ({
          ...prev,
          [loanRequestId]: {
            ...c,
            transportationFee: Number(c.transportationFee) || 0,
            advancePaymentPercentage: Number(c.advancePaymentPercentage) || 0,
            advanceAmount: Number(c.advanceAmount) || 0,
            finalAmount: Number(c.finalAmount) || 0,
            requireAdvancePayment: Boolean(c.requireAdvancePayment),
            currency: c.currency || 'USD',
          },
        }));
      }
    } catch {}
    finally { setLoadingCalculations(prev => ({ ...prev, [loanRequestId]: false })); }
  };

  const fetchTruckOwnerLoans = useCallback(async () => {
    if (!user?.tenantId || !accessToken) { setFetching(false); return; }
    setFetching(true); setError(null);
    try {
      // Use the dedicated my-loans endpoint for cargo owners (returns only their own loans)
      let raw: any[];
      if (isCargoOwner) {
        const res = await api.get('/lending/my-loans');
        raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      } else {
        const tenantRaw = await lendingApi.getTenantLoans(user.tenantId);
        raw = Array.isArray(tenantRaw) ? tenantRaw : ((tenantRaw as any)?.data || []);
      }
      const data: any[] = raw;

      // For non-cargo-owners, still filter by created_by
      const userLoans = isCargoOwner
        ? data
        : data.filter((req: any) => req.created_by === user.id || req.createdBy === user.id);

      // Enrich each loan with cargo and lender details in parallel
      const mapped: LoanRequest[] = await Promise.all(
        userLoans.map(async (req: any) => {
          let cargoLabel = '';
          let cargoType = 'General Cargo';
          let lenderName = '';

          // Fetch lender name if lender_id present
          const lenderId = req.lender_id || req.lenderId;
          if (lenderId) {
            try {
              const lr = await api.get(`/admin/lenders/${lenderId}`);
              lenderName = lr.data?.name || lr.data?.data?.name || '';
            } catch { /* non-critical */ }
          }

          return {
            id: req.id,
            cargo_id: req.cargo_id || req.cargoId || '',
            tenant_id: req.tenant_id || req.tenantId || '',
            trip_id: req.trip_id || req.tripId || '',
            requested_amount: Number(req.requested_amount || req.requestedAmount) || 0,
            approved_amount: req.approved_amount != null ? Number(req.approved_amount) : undefined,
            interest_amount: req.interest_amount != null ? Number(req.interest_amount) : (req.interestAmount != null ? Number(req.interestAmount) : undefined),
            currency: req.currency || 'RWF',
            status: req.status || 'pending',
            priority: 'medium' as const,
            created_at: req.created_at || req.createdAt || new Date().toISOString(),
            due_date: req.due_date || req.dueDate,
            // Use borrower relation if available, fall back to user context
            borrower_name: req.borrower?.contact_name || req.borrower?.company_name ||
              (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'You'),
            borrower_email: req.borrower?.email || user?.email || '',
            borrower_phone: req.borrower?.phone || (user as any)?.phone || '',
            cargo_type: cargoType,
            cargo_weight: 0,
            cargo_value: 0,
            pickup_location: 'N/A',
            delivery_location: 'N/A',
            distance: 0,
            estimated_duration: 0,
            risk_score: req.risk_score != null ? Number(req.risk_score) : null,
            credit_score: req.borrower?.credit_score ?? null,
            interest_rate: req.interest_rate != null ? Number(req.interest_rate) : null,
            purpose: req.metadata?.purpose || req.metadata?.note || cargoType,
            lender_id: lenderId,
            lender: lenderName ? { id: lenderId, name: lenderName, type: 'bank', email: '', phone: '' } : undefined,
            processing_fee: 0,
            total_amount: Number(req.requested_amount || req.requestedAmount) || 0,
            loan_term_months: req.loan_term_months || req.loanTermMonths || 12,
            borrower_company: req.borrower?.company_name || (cargoLabel ? `Load: ${cargoLabel}` : undefined),
            requested_split: req.requested_split || [],
            rejection_reason: req.rejection_reason || req.rejectionReason,
            terms_offered_at: req.terms_offered_at || req.termsOfferedAt || null,
            borrower_accepted_at: req.borrower_accepted_at || req.borrowerAcceptedAt || null,
            terms_declined_at: req.terms_declined_at || req.termsDeclinedAt || null,
            metadata: req.metadata,
            workflow_stage: req.workflow_stage,
            workflow_label: req.workflow_label,
            is_partial_offer: req.is_partial_offer,
            amount_reduction: req.amount_reduction,
            can_appeal: req.can_appeal,
            has_open_appeal: req.has_open_appeal,
            appeal_comment: req.appeal_comment,
          };
        })
      );

      setRequests(mapped);
      setAnalytics({
        totalRequests: mapped.length,
        pendingRequests:  mapped.filter(r => r.status === 'pending').length,
        approvedRequests: mapped.filter(r => r.status === 'approved').length,
        rejectedRequests: mapped.filter(r => r.status === 'rejected').length,
        totalAmountRequested: mapped.reduce((s, r) => s + r.requested_amount, 0),
        totalAmountApproved:  mapped.filter(r => r.status === 'approved').reduce((s, r) => s + (r.approved_amount ?? r.requested_amount), 0),
        averageAmount: mapped.length ? mapped.reduce((s, r) => s + r.requested_amount, 0) / mapped.length : 0,
        averageRiskScore: mapped.filter(r => r.risk_score != null).length > 0 ? mapped.filter(r => r.risk_score != null).reduce((s, r) => s + (r.risk_score ?? 0), 0) / mapped.filter(r => r.risk_score != null).length : null,
        approvalRate: mapped.length ? (mapped.filter(r => r.status === 'approved').length / mapped.length) * 100 : 0,
        monthlyGrowth: 0,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load loan requests.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setFetching(false);
    }
  }, [user, accessToken]);

  // Separate function for cargo owners to fetch their own loan requests
  const fetchCargoOwnerLoans = useCallback(async () => {
    if (!user?.tenantId || !accessToken || !user?.id) { setFetching(false); return; }
    setFetching(true); setError(null);
    try {
      // Use the dedicated my-loans endpoint — returns only this cargo owner's loans
      const res = await api.get('/lending/my-loans');
      const data: any[] = Array.isArray(res.data) ? res.data : (res.data?.data || []);

      // Enrich each loan with cargo and lender details in parallel
      const mapped: LoanRequest[] = await Promise.all(
        data.map(async (req: any) => {
          let cargoLabel = '';
          let cargoType = 'General Cargo';
          let lenderName = '';

          // Fetch lender name if lender_id present
          const lenderId = req.lender_id || req.lenderId;
          if (lenderId) {
            try {
              const lr = await api.get(`/admin/lenders/${lenderId}`);
              lenderName = lr.data?.name || lr.data?.data?.name || '';
            } catch { /* non-critical */ }
          }

          return {
            id: req.id,
            cargo_id: req.cargo_id || req.cargoId || '',
            tenant_id: req.tenant_id || req.tenantId || '',
            trip_id: req.trip_id || req.tripId || '',
            requested_amount: Number(req.requested_amount || req.requestedAmount) || 0,
            approved_amount: req.approved_amount != null ? Number(req.approved_amount) : undefined,
            interest_amount: req.interest_amount != null ? Number(req.interest_amount) : (req.interestAmount != null ? Number(req.interestAmount) : undefined),
            currency: req.currency || 'RWF',
            status: req.status || 'pending',
            priority: 'medium' as const,
            created_at: req.created_at || req.createdAt || new Date().toISOString(),
            due_date: req.due_date || req.dueDate,
            // Use borrower relation if available, fall back to user context
            borrower_name: req.borrower?.contact_name || req.borrower?.company_name ||
              (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'You'),
            borrower_email: req.borrower?.email || user?.email || '',
            borrower_phone: req.borrower?.phone || (user as any)?.phone || '',
            cargo_type: cargoType,
            cargo_weight: 0,
            cargo_value: 0,
            pickup_location: 'N/A',
            delivery_location: 'N/A',
            distance: 0,
            estimated_duration: 0,
            risk_score: req.risk_score != null ? Number(req.risk_score) : null,
            credit_score: req.borrower?.credit_score ?? null,
            interest_rate: req.interest_rate != null ? Number(req.interest_rate) : null,
            purpose: req.metadata?.purpose || req.metadata?.note || cargoType,
            lender_id: lenderId,
            lender: lenderName ? { id: lenderId, name: lenderName, type: 'bank', email: '', phone: '' } : undefined,
            processing_fee: 0,
            total_amount: Number(req.requested_amount || req.requestedAmount) || 0,
            loan_term_months: req.loan_term_months || req.loanTermMonths || 12,
            borrower_company: req.borrower?.company_name || (cargoLabel ? `Load: ${cargoLabel}` : undefined),
            requested_split: req.requested_split || [],
            rejection_reason: req.rejection_reason || req.rejectionReason,
            terms_offered_at: req.terms_offered_at || req.termsOfferedAt || null,
            borrower_accepted_at: req.borrower_accepted_at || req.borrowerAcceptedAt || null,
            terms_declined_at: req.terms_declined_at || req.termsDeclinedAt || null,
            metadata: req.metadata,
            workflow_stage: req.workflow_stage,
            workflow_label: req.workflow_label,
            is_partial_offer: req.is_partial_offer,
            amount_reduction: req.amount_reduction,
            can_appeal: req.can_appeal,
            has_open_appeal: req.has_open_appeal,
            appeal_comment: req.appeal_comment,
          };
        })
      );

      setRequests(mapped);
      setAnalytics({
        totalRequests: mapped.length,
        pendingRequests:  mapped.filter(r => r.status === 'pending').length,
        approvedRequests: mapped.filter(r => r.status === 'approved').length,
        rejectedRequests: mapped.filter(r => r.status === 'rejected').length,
        totalAmountRequested: mapped.reduce((s, r) => s + r.requested_amount, 0),
        totalAmountApproved:  mapped.filter(r => r.status === 'approved').reduce((s, r) => s + (r.approved_amount ?? r.requested_amount), 0),
        averageAmount: mapped.length ? mapped.reduce((s, r) => s + r.requested_amount, 0) / mapped.length : 0,
        averageRiskScore: mapped.filter(r => r.risk_score != null).length > 0 ? mapped.filter(r => r.risk_score != null).reduce((s, r) => s + (r.risk_score ?? 0), 0) / mapped.filter(r => r.risk_score != null).length : null,
        approvalRate: mapped.length ? (mapped.filter(r => r.status === 'approved').length / mapped.length) * 100 : 0,
        monthlyGrowth: 0,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load loan requests.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setFetching(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    // Call appropriate fetch function based on user role
    if (isTruckOwner) { 
      fetchTruckOwnerLoans(); 
      return; 
    }
    if (isCargoOwner) { 
      fetchCargoOwnerLoans(); 
      return; 
    }

    const fetchLoanRequests = async () => {
      if (!lenderId || !accessToken) { setFetching(false); return; }
      setFetching(true); setError(null);
      try {
        let actualLenderId = lenderId;
        try {
          const r = await api.get('/lending/my-lender-id');
          if (r.data?.lenderId) actualLenderId = r.data.lenderId;
        } catch {}

        const [requestsResponse, analyticsData] = await Promise.all([
          lendingApi.getLenderLoanRequests(actualLenderId, statusFilter !== 'all' ? statusFilter : undefined, 1, 100),
          lendingApi.getLenderAnalytics(actualLenderId, 12).catch(() => null),
        ]);

        const requestsData = Array.isArray(requestsResponse) ? requestsResponse : (requestsResponse?.data || requestsResponse || []);

        const transformedRequests: LoanRequest[] = await Promise.all(
          requestsData.map(async (req: any) => {
            let cargoData = null;
            
            // Fetch cargo data only for additional context (locations, cargo type, etc.)
            if (req.cargo_id || req.cargoId) {
              try {
                const cr = await api.get(`/loads-v2/${req.cargo_id || req.cargoId}`);
                if (cr.data) {
                  cargoData = cr.data;
                }
              } catch {}
            }
            
            // Use borrower data from API response (populated by backend with actual borrower)
            const borrower = req.borrower;
            const borrowerName = borrower?.contact_name || borrower?.company_name || 'Unknown Borrower';
            const borrowerEmail = borrower?.email || '';
            const borrowerPhone = borrower?.phone || '';
            const borrowerCompany = borrower?.company_name || '';
            
            const pickupLoc = cargoData?.locations?.find((l: any) => l.type === 'PICKUP') || cargoData?.origin;
            const deliveryLoc = cargoData?.locations?.find((l: any) => l.type === 'DELIVERY') || cargoData?.destination;
            const fmt = (loc: any) => !loc ? '' : typeof loc === 'string' ? loc : loc.address || loc.city || loc.name || '';
            return {
              id: req.id, cargo_id: req.cargo_id || req.cargoId, tenant_id: req.tenant_id || req.tenantId,
              trip_id: req.trip_id || req.tripId, requested_amount: req.requested_amount || req.requestedAmount || 0,
              approved_amount: req.approved_amount || req.approvedAmount,
              interest_amount: req.interest_amount != null ? Number(req.interest_amount) : (req.interestAmount != null ? Number(req.interestAmount) : undefined),
              currency: req.currency || 'RWF',
              status: req.status || 'pending',
              priority: req.priority || 'medium', created_at: req.created_at || req.createdAt,
              due_date: req.due_date || req.dueDate,
              borrower_name: borrowerName,
              borrower_email: borrowerEmail,
              borrower_phone: borrowerPhone,
              borrower_company: borrowerCompany,
              cargo_type: cargoData?.cargoType || req.cargoType || 'General Cargo',
              cargo_weight: cargoData?.weight || req.cargoWeight || 0,
              cargo_value: cargoData?.loadValue || req.cargoValue || 0,
              pickup_location: fmt(pickupLoc) || 'N/A', delivery_location: fmt(deliveryLoc) || 'N/A',
              risk_score: req.risk_score != null ? Number(req.risk_score) : (req.riskScore != null ? Number(req.riskScore) : null),
              credit_score: req.credit_score != null ? Number(req.credit_score) : (req.creditScore != null ? Number(req.creditScore) : (borrower?.credit_score ?? null)),
              interest_rate: req.interest_rate != null ? Number(req.interest_rate) : (req.interestRate != null ? Number(req.interestRate) : null),
              effective_annual_rate: req.effective_annual_rate != null ? Number(req.effective_annual_rate) : (req.effectiveAnnualRate != null ? Number(req.effectiveAnnualRate) : null),
              purpose: req.purpose || req.metadata?.purpose || 'Cargo financing',
              metadata: req.metadata,
              lender_id: req.lender_id || req.lenderId, processing_fee: req.processing_fee || req.processingFee || 0,
              total_amount: req.total_amount || req.totalAmount || 0, loan_term_months: req.loan_term_months || req.loanTermMonths || 12,
              distance: 0, estimated_duration: 0,
              terms_offered_at: req.terms_offered_at || req.termsOfferedAt || null,
              borrower_accepted_at: req.borrower_accepted_at || req.borrowerAcceptedAt || null,
              terms_declined_at: req.terms_declined_at || req.termsDeclinedAt || null,
              rejection_reason: req.rejection_reason || req.rejectionReason,
              workflow_stage: req.workflow_stage,
              workflow_label: req.workflow_label,
              is_partial_offer: req.is_partial_offer,
              amount_reduction: req.amount_reduction,
              can_appeal: req.can_appeal,
              has_open_appeal: req.has_open_appeal,
              appeal_comment: req.appeal_comment,
            };
          })
        );

        setRequests(transformedRequests);
        setAnalytics({
          totalRequests: analyticsData?.totalLoanRequests || transformedRequests.length,
          pendingRequests: transformedRequests.filter(r => r.status === 'pending').length,
          approvedRequests: transformedRequests.filter(r => r.status === 'approved').length,
          rejectedRequests: transformedRequests.filter(r => r.status === 'rejected').length,
          totalAmountRequested: transformedRequests.reduce((sum, r) => sum + r.requested_amount, 0),
          totalAmountApproved: transformedRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.requested_amount, 0),
          averageAmount: analyticsData?.averageLoanAmount || (transformedRequests.length > 0 ? transformedRequests.reduce((sum, r) => sum + r.requested_amount, 0) / transformedRequests.length : 0),
          averageRiskScore: analyticsData?.averageRiskScore ?? (transformedRequests.filter(r => r.risk_score != null).length > 0 ? transformedRequests.filter(r => r.risk_score != null).reduce((sum, r) => sum + (r.risk_score ?? 0), 0) / transformedRequests.filter(r => r.risk_score != null).length : null),
          approvalRate: analyticsData?.approvalRate || (transformedRequests.length > 0 ? (transformedRequests.filter(r => r.status === 'approved').length / transformedRequests.length) * 100 : 0),
          monthlyGrowth: analyticsData?.monthlyGrowthRate || 0,
        });
        transformedRequests.forEach(req => { if (req.trip_id) fetchAdvancePaymentCalculation(req.trip_id, req.id).catch(() => {}); });
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally { setFetching(false); }
    };
    fetchLoanRequests();
  }, [lenderId, accessToken, statusFilter, isTruckOwner, isCargoOwner, fetchTruckOwnerLoans, fetchCargoOwnerLoans]);

  const handleApproveLoan = async (_loanId: string, _payload: { approvedAmount: number; loanTermMonths: number; dueDate: string }) => {
    // LoanApprovalModal handles the full approve + disburse flow internally.
    // This callback is called on success — just refresh the list.
    try {
      let actualLenderId = lenderId;
      try { const r = await api.get('/lending/my-lender-id'); if (r.data?.lenderId) actualLenderId = r.data.lenderId; } catch {}
      const requestsResponse = await lendingApi.getLenderLoanRequests(actualLenderId!, undefined, 1, 100);
      const requestsData = Array.isArray(requestsResponse) ? requestsResponse : (requestsResponse?.data || []);
      setRequests(prev => prev.map(r => {
        const updated = requestsData.find((u: any) => u.id === r.id);
        if (!updated) return r;
        return {
          ...r,
          status: updated.status,
          approved_amount: updated.approved_amount ?? r.approved_amount,
          terms_offered_at: updated.terms_offered_at ?? r.terms_offered_at,
          borrower_accepted_at: updated.borrower_accepted_at ?? r.borrower_accepted_at,
          terms_declined_at: updated.terms_declined_at ?? r.terms_declined_at,
          metadata: updated.metadata ?? r.metadata,
          workflow_stage: updated.workflow_stage ?? r.workflow_stage,
          workflow_label: updated.workflow_label ?? r.workflow_label,
          is_partial_offer: updated.is_partial_offer ?? r.is_partial_offer,
          amount_reduction: updated.amount_reduction ?? r.amount_reduction,
          loan_term_months: updated.loan_term_months ?? r.loan_term_months,
        };
      }));
    } catch { /* non-fatal */ }
  };

  const handleRejectLoan = async (loanId: string, reason: string) => {
    try {
      await lendingApi.rejectLoanRequest(loanId, reason);
      setRequests(prev => prev.map(req => req.id === loanId ? { ...req, status: 'rejected' } : req));
    } catch (err: any) { alert('Failed to reject loan: ' + (err.message || 'Unknown error')); }
  };

  const fetchTruckOwnerPhoneNumber = async (loan: LoanRequest) => {
    try {
      const tripId = loan.trip_id;
      if (tripId) {
        const tripResp = await api.get(`/trips/${tripId}`);
        const trip = tripResp.data?.data || tripResp.data;
        const ownerId = trip?.assignedTruck?.ownerId || trip?.assignedTruck?.owner?.id;
        if (ownerId) {
          const profileResp = await api.get('/users/profile-by-id', { params: { userId: ownerId } });
          const profile = profileResp.data?.data?.profile || profileResp.data?.profile;
          const phone = profile?.preferences?.paymentInfo?.phoneNumber || profile?.phone || trip?.assignedTruck?.owner?.phone;
          if (phone) setTruckOwnerPhone(phone);
        }
      }
    } catch {}
  };

  const fetchLoanPayments = async (loanId: string) => {
    try {
      setLoadingPayments(true);
      const loan = requests.find(r => r.id === loanId);
      if (loan?.trip_id) {
        const resp = await api.get('/payments', { params: { tripId: loan.trip_id } });
        setLoanPayments(resp.data?.payments || resp.data?.data?.payments || []);
      }
    } catch {} finally { setLoadingPayments(false); }
  };

  const handleProcessPayment = async () => {
    if (!selectedLoanForPayment || !paymentMethod) return;
    if (paymentMethod === 'momo') {
      try {
        setProcessingPayment(true);
        if (!truckOwnerPhone) { alert('Phone number required'); return; }
        const amount = selectedLoanForPayment.approved_amount || selectedLoanForPayment.requested_amount;
        // Step 1: Disburse funds via mobile money
        const resp = await api.post('/payments/mobile-money/send', {
          receiverPhoneNumber: truckOwnerPhone.trim(), amount, currency: 'RWF',
          tripId: selectedLoanForPayment.trip_id,
          metadata: { isLenderPayment: true, lenderId: selectedLoanForPayment.lender_id, lenderName: user?.firstName || 'Lender', loanId: selectedLoanForPayment.id },
        });
        if (resp.data?.success) {
          // Step 2: Payment succeeded — now officially approve the loan
          if (pendingApprovalPayload) {
            await lendingApi.approveLoanRequest(selectedLoanForPayment.id, {
              approved_amount: pendingApprovalPayload.approvedAmount,
              due_date: pendingApprovalPayload.dueDate,
            });
          }
          // Step 3: Update UI
          setRequests(prev => prev.map(r =>
            r.id === selectedLoanForPayment.id
              ? { ...r, status: 'disbursed', approved_amount: pendingApprovalPayload?.approvedAmount ?? r.approved_amount }
              : r
          ));
          toast.success('Payment sent & loan approved!');
          setShowPaymentModal(false);
          setPendingApprovalPayload(null);
        }
      } catch (error: any) { toast.error('Payment failed: ' + (error.response?.data?.message || 'Error')); }
      finally { setProcessingPayment(false); }
    } else { alert('Card payment not implemented'); }
  };

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-1.5">Access Required</h2>
        <p className="text-sm text-gray-600">Please log in to access loan requests.</p>
      </div>
    </div>
  );

  const filtered = requests.filter(r => {
    const matchesSearch = r.borrower_name.toLowerCase().includes(search.toLowerCase()) ||
      r.borrower_company?.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchesLender = lenderFilter === 'all' || r.lender_id === lenderFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesLender;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'requested_amount') return (a.requested_amount - b.requested_amount) * dir;
    if (sortBy === 'borrower_name') return a.borrower_name.localeCompare(b.borrower_name) * dir;
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬ Truck Owner View Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // ══════════════════════════════════════════════════════════════════════════════
  // Borrower View (Truck Owner or Cargo Owner)
  // ══════════════════════════════════════════════════════════════════════════════
  if (isBorrower) {
    const refreshFunction = isTruckOwner ? fetchTruckOwnerLoans : fetchCargoOwnerLoans;
    
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <TruckOwnerLoanRequestsView
            requests={requests}
            analytics={analytics}
            loading={fetching}
            error={error}
            onNewRequest={() => setShowRequestForm(true)}
            onRefresh={refreshFunction}
            search={search}
            onSearchChange={setSearch}
            autoReviewLoanId={autoReviewLoanId}
            autoAppealLoanId={autoAppealLoanId}
          />
        </div>

        {showRequestForm && user?.tenantId && (
          <>
            {isCargoOwner ? (
              <CargoOwnerLoanRequestModal
                tenantId={user.tenantId}
                userId={user.id}
                onClose={() => setShowRequestForm(false)}
                onSuccess={refreshFunction}
              />
            ) : (
              <LoanRequestFormModal
                tenantId={user.tenantId}
                userId={user.id}
                onClose={() => setShowRequestForm(false)}
                onSuccess={refreshFunction}
              />
            )}
          </>
        )}
      </div>
    );
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Lender View Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (fetching) return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-3xl" />)}
      </div>
      <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
      {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 mb-8 bg-gray-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
              Loan <span className="text-[#2c5173]">Requests</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time financing workflow management</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-[#2c5173] transition-colors" />
              <input type="text" placeholder="SEARCH LOANS..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 dark:text-slate-300 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all w-64 lg:w-80" />
            </div>
          </div>
        </div>

        <LoanRequestsEnlite
          loading={fetching} requests={sorted} analytics={analytics}
          onApprove={handleApproveLoan} onReject={handleRejectLoan}
          onViewDetails={req => { setSelectedLoanForDetail(req); setShowDetailModal(true); }}
          onViewPaymentDetails={req => { setSelectedLoanForPaymentDetails(req); fetchLoanPayments(req.id); setShowPaymentDetailsModal(true); }}
          onExport={() => alert('Exporting...')}
          autoDisburseLoanId={autoDisburseLoanId}
        />
      </div>

      {/* Loan Detail Modal */}
      {showDetailModal && selectedLoanForDetail && (
        <LoanDetailModal
          loan={selectedLoanForDetail}
          onClose={() => { setShowDetailModal(false); setSelectedLoanForDetail(null); }}
        />
      )}
    </div>
  );
};

export default EnhancedLoanRequestsPage;






