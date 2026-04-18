import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Percent, CalendarDays, CircleDollarSign, ShieldCheck,
  TrendingUp, Edit, RefreshCw, CheckCircle, AlertTriangle,
  Info, X, Save,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Policy {
  id: string;
  lender_id: string;
  interest_rate: number;       // decimal 0–1  e.g. 0.15 = 15%
  repayment_term_days: number;
  max_advance_per_trip: number;
  max_exposure: number;
  advance_percentage: number;  // decimal 0–1  e.g. 0.7 = 70%
  created_at: string;
  updated_at: string;
}

interface FormState {
  interest_rate: string;
  repayment_term_days: string;
  max_advance_per_trip: string;
  max_exposure: string;
  advance_percentage: string;
}

const EMPTY_FORM: FormState = {
  interest_rate: '',
  repayment_term_days: '',
  max_advance_per_trip: '',
  max_exposure: '',
  advance_percentage: '70',
};

// ── Field config ──────────────────────────────────────────────────────────────
const FIELDS = [
  {
    key: 'interest_rate' as keyof FormState,
    label: 'Interest Rate',
    icon: <Percent size={16} />,
    iconColor: 'text-blue-600',
    bg: 'bg-blue-50',
    type: 'number',
    step: '0.01',
    min: '0.01',
    max: '100',
    placeholder: 'e.g. 15',
    hint: 'Annual interest rate as a percentage (e.g. 15 = 15%)',
    suffix: '%',
    required: true,
  },
  {
    key: 'repayment_term_days' as keyof FormState,
    label: 'Repayment Term',
    icon: <CalendarDays size={16} />,
    iconColor: 'text-emerald-600',
    bg: 'bg-emerald-50',
    type: 'number',
    step: '1',
    min: '1',
    max: '365',
    placeholder: 'e.g. 90',
    hint: 'Maximum number of days allowed for repayment',
    suffix: 'days',
    required: true,
  },
  {
    key: 'max_advance_per_trip' as keyof FormState,
    label: 'Max Advance Per Trip',
    icon: <CircleDollarSign size={16} />,
    iconColor: 'text-purple-600',
    bg: 'bg-purple-50',
    type: 'number',
    step: '100',
    min: '1',
    max: '1000000',
    placeholder: 'e.g. 50000',
    hint: 'Maximum loan amount allowed for a single trip',
    prefix: '$',
    required: true,
  },
  {
    key: 'max_exposure' as keyof FormState,
    label: 'Max Total Exposure',
    icon: <ShieldCheck size={16} />,
    iconColor: 'text-rose-600',
    bg: 'bg-rose-50',
    type: 'number',
    step: '1000',
    min: '1',
    max: '10000000',
    placeholder: 'e.g. 500000',
    hint: 'Maximum total outstanding loans at any time',
    prefix: '$',
    required: true,
  },
  {
    key: 'advance_percentage' as keyof FormState,
    label: 'Advance Percentage',
    icon: <TrendingUp size={16} />,
    iconColor: 'text-amber-600',
    bg: 'bg-amber-50',
    type: 'number',
    step: '1',
    min: '10',
    max: '100',
    placeholder: 'e.g. 70',
    hint: 'Percentage of trip value that can be advanced (default 70%)',
    suffix: '%',
    required: false,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number, prefix = '') =>
  `${prefix}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// ── Main component ────────────────────────────────────────────────────────────
const LenderPolicySettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [policy, setPolicy]       = useState<Policy | null>(null);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  // ── Fetch current policy ──────────────────────────────────────────────────
  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/lending/my-policy');
      setPolicy(res.data ?? null);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setPolicy(null); // no policy yet — that's fine
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to load policy');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPolicy(); }, [fetchPolicy]);

  // ── Open form pre-filled with current policy ──────────────────────────────
  const openForm = () => {
    if (policy) {
      setForm({
        interest_rate:       String(+(policy.interest_rate * 100).toFixed(4)),
        repayment_term_days: String(policy.repayment_term_days),
        max_advance_per_trip: String(policy.max_advance_per_trip),
        max_exposure:        String(policy.max_exposure),
        advance_percentage:  String(+(policy.advance_percentage * 100).toFixed(0)),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
    setSuccess(false);
    setShowForm(true);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const ir  = parseFloat(form.interest_rate);
    const rtd = parseInt(form.repayment_term_days);
    const map = parseFloat(form.max_advance_per_trip);
    const me  = parseFloat(form.max_exposure);
    const ap  = parseFloat(form.advance_percentage || '70');

    if (isNaN(ir) || ir <= 0 || ir > 100)  { setError('Interest rate must be between 0.01 and 100.'); return; }
    if (isNaN(rtd) || rtd < 1)             { setError('Repayment term must be at least 1 day.'); return; }
    if (isNaN(map) || map < 1)             { setError('Max advance per trip must be at least $1.'); return; }
    if (isNaN(me) || me < map)             { setError('Max exposure must be ≥ max advance per trip.'); return; }
    if (isNaN(ap) || ap < 10 || ap > 100) { setError('Advance percentage must be between 10 and 100.'); return; }

    try {
      setSaving(true);
      const res = await api.post('/lending/my-policy', {
        interest_rate:        ir / 100,       // store as decimal
        repayment_term_days:  rtd,
        max_advance_per_trip: map,
        max_exposure:         me,
        advance_percentage:   ap / 100,       // store as decimal
      });
      setPolicy(res.data);
      setSuccess(true);
      setTimeout(() => { setShowForm(false); setSuccess(false); }, 1500);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save policy.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!user) return null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-[#345E85] uppercase tracking-[0.2em] mb-1">Configuration</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lending Policy</h1>
          <p className="text-slate-400 text-sm mt-1">
            Define the terms under which you lend to truck owners
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPolicy}
            className="h-11 w-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openForm}
            className="flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100"
          >
            <Edit size={14} /> {policy ? 'Update Policy' : 'Create Policy'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && !showForm && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-3xl flex items-center gap-3">
          <AlertTriangle size={16} />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 animate-pulse">
              <div className="h-10 w-10 rounded-2xl bg-slate-100 mb-4" />
              <div className="h-7 w-24 bg-slate-100 rounded-xl mb-2" />
              <div className="h-3 w-32 bg-slate-50 rounded-lg" />
            </div>
          ))}
        </div>
      ) : policy ? (
        <>
          {/* Policy cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Interest Rate',
                value: `${(policy.interest_rate * 100).toFixed(2)}%`,
                sub: 'Annual rate applied to loans',
                icon: <Percent size={20} className="text-blue-600" />,
                bg: 'bg-blue-50',
              },
              {
                label: 'Repayment Term',
                value: `${policy.repayment_term_days} days`,
                sub: 'Maximum repayment window',
                icon: <CalendarDays size={20} className="text-emerald-600" />,
                bg: 'bg-emerald-50',
              },
              {
                label: 'Max Advance / Trip',
                value: fmt(policy.max_advance_per_trip, '$'),
                sub: 'Per-trip lending limit',
                icon: <CircleDollarSign size={20} className="text-purple-600" />,
                bg: 'bg-purple-50',
              },
              {
                label: 'Max Total Exposure',
                value: fmt(policy.max_exposure, '$'),
                sub: 'Total outstanding cap',
                icon: <ShieldCheck size={20} className="text-rose-600" />,
                bg: 'bg-rose-50',
              },
              {
                label: 'Advance Percentage',
                value: `${(policy.advance_percentage * 100).toFixed(0)}%`,
                sub: 'Of trip value advanced',
                icon: <TrendingUp size={20} className="text-amber-600" />,
                bg: 'bg-amber-50',
              },
            ].map(({ label, value, sub, icon, bg }) => (
              <div key={label} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-11 w-11 rounded-2xl ${bg} flex items-center justify-center mb-4`}>
                  {icon}
                </div>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center gap-3">
            <Info size={14} className="text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              Policy last updated: <span className="font-semibold text-slate-700">{new Date(policy.updated_at).toLocaleString()}</span>
              &nbsp;·&nbsp; ID: <span className="font-mono text-slate-500">{policy.id.slice(0, 8)}…</span>
            </p>
          </div>
        </>
      ) : (
        /* No policy yet */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
            <ShieldCheck size={28} className="text-amber-500" />
          </div>
          <p className="text-slate-900 font-black text-lg mb-2">No Policy Configured</p>
          <p className="text-slate-400 text-sm max-w-sm mb-6">
            You need to set a lending policy before loan requests can be automatically assigned to you.
          </p>
          <button
            onClick={openForm}
            className="flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100"
          >
            <Edit size={14} /> Create Policy
          </button>
        </div>
      )}

      {/* ── Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden my-auto">

            {/* Modal header */}
            <div className="bg-[#345E85] px-8 py-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Lending Configuration</p>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {policy ? 'Update Policy' : 'Create Policy'}
                </h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    {f.label}
                    {f.required
                      ? <span className="text-rose-400 ml-1">*</span>
                      : <span className="text-slate-300 normal-case font-medium ml-1">(optional)</span>
                    }
                  </label>
                  <div className="relative">
                    {/* Icon */}
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${f.iconColor}`}>
                      {f.icon}
                    </div>
                    {/* Prefix ($) */}
                    {f.prefix && (
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                        {f.prefix}
                      </span>
                    )}
                    <input
                      type={f.type}
                      step={f.step}
                      min={f.min}
                      max={f.max}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      required={f.required}
                      className={`w-full py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all
                        ${f.prefix ? 'pl-14 pr-12' : 'pl-10 pr-12'}`}
                    />
                    {/* Suffix (% / days) */}
                    {f.suffix && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                        {f.suffix}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{f.hint}</p>
                </div>
              ))}

              {/* Error / Success */}
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
                  <CheckCircle size={14} className="flex-shrink-0" /> Policy saved successfully!
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || success}
                  className="flex-1 py-3 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <><RefreshCw size={12} className="animate-spin" /> Saving…</>
                    : <><Save size={12} /> Save Policy</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LenderPolicySettingsPage;
