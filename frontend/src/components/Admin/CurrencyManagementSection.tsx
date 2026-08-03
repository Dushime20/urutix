import React, { useState, useMemo } from 'react';
import {
  DollarSign, Plus, RefreshCw, TrendingUp, Search, X, Edit, Trash2, Check,
  Globe, Lock, Eye, EyeOff,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import currencyApi from '../../services/currencyApi';
import type {
  AdminCurrency,
  CreateCurrencyPayload,
  UpdateCurrencyPayload,
} from '../../services/currencyApi';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
import { StandardDataTable, type Column, type TableAction } from '../EnliteUI/Tables';

interface CurrencyFormState {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
  flag: string;
  isActive: boolean;
  manualRate: string;
}

const EMPTY_CURRENCY_FORM: CurrencyFormState = {
  code: '', name: '', symbol: '', locale: 'en-US',
  decimals: 2, flag: '🏳', isActive: true, manualRate: '',
};

export const CurrencyManagementSection: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState<AdminCurrency | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCurrency | null>(null);
  const [viewTarget, setViewTarget]     = useState<AdminCurrency | null>(null);
  const [form, setForm]                 = useState<CurrencyFormState>(EMPTY_CURRENCY_FORM);

  const { data: currencies = [], isLoading } = useQuery<AdminCurrency[]>({
    queryKey: ['admin-currencies'],
    queryFn: () => currencyApi.adminGetAll(),
  });

  const { data: ratesData } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => currencyApi.getRates(),
    staleTime: 60 * 60 * 1000,
  });
  const rates = ratesData?.rates ?? {};

  const { mutate: createCurrency, isPending: isCreating } = useMutation({
    mutationFn: (p: CreateCurrencyPayload) => currencyApi.adminCreate(p),
    onSuccess: c => {
      qc.invalidateQueries({ queryKey: ['admin-currencies'] });
      qc.invalidateQueries({ queryKey: ['supported-currencies'] });
      toast.success(`Currency '${c.code}' created`);
      setShowCreate(false); setForm(EMPTY_CURRENCY_FORM);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to create currency'),
  });

  const { mutate: updateCurrency, isPending: isUpdating } = useMutation({
    mutationFn: ({ code, payload }: { code: string; payload: UpdateCurrencyPayload }) =>
      currencyApi.adminUpdate(code, payload),
    onSuccess: c => {
      qc.invalidateQueries({ queryKey: ['admin-currencies'] });
      qc.invalidateQueries({ queryKey: ['supported-currencies'] });
      qc.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success(`Currency '${c.code}' updated`);
      setEditTarget(null); setForm(EMPTY_CURRENCY_FORM);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to update currency'),
  });

  const { mutate: deleteCurrency, isPending: isDeleting } = useMutation({
    mutationFn: (code: string) => currencyApi.adminDelete(code),
    onSuccess: (_, code) => {
      qc.invalidateQueries({ queryKey: ['admin-currencies'] });
      qc.invalidateQueries({ queryKey: ['supported-currencies'] });
      toast.success(`Currency '${code}' deleted`);
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Failed to delete currency'),
  });

  const { mutate: refreshRates, isPending: isRefreshing } = useMutation({
    mutationFn: () => currencyApi.forceRefresh(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('Rates refreshed from external provider');
    },
    onError: (err: any) => toast.error(getApiErrorMessage(err)),
  });

  const toggleActive = (c: AdminCurrency) =>
    updateCurrency({ code: c.code, payload: { isActive: !c.isActive } });

  const openEdit = (c: AdminCurrency) => {
    setEditTarget(c);
    setForm({
      code: c.code, name: c.name, symbol: c.symbol, locale: c.locale,
      decimals: c.decimals, flag: c.flag, isActive: c.isActive,
      manualRate: c.manualRate !== null ? String(c.manualRate) : '',
    });
  };

  const fc = (field: keyof CurrencyFormState, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const buildPayload = () => {
    const manualRate = form.manualRate.trim() !== '' ? parseFloat(form.manualRate) : null;
    if (manualRate !== null && isNaN(manualRate)) { toast.error('Manual rate must be a valid number'); return null; }
    return { manualRate, name: form.name.trim(), symbol: form.symbol.trim(),
             locale: form.locale.trim() || 'en-US', decimals: Number(form.decimals),
             flag: form.flag.trim() || '🏳', isActive: form.isActive };
  };

  const handleCreate = () => {
    if (!form.code.trim() || !form.name.trim() || !form.symbol.trim()) { toast.error('Code, name and symbol are required'); return; }
    const p = buildPayload(); if (!p) return;
    createCurrency({ code: form.code.trim().toUpperCase(), ...p } as CreateCurrencyPayload);
  };

  const handleUpdate = () => {
    if (!editTarget || !form.name.trim() || !form.symbol.trim()) { toast.error('Name and symbol are required'); return; }
    const p = buildPayload(); if (!p) return;
    updateCurrency({ code: editTarget.code, payload: p });
  };

  const filtered = useMemo(() =>
    currencies
      .filter(c => {
        const q = search.toLowerCase();
        return (c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
          && (filterStatus === 'all' || (filterStatus === 'active' && c.isActive) || (filterStatus === 'inactive' && !c.isActive));
      })
      .sort((a, b) => a.code.localeCompare(b.code)),
    [currencies, search, filterStatus],
  );

  const stats = useMemo(() => ({
    total:          currencies.length,
    active:         currencies.filter(c => c.isActive).length,
    withManualRate: currencies.filter(c => c.manualRate !== null).length,
    lastUpdated:    ratesData?.updatedAt ? new Date(ratesData.updatedAt).toLocaleTimeString() : '—',
  }), [currencies, ratesData]);

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-[#2c5173]">
            <DollarSign size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Currency Management
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Add, edit or deactivate platform currencies and set manual rate overrides
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshRates()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh Rates
          </button>
          <button
            onClick={() => { setEditTarget(null); setForm(EMPTY_CURRENCY_FORM); setShowCreate(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2c5173] text-white text-xs font-bold rounded-xl hover:bg-[#1e3850] transition-colors"
          >
            <Plus size={12} />
            Add Currency
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',           value: stats.total,          icon: <Globe size={13} /> },
          { label: 'Active',          value: stats.active,         icon: <Check size={13} /> },
          { label: 'Manual Overrides',value: stats.withManualRate, icon: <Lock size={13} /> },
          { label: 'Rates Updated',   value: stats.lastUpdated,    icon: <TrendingUp size={13} /> },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 dark:bg-slate-950 rounded-xl px-4 py-3 flex items-center gap-2.5 border border-gray-100 dark:border-slate-800">
            <div className="text-[#2c5173]">{s.icon}</div>
            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">{s.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search currencies…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20 focus:border-[#2c5173]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-xs text-slate-400">{filtered.length} currencies</span>
      </div>

      {/* Table */}
      <StandardDataTable
        embedded
        columns={[
          {
            key: 'code',
            label: 'Currency',
            sortable: true,
            render: (_: string, c: AdminCurrency) => (
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">{c.flag}</span>
                <div>
                  <p className="font-black text-slate-800 dark:text-slate-100">{c.code}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{c.name}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'symbol',
            label: 'Symbol',
            render: (symbol: string) => (
              <span className="font-bold text-slate-700 dark:text-slate-300">{symbol}</span>
            ),
          },
          { key: 'locale', label: 'Locale', sortable: true },
          { key: 'decimals', label: 'Dec', sortable: true },
          {
            key: 'liveRate',
            label: 'Live Rate',
            render: (_: any, c: AdminCurrency) => {
              const isBase = c.code === 'USD';
              const liveRate = isBase ? 1 : (rates[c.code] ?? null);
              if (isBase) return <span className="text-slate-400 italic text-[10px]">base</span>;
              if (liveRate !== null) {
                return <span className="font-bold text-slate-700 dark:text-slate-200">{Number(liveRate).toFixed(4)}</span>;
              }
              return <span className="text-slate-300">—</span>;
            },
          },
          {
            key: 'manualRate',
            label: 'Manual Override',
            render: (manualRate: number | null) =>
              manualRate !== null ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md font-bold">
                  <Lock size={9} />{Number(manualRate).toFixed(4)}
                </span>
              ) : (
                <span className="text-slate-300 text-[10px]">—</span>
              ),
          },
          {
            key: 'isActive',
            label: 'Status',
            sortable: true,
            render: (isActive: boolean, c: AdminCurrency) => {
              const isBase = c.code === 'USD';
              return (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); if (!isBase) toggleActive(c); }}
                  disabled={isBase}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] transition-colors
                    ${isActive ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                               : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}
                    ${isBase ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {isActive ? <><Check size={9} />Active</> : <><EyeOff size={9} />Inactive</>}
                </button>
              );
            },
          },
        ] as Column<AdminCurrency>[]}
        data={filtered}
        loading={isLoading}
        getRowId={(row) => row.code}
        searchable={false}
        pagination
        pageSize={25}
        columnVisibility
        stickyHeader
        striped
        hoverable
        dense
        emptyMessage="No currencies found"
        rowClassName={(row) => (!row.isActive ? 'opacity-50' : '')}
        rowActions={[
          {
            key: 'view',
            label: 'View',
            icon: <Eye size={12} />,
            onClick: (c) => setViewTarget(c),
          },
          {
            key: 'edit',
            label: 'Edit',
            icon: <Edit size={12} />,
            onClick: (c) => openEdit(c),
          },
          {
            key: 'delete',
            label: 'Delete',
            icon: <Trash2 size={12} />,
            variant: 'danger',
            divider: true,
            hidden: (c) => c.code === 'USD',
            onClick: (c) => setDeleteTarget(c),
          },
        ] as TableAction<AdminCurrency>[]}
        ariaLabel="Currency management"
      />

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      {showCreate && (
        <CurrencyFormModal
          title="Add New Currency"
          form={form} onChange={fc}
          onSubmit={handleCreate}
          onClose={() => { setShowCreate(false); setForm(EMPTY_CURRENCY_FORM); }}
          isLoading={isCreating} isCreate
        />
      )}

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      {editTarget && (
        <CurrencyFormModal
          title={`Edit ${editTarget.code} — ${editTarget.name}`}
          form={form} onChange={fc}
          onSubmit={handleUpdate}
          onClose={() => { setEditTarget(null); setForm(EMPTY_CURRENCY_FORM); }}
          isLoading={isUpdating}
          isBase={editTarget.code === 'USD'}
        />
      )}

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-500 w-5 h-5" />
            </div>
            <h3 className="text-center text-sm font-black text-slate-800 dark:text-white mb-1">
              Delete {deleteTarget.flag} {deleteTarget.code}?
            </h3>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mb-5">
              Removes <strong>{deleteTarget.name}</strong> from the platform. Users with this as their preferred currency fall back to USD.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button onClick={() => deleteCurrency(deleteTarget.code)} disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View details ──────────────────────────────────────────────────── */}
      {viewTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{viewTarget.flag}</span>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">{viewTarget.code}</h3>
                  <p className="text-xs text-slate-400">{viewTarget.name}</p>
                </div>
              </div>
              <button onClick={() => setViewTarget(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                ['Symbol',             viewTarget.symbol],
                ['Locale',             viewTarget.locale],
                ['Decimals',           String(viewTarget.decimals)],
                ['Status',             viewTarget.isActive ? 'Active' : 'Inactive'],
                ['Live Rate (per USD)',viewTarget.code === 'USD' ? '1 (base)' : String(rates[viewTarget.code] ?? '—')],
                ['Manual Override',    viewTarget.manualRate !== null ? String(viewTarget.manualRate) : 'None'],
                ['Created',            new Date(viewTarget.createdAt).toLocaleDateString()],
                ['Updated',            new Date(viewTarget.updatedAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setViewTarget(null)}
              className="mt-5 w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Currency form modal ────────────────────────────────────────────────────────

interface CurrencyFormModalProps {
  title: string;
  form: CurrencyFormState;
  onChange: (field: keyof CurrencyFormState, value: any) => void;
  onSubmit: () => void;
  onClose: () => void;
  isLoading: boolean;
  isCreate?: boolean;
  isBase?: boolean;
}

const CurrencyFormModal: React.FC<CurrencyFormModalProps> = ({
  title, form, onChange, onSubmit, onClose, isLoading, isCreate = false, isBase = false,
}) => {
  const INPUT = 'w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20 focus:border-[#2c5173]';
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 pb-24 lg:pb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <DollarSign size={15} className="text-[#2c5173]" />
            </div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {isCreate && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Currency Code *</label>
              <input type="text" value={form.code}
                onChange={e => onChange('code', e.target.value.toUpperCase().slice(0, 3))}
                maxLength={3} placeholder="e.g. GHS" className={INPUT} />
              <p className="mt-1 text-[10px] text-slate-400">ISO 4217 — exactly 3 uppercase letters</p>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Currency Name *</label>
            <input type="text" value={form.name}
              onChange={e => onChange('name', e.target.value)}
              placeholder="e.g. Ghanaian Cedi" className={INPUT} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Symbol *</label>
            <input type="text" value={form.symbol}
              onChange={e => onChange('symbol', e.target.value)}
              placeholder="e.g. ₵" className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">BCP-47 Locale</label>
              <input type="text" value={form.locale}
                onChange={e => onChange('locale', e.target.value)}
                placeholder="e.g. en-GH" className={INPUT} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Decimal Digits</label>
              <select value={form.decimals}
                onChange={e => onChange('decimals', Number(e.target.value))}
                className={INPUT}>
                <option value={0}>0 — e.g. JPY</option>
                <option value={2}>2 — most</option>
                <option value={3}>3 — e.g. KWD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Flag Emoji</label>
            <input type="text" value={form.flag}
              onChange={e => onChange('flag', e.target.value)}
              placeholder="e.g. 🇬🇭" className={INPUT} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
              Manual Rate Override (per 1 USD)
            </label>
            <input type="number" value={form.manualRate}
              onChange={e => onChange('manualRate', e.target.value)}
              placeholder="Leave blank to use live rate"
              step="any" min="0" className={INPUT} />
            <p className="mt-1 text-[10px] text-slate-400">Overrides the auto-fetched rate. Clear to restore live rates.</p>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800">
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Active</p>
              <p className="text-[10px] text-slate-400">Visible to users in currency selectors</p>
            </div>
            <button type="button" disabled={isBase}
              onClick={() => onChange('isActive', !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-[#2c5173]' : 'bg-slate-300 dark:bg-slate-700'} ${isBase ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
            Cancel
          </button>
          <button onClick={onSubmit} disabled={isLoading}
            className="flex-1 py-2.5 bg-[#2c5173] text-white text-xs font-bold rounded-xl hover:bg-[#1e3850] disabled:opacity-50 transition-colors">
            {isLoading ? (isCreate ? 'Creating…' : 'Saving…') : (isCreate ? 'Create Currency' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
};