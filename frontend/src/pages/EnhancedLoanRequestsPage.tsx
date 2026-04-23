import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { lendingApi } from '../services/lending/lendingApi';
import type { CreateLoanRequestDto } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import api, { paymentsAPI } from '../services/api';
import { fleetApi } from '../services/fleetApi';
import { FaSearch, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import {
  X, DollarSign, Clock, CheckCircle, AlertTriangle, FileText,
  RefreshCw, ChevronDown, Landmark, CalendarDays, CircleDollarSign,
  Plus, TrendingUp, Banknote, Package, MapPin, Loader2, Info,
} from 'lucide-react';
import LoanRequestsEnlite from '../components/LenderDashboard/LoanRequests.enlite.tsx';
import LoanDetailModal from '../components/LenderDashboard/LoanDetailModal';

interface Lender { id: string; name: string; type: string; email: string; phone: string; }
interface LoanRequest {
  id: string; cargo_id: string; tenant_id: string; trip_id: string;
  requested_amount: number; approved_amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string; due_date?: string;
  borrower_name: string; borrower_email: string; borrower_phone: string; borrower_company?: string;
  cargo_type: string; cargo_weight: number; cargo_value: number;
  pickup_location: string; delivery_location: string; distance: number; estimated_duration: number;
  risk_score?: number; credit_score: number; interest_rate: number;
  collateral_type?: string; collateral_value?: number; purpose: string;
  lender_id?: string; lender?: Lender; processing_fee: number; total_amount: number;
  monthly_payment?: number; loan_term_months: number;
  requested_split?: Array<{ type: string; id: string; amount: number }>;
}
interface LoanAnalytics {
  totalRequests: number; pendingRequests: number; approvedRequests: number; rejectedRequests: number;
  totalAmountRequested: number; totalAmountApproved: number; averageAmount: number;
  averageRiskScore: number; approvalRate: number; monthlyGrowth: number;
}

const BENEFICIARY_TYPES = ['fuel', 'driver', 'maintenance', 'tolls', 'truck_owner', 'other'] as const;

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, { cls: string; icon: React.ReactNode }> = {
    pending:   { cls: 'bg-amber-50 text-amber-700 border-amber-200',       icon: <Clock size={10} /> },
    approved:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle size={10} /> },
    rejected:  { cls: 'bg-rose-50 text-rose-700 border-rose-200',          icon: <X size={10} /> },
    disbursed: { cls: 'bg-blue-50 text-blue-700 border-blue-200',          icon: <DollarSign size={10} /> },
    repaid:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle size={10} /> },
    defaulted: { cls: 'bg-rose-100 text-rose-700 border-rose-200',         icon: <AlertTriangle size={10} /> },
    failed:    { cls: 'bg-slate-100 text-slate-600 border-slate-200',      icon: <AlertTriangle size={10} /> },
  };
  const { cls, icon } = cfg[status?.toLowerCase()] ?? { cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: <FileText size={10} /> };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>
      {icon} {status}
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
  const [trips, setTrips] = useState<any[]>([]);
  const [loadingLenders, setLoadingLenders] = useState(true);
  const [loadingCargos, setLoadingCargos] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(false);
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

  useEffect(() => {
    // Fetch lenders
    lendingApi.getTenantLenders()
      .then(data => setLenders(Array.isArray(data) ? data : []))
      .catch(() => setLenders([]))
      .finally(() => setLoadingLenders(false));

    // Fetch cargo owner's cargos/loads
    setLoadingCargos(true);
    console.log('🔍 Fetching cargos for cargo owner, userId:', userId);
    api.get('/loads', { params: { page: 1, limit: 50 } })
      .then(res => {
        console.log('📦 /loads Response:', res.data);
        // FIXED: The response has 'items' not 'data' or 'loads'
        const raw = res.data?.items || res.data?.data || res.data?.loads || res.data || [];
        console.log('📦 Raw cargos array:', raw);
        let cargosList = Array.isArray(raw) ? raw : [];
        console.log('📦 Total cargos before filter:', cargosList.length);
        
        // Log first cargo to see its structure
        if (cargosList.length > 0) {
          console.log('📦 Sample cargo object:', cargosList[0]);
          console.log('📦 Cargo owner ID:', cargosList[0].cargoOwner?.id);
          console.log('📦 Current user ID:', userId);
        }
        
        // Filter by cargo owner's user ID - check cargoOwner.id
        cargosList = cargosList.filter((cargo: any) => {
          const match = cargo.cargoOwner?.id === userId ||
                       cargo.createdBy === userId || 
                       cargo.created_by === userId ||
                       cargo.ownerId === userId ||
                       cargo.owner_id === userId ||
                       cargo.userId === userId ||
                       cargo.user_id === userId;
          if (match) {
            console.log('✅ Matched cargo:', cargo.id, cargo);
          }
          return match;
        });
        
        console.log('📦 Filtered cargos for user:', cargosList.length, cargosList);
        setCargos(cargosList);
      })
      .catch((err) => {
        console.error('❌ Error fetching cargos:', err);
        console.error('❌ Error response:', err.response?.data);
        setCargos([]);
      })
      .finally(() => setLoadingCargos(false));
  }, [userId]);

  // Auto-fetch and auto-select trip when cargo is selected (CargoOwner modal)
  useEffect(() => {
    if (!form.cargo_id) { setTrips([]); setForm(p => ({ ...p, trip_id: '' })); return; }
    setLoadingTrips(true);
    api.get('/trips', { params: { loadId: form.cargo_id, limit: 50 } })
      .then(res => {
        const raw = res.data?.data || res.data?.trips || res.data || [];
        const tripsList = Array.isArray(raw) ? raw : [];
        setTrips(tripsList);
        // Auto-select: if only one trip exists, pick it automatically
        if (tripsList.length === 1) {
          setForm(p => ({ ...p, trip_id: tripsList[0].id }));
        } else if (tripsList.length > 1) {
          // Auto-select the most recent active trip
          const activeTrip = tripsList.find((t: any) => t.status === 'active' || t.status === 'in_progress')
            || tripsList[0];
          setForm(p => ({ ...p, trip_id: activeTrip.id }));
        }
      })
      .catch(() => setTrips([]))
      .finally(() => setLoadingTrips(false));
  }, [form.cargo_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(form.requested_amount);
    if (!amount || amount <= 0) { setError('Enter a valid loan amount.'); return; }
    if (amount > 50000) { setError('Maximum loan amount is $50,000.'); return; }
    if (!form.cargo_id) { setError('Please select a cargo.'); return; }
    if (!form.trip_id) { setError('Please select a trip.'); return; }
    if (!form.beneficiary_id.trim()) { setError('Please enter a beneficiary.'); return; }
    
    const payload: CreateLoanRequestDto = {
      tenant_id: tenantId,
      cargo_id: form.cargo_id,
      trip_id: form.trip_id,
      requested_amount: amount,
      created_by: userId,
      requested_split: [{ type: form.beneficiary_type, id: form.beneficiary_id.trim(), amount }],
      ...(form.lender_id && { lender_id: form.lender_id }),
      ...(form.due_date && { due_date: form.due_date }),
      metadata: { purpose: form.purpose || form.beneficiary_type },
    };
    
    try {
      setSubmitting(true);
      await lendingApi.createLoanRequest(payload);
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit loan request.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
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
                <option value="">{loadingCargos ? 'Loading your cargos…' : cargos.length === 0 ? 'No cargos found' : 'Select your cargo'}</option>
                {cargos.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.loadNumber || c.id.slice(0, 8)} — {c.cargoType || 'Cargo'}{c.origin?.city ? ' · ' + (typeof c.origin.city === 'object' ? (c.origin.city.name || c.origin.city.address || '') : c.origin.city) : ''}
                  </option>
                ))}
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
          </div>

          {/* Trip */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Trip <span className="text-rose-400">*</span>
              {trips.length === 1 && form.trip_id && (
                <span className="ml-2 text-emerald-500 normal-case font-semibold tracking-normal">✓ Auto-selected</span>
              )}
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              {loadingTrips && <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10" />}
              <select value={form.trip_id}
                onChange={e => setForm(p => ({ ...p, trip_id: e.target.value }))}
                className={selectCls(true)} disabled={!form.cargo_id || loadingTrips} required>
                <option value="">{!form.cargo_id ? 'Select a cargo first' : loadingTrips ? 'Loading trips…' : trips.length === 0 ? 'No trips found for this cargo' : 'Select a trip'}</option>
                {trips.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.tripNumber || t.id.slice(0, 8)} — {t.status || 'Trip'}{t.createdAt ? ' · ' + new Date(t.createdAt).toLocaleDateString() : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            </div>
            {trips.length > 1 && (
              <p className="text-[10px] text-amber-500 mt-1 font-semibold">
                {trips.length} trips found — most recent auto-selected, you can change it
              </p>
            )}
            {form.cargo_id && !loadingTrips && trips.length === 0 && (
              <p className="text-[10px] text-rose-500 mt-1 font-semibold">
                No trips found for this cargo. A trip must exist before requesting a loan.
              </p>
            )}
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
                  <option value="truck_owner">🚛 Truck Owner Payment</option>
                  <option value="other">📦 Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Beneficiary Reference <span className="text-rose-400">*</span></label>
              <input type="text" value={form.beneficiary_id}
                onChange={e => setForm(p => ({ ...p, beneficiary_id: e.target.value }))}
                placeholder={
                  form.beneficiary_type === 'fuel' ? 'Fuel supplier ID or account' : 
                  form.beneficiary_type === 'tolls' ? 'Toll account ID' : 
                  form.beneficiary_type === 'truck_owner' ? 'Truck owner ID or company name' :
                  'Beneficiary ID or reference'
                }
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all"
                required />
            </div>
          </div>

          {/* Lender */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preferred Lender <span className="text-slate-300 normal-case font-medium">(optional)</span></label>
            <div className="relative">
              <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              {loadingLenders && <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10" />}
              <select value={form.lender_id} onChange={e => setForm(p => ({ ...p, lender_id: e.target.value }))}
                className={selectCls(true)} disabled={loadingLenders}>
                <option value="">{loadingLenders ? 'Loading lenders…' : 'Any available lender'}</option>
                {lenders.map((l: any) => <option key={l.id} value={l.id}>{l.name}{l.contact_email ? ' — ' + l.contact_email : ''}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            </div>
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
    
    // Fetch loads based on user role
    const isCargoOwner = user?.role === 'CARGO_OWNER';
    const loadsEndpoint = isCargoOwner ? '/loads-v2' : '/loads-v2/assigned-loads';
    
    api.get(loadsEndpoint)
      .then(res => {
        const raw = res.data?.data || res.data?.loads || res.data || [];
        let loadsList = Array.isArray(raw) ? raw : [];
        
        // For cargo owners, filter by created_by or ownerId
        if (isCargoOwner && userId) {
          loadsList = loadsList.filter((load: any) => 
            load.created_by === userId || 
            load.createdBy === userId ||
            load.owner_id === userId ||
            load.ownerId === userId
          );
        }
        
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
        setTrips(tripsList);
        // Auto-select: if only one trip exists, pick it automatically
        if (tripsList.length === 1) {
          setForm(p => ({ ...p, trip_id: tripsList[0].id }));
        } else if (tripsList.length > 1) {
          // Auto-select the most recent active trip
          const activeTrip = tripsList.find((t: any) => t.status === 'active' || t.status === 'in_progress')
            || tripsList[0];
          setForm(p => ({ ...p, trip_id: activeTrip.id }));
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
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit loan request.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
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
                <option value="">{loadingLoads ? 'Loading loads…' : loads.length === 0 ? 'No assigned loads found' : 'Select a load'}</option>
                {loads.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.loadNumber || l.id.slice(0, 8)} — {l.cargoType || 'Cargo'}{l.origin?.city ? ' · ' + (typeof l.origin.city === 'object' ? (l.origin.city.name || l.origin.city.address || '') : l.origin.city) : ''}
                  </option>
                ))}
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
                <option value="">{!form.cargo_id ? 'Select a load first' : loadingTrips ? 'Loading trips…' : trips.length === 0 ? 'No trips found for this load' : 'Select a trip'}</option>
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Preferred Lender <span className="text-slate-300 normal-case font-medium">(optional)</span></label>
            <div className="relative">
              <Landmark size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              {loadingLenders && <Loader2 size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none z-10" />}
              <select value={form.lender_id} onChange={e => setForm(p => ({ ...p, lender_id: e.target.value }))}
                className={selectCls(true)} disabled={loadingLenders}>
                <option value="">{loadingLenders ? 'Loading lenders…' : 'Any available lender'}</option>
                {lenders.map((l: any) => <option key={l.id} value={l.id}>{l.name}{l.contact_email ? ' — ' + l.contact_email : ''}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            </div>
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

const TruckOwnerLoanRequestsView: React.FC<{
  requests: LoanRequest[];
  analytics: LoanAnalytics | null;
  loading: boolean;
  error: string | null;
  onNewRequest: () => void;
  onRefresh: () => void;
  search: string;
  onSearchChange: (v: string) => void;
}> = ({ requests, analytics, loading, error, onNewRequest, onRefresh, search, onSearchChange }) => {
  const filtered = requests.filter(r =>
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.purpose?.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: 'Total Requests', value: analytics?.totalRequests ?? 0, icon: FileText, color: 'text-[#345E85]', bg: 'bg-blue-50' },
    { label: 'Pending', value: analytics?.pendingRequests ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Approved', value: analytics?.approvedRequests ?? 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Requested', value: `$${((analytics?.totalAmountRequested ?? 0) / 1000).toFixed(1)}K`, icon: Banknote, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            My Loan <span className="text-[#345E85]">Requests</span>
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
            className="flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100 active:scale-95">
            <Plus size={14} /> Request Loan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-3xl border border-slate-100 p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
        <input type="text" placeholder="Search by ID, purpose or status..."
          value={search} onChange={e => onSearchChange(e.target.value)}
          className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] transition-all shadow-sm" />
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
            <div className="h-8 w-8 rounded-xl bg-[#345E85]/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-[#345E85]" />
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Loan ID', 'Amount', 'Purpose', 'Fund Split', 'Lender', 'Status', 'Due Date', 'Submitted'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">

                    {/* Loan ID */}
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900 font-mono">{req.id.slice(0, 8)}…</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {req.trip_id ? `Trip: ${req.trip_id.slice(0, 8)}…` : '—'}
                      </p>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">${req.requested_amount.toLocaleString()}</p>
                      {req.approved_amount != null && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                          ✓ Approved: ${req.approved_amount.toLocaleString()}
                        </p>
                      )}
                    </td>

                    {/* Purpose — from metadata.purpose */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700 capitalize">
                        {req.purpose || 'Fleet financing'}
                      </p>
                    </td>

                    {/* Fund Split — from requested_split array */}
                    <td className="px-6 py-4">
                      {req.requested_split && req.requested_split.length > 0 ? (
                        <div className="space-y-1">
                          {req.requested_split.map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                                {s.type}
                              </span>
                              <span className="text-xs font-bold text-slate-800">${s.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300">—</span>
                      )}
                    </td>

                    {/* Lender */}
                    <td className="px-6 py-4">
                      {req.lender?.name ? (
                        <p className="text-xs font-semibold text-slate-700">{req.lender.name}</p>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Auto-assigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>

                    {/* Due Date */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 font-medium whitespace-nowrap">
                        {req.due_date ? new Date(req.due_date).toLocaleDateString() : '—'}
                      </p>
                    </td>

                    {/* Submitted */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 font-medium whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const EnhancedLoanRequestsPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const isTruckOwner = user?.role === 'TRUCK_OWNER' || user?.role === 'FLEET_OWNER';
  const isCargoOwner = user?.role === 'CARGO_OWNER';
  const isBorrower = isTruckOwner || isCargoOwner; // Both can request loans

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
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card' | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [truckOwnerPhone, setTruckOwnerPhone] = useState<string | null>(null);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [selectedLoanForPaymentDetails, setSelectedLoanForPaymentDetails] = useState<LoanRequest | null>(null);
  const [loanPayments, setLoanPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [advancePaymentCalculations, setAdvancePaymentCalculations] = useState<Record<string, any>>({});
  const [loadingCalculations, setLoadingCalculations] = useState<Record<string, boolean>>({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<LoanRequest | null>(null);

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
      const raw = await lendingApi.getTenantLoans(user.tenantId);
      const data: any[] = Array.isArray(raw) ? raw : ((raw as any)?.data || []);

      // Filter by created_by for the current user (only their own requests)
      const userLoans = data.filter((req: any) => 
        req.created_by === user.id || req.createdBy === user.id
      );

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
            risk_score: 50,
            credit_score: req.borrower?.credit_score || 600,
            interest_rate: req.interest_rate || req.interestRate || 10,
            purpose: req.metadata?.purpose || req.metadata?.note || cargoType,
            lender_id: lenderId,
            lender: lenderName ? { id: lenderId, name: lenderName, type: 'bank', email: '', phone: '' } : undefined,
            processing_fee: 0,
            total_amount: Number(req.requested_amount || req.requestedAmount) || 0,
            loan_term_months: 12,
            borrower_company: req.borrower?.company_name || (cargoLabel ? `Load: ${cargoLabel}` : undefined),
            requested_split: req.requested_split || [],
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
        averageRiskScore: 50,
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
      const raw = await lendingApi.getTenantLoans(user.tenantId);
      const data: any[] = Array.isArray(raw) ? raw : ((raw as any)?.data || []);

      // CRITICAL: Filter by created_by to show only cargo owner's own requests
      const cargoOwnerLoans = data.filter((req: any) => 
        (req.created_by === user.id || req.createdBy === user.id)
      );

      // Enrich each loan with cargo and lender details in parallel
      const mapped: LoanRequest[] = await Promise.all(
        cargoOwnerLoans.map(async (req: any) => {
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
            risk_score: 50,
            credit_score: req.borrower?.credit_score || 600,
            interest_rate: req.interest_rate || req.interestRate || 10,
            purpose: req.metadata?.purpose || req.metadata?.note || cargoType,
            lender_id: lenderId,
            lender: lenderName ? { id: lenderId, name: lenderName, type: 'bank', email: '', phone: '' } : undefined,
            processing_fee: 0,
            total_amount: Number(req.requested_amount || req.requestedAmount) || 0,
            loan_term_months: 12,
            borrower_company: req.borrower?.company_name || (cargoLabel ? `Load: ${cargoLabel}` : undefined),
            requested_split: req.requested_split || [],
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
        averageRiskScore: 50,
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
          lendingApi.getLenderAnalytics(actualLenderId, '12months').catch(() => null),
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
              approved_amount: req.approved_amount || req.approvedAmount, status: req.status || 'pending',
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
              risk_score: req.risk_score || req.riskScore || 50, credit_score: req.credit_score || req.creditScore || borrower?.credit_score || 600,
              interest_rate: req.interest_rate || req.interestRate || 10, 
              purpose: req.purpose || req.metadata?.purpose || 'Cargo financing',
              metadata: req.metadata,
              lender_id: req.lender_id || req.lenderId, processing_fee: req.processing_fee || req.processingFee || 0,
              total_amount: req.total_amount || req.totalAmount || 0, loan_term_months: req.loan_term_months || req.loanTermMonths || 12,
              distance: 0, estimated_duration: 0,
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
          averageRiskScore: analyticsData?.averageRiskScore || 50,
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

  const handleApproveLoan = async (loanId: string, approvedAmount: number, interestRate: number) => {
    try {
      await lendingApi.approveLoanRequest(loanId, { approved_amount: approvedAmount, interest_rate: interestRate });
      setRequests(prev => prev.map(req => req.id === loanId ? { ...req, status: 'approved' } : req));
      const loan = requests.find(r => r.id === loanId);
      if (loan) { setSelectedLoanForPayment({ ...loan, status: 'approved' }); setShowPaymentModal(true); fetchTruckOwnerPhoneNumber(loan); }
    } catch (err: any) { alert('Failed to approve loan: ' + (err.message || 'Unknown error')); }
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
        const resp = await api.post('/payments/mobile-money/send', {
          receiverPhoneNumber: truckOwnerPhone.trim(), amount, currency: 'RWF',
          tripId: selectedLoanForPayment.trip_id,
          metadata: { isLenderPayment: true, lenderId: selectedLoanForPayment.lender_id, lenderName: user?.firstName || 'Lender', loanId: selectedLoanForPayment.id },
        });
        if (resp.data?.success) {
          alert('Payment initiated!');
          setShowPaymentModal(false);
          setRequests(prev => prev.map(r => r.id === selectedLoanForPayment.id ? { ...r, status: 'disbursed' } : r));
        }
      } catch (error: any) { alert('Payment failed: ' + (error.response?.data?.message || 'Error')); }
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 mb-8">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
              Loan <span className="text-[#345E85] dark:text-blue-400">Requests</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time financing workflow management</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-[#345E85] transition-colors" />
              <input type="text" placeholder="SEARCH LOANS..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 dark:text-slate-300 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all w-64 lg:w-80" />
            </div>
          </div>
        </div>

        <LoanRequestsEnlite
          loading={fetching} requests={sorted} analytics={analytics}
          onApprove={handleApproveLoan} onReject={handleRejectLoan}
          onViewDetails={req => { setSelectedLoanForDetail(req); setShowDetailModal(true); }}
          onProcessPayment={req => { setSelectedLoanForPayment(req); setShowPaymentModal(true); fetchTruckOwnerPhoneNumber(req); }}
          onViewPaymentDetails={req => { setSelectedLoanForPaymentDetails(req); fetchLoanPayments(req.id); setShowPaymentDetailsModal(true); }}
          onExport={() => alert('Exporting...')}
        />
      </div>

      {showPaymentModal && selectedLoanForPayment && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-8 overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Complete <span className="text-blue-600">Payment</span></h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 rounded-xl"><FaTimes size={18} /></button>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Disbursement Amount</p>
                <p className="text-3xl font-black text-slate-900">RWF {selectedLoanForPayment.requested_amount.toLocaleString()}</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => setPaymentMethod('momo')}
                  className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${paymentMethod === 'momo' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'momo' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <FaMoneyBillWave size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 text-sm uppercase">Mobile Money</p>
                    <p className="text-[10px] text-slate-500 font-medium">Instant transfer to truck owner</p>
                  </div>
                </button>
                {paymentMethod === 'momo' && (
                  <div className="mt-4">
                    <input type="text" value={truckOwnerPhone || ''} onChange={e => setTruckOwnerPhone(e.target.value)}
                      placeholder="Enter Momo Phone Number"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all" />
                  </div>
                )}
                <div className="flex gap-3 mt-8">
                  <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                  <button onClick={handleProcessPayment} disabled={!paymentMethod || processingPayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all">
                    {processingPayment ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

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






