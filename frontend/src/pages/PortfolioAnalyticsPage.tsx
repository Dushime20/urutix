import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lendingApi } from '../services/lending/lendingApi';
import {
  RotateCcw, Shield, AlertTriangle,
  Activity, BarChart2, PieChart,
} from 'lucide-react';
import ModernLoader from '../components/common/ModernLoader';
import api from '../services/api';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';

const fmtPct = (n: number | null | undefined, decimals = 2): string =>
  n != null ? `${Number(n).toFixed(decimals)}%` : '—';

const riskColour = (level: string) =>
  level === 'low'    ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
  level === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                       'text-rose-600 bg-rose-50 border-rose-100';

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; sub?: string }> = ({ icon, title, sub }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-8 h-8 rounded-xl bg-[#345E85]/10 text-[#345E85] flex items-center justify-center">{icon}</div>
    <div>
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      {sub && <p className="text-[10px] text-slate-400 font-bold">{sub}</p>}
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const PortfolioAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const { compact: fmtRWF } = useCurrencyFormat();
  const [months, setMonths] = useState<number>(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [lenderId, setLenderId] = useState<string | null>(null);

  const load = useCallback(async (lid: string, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await lendingApi.getLenderAnalytics(lid, m);
      setAnalytics(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'LENDER') return;
    // Resolve User UUID → Lender entity UUID
    api.get('/lending/me/lender-id')
      .then(r => {
        const lid = r.data?.lenderId || user.id;
        setLenderId(lid);
        load(lid, months);
      })
      .catch(() => {
        setLenderId(user.id);
        load(user.id, months);
      });
  }, [user]);

  useEffect(() => {
    if (lenderId) load(lenderId, months);
  }, [months, lenderId]);

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-500 font-bold">Please log in to access analytics.</p>
    </div>
  );

  if (user.role !== 'LENDER') return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-500 font-bold">This page is only accessible to lenders.</p>
    </div>
  );

  if (loading) return <ModernLoader isLoading type="dashboard" showStats />;

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Error Loading Analytics</h2>
        <p className="text-slate-500 text-sm mb-5">{error}</p>
        <button onClick={() => lenderId && load(lenderId, months)}
          className="px-6 py-3 bg-[#345E85] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#2a4d6d] transition-all">
          Retry
        </button>
      </div>
    </div>
  );

  if (!analytics) return null;

  const p = analytics.portfolio ?? {};
  const trends: any[] = analytics.monthly_trends ?? [];
  const risk = analytics.risk_distribution ?? {};
  const cargo: any[] = analytics.cargo_breakdown ?? [];
  const std = analytics.standards_summary ?? {};
  const currency: string = analytics.currency ?? 'RWF';

  // Bar chart max
  const maxDisbursed = Math.max(...trends.map((t: any) => t.disbursed ?? 0), 1);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-10">

        {/* ── Header ── */}
        <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 bg-slate-50/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Portfolio Analytics</h1>
            <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-widest">
              IFRS 9 · Basel II · Real-time · {currency}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Timeframe selector */}
            {([3, 6, 12] as const).map(m => (
              <button key={m} onClick={() => setMonths(m)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                  ${months === m
                    ? 'bg-[#345E85] text-white border-[#345E85] shadow-lg shadow-blue-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {m}M
              </button>
            ))}
            <button onClick={() => lenderId && load(lenderId, months)}
              className="p-2 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── IFRS 9 + Basel II Standards Summary ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <SectionHeader icon={<Shield className="w-4 h-4" />}
            title="IFRS 9 / Basel II Standards Summary"
            sub={`Computed at ${analytics.computed_at ? new Date(analytics.computed_at).toLocaleString() : '—'}`} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'ECL Estimate (IFRS 9)', value: fmtRWF(std.ifrs9_ecl_estimate ?? 0) },
              { label: 'Avg PD', value: fmtPct(std.pd_average) },
              { label: 'LGD Estimate', value: fmtPct(std.lgd_estimate) },
              { label: 'Collection Rate', value: fmtPct(std.collection_rate) },
              { label: 'NPL Ratio', value: fmtPct(std.npl_ratio) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-2xl px-4 py-4 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-lg font-black text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          {/* IFRS 9 Stage distribution bar */}
          <div className="mt-5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
              IFRS 9 Stage Distribution — Outstanding Exposure
            </p>
            {(() => {
              const total = (p.ifrs9_stage1 ?? 0) + (p.ifrs9_stage2 ?? 0) + (p.ifrs9_stage3 ?? 0);
              if (total === 0) return <p className="text-xs text-slate-400">No active loans</p>;
              const s1pct = (p.ifrs9_stage1 / total) * 100;
              const s2pct = (p.ifrs9_stage2 / total) * 100;
              const s3pct = (p.ifrs9_stage3 / total) * 100;
              return (
                <div>
                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-emerald-500 transition-all" style={{ width: `${s1pct}%` }} title={`Stage 1 (Performing): ${fmtRWF(p.ifrs9_stage1)}`} />
                    <div className="bg-amber-400 transition-all"  style={{ width: `${s2pct}%` }} title={`Stage 2 (Watch): ${fmtRWF(p.ifrs9_stage2)}`} />
                    <div className="bg-rose-500 transition-all"  style={{ width: `${s3pct}%` }} title={`Stage 3 (NPL): ${fmtRWF(p.ifrs9_stage3)}`} />
                  </div>
                  <div className="flex gap-4 mt-2">
                    {[
                      { label: 'Stage 1 · Performing', val: fmtRWF(p.ifrs9_stage1), pct: s1pct, cls: 'bg-emerald-500' },
                      { label: 'Stage 2 · Watch',      val: fmtRWF(p.ifrs9_stage2), pct: s2pct, cls: 'bg-amber-400' },
                      { label: 'Stage 3 · NPL',        val: fmtRWF(p.ifrs9_stage3), pct: s3pct, cls: 'bg-rose-500' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${s.cls}`} />
                        <span className="text-[9px] font-bold text-slate-500">{s.label}: <strong>{s.val}</strong> ({s.pct.toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Monthly Trends Chart ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <SectionHeader icon={<BarChart2 className="w-4 h-4" />}
            title="Monthly Cash Flow Trends"
            sub={`Last ${months} months · ${currency}`} />
          {trends.length === 0
            ? <p className="text-sm text-slate-400 text-center py-12">No trend data available yet.</p>
            : (
              <div className="flex items-end gap-2 h-52 px-1">
                {trends.map((t: any, i: number) => {
                  const dH = Math.max((t.disbursed / maxDisbursed) * 180, 2);
                  const cH = Math.max((t.collected / maxDisbursed) * 180, 2);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] font-bold rounded-xl px-3 py-2 z-20 min-w-[130px] shadow-2xl gap-1 pointer-events-none">
                        <span className="text-indigo-400 font-black uppercase tracking-widest border-b border-white/10 pb-1 mb-1">{t.month}</span>
                        <span>Out: <strong>{fmtRWF(t.disbursed)}</strong></span>
                        <span className="text-emerald-400">In: <strong>{fmtRWF(t.collected)}</strong></span>
                        {t.defaults > 0 && <span className="text-rose-400">Default: <strong>{fmtRWF(t.defaults)}</strong></span>}
                        <span className="text-amber-300">Net: <strong>{fmtRWF(t.net_income)}</strong></span>
                      </div>
                      <div className="flex items-end gap-0.5">
                        <div className="w-3 bg-slate-800 rounded-t-sm transition-all duration-500 hover:bg-slate-700"
                          style={{ height: `${dH}px` }} />
                        <div className="w-3 bg-[#345E85] rounded-t-sm transition-all duration-500 hover:bg-[#2a4d6d]"
                          style={{ height: `${cH}px` }} />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 -rotate-45 origin-center whitespace-nowrap">
                        {t.month?.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-800" /><span className="text-[10px] font-bold text-slate-500">Disbursed (Out)</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#345E85]" /><span className="text-[10px] font-bold text-slate-500">Collected (In)</span></div>
          </div>
        </div>

        {/* ── Risk Distribution + Cargo Breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Risk Distribution */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <SectionHeader icon={<PieChart className="w-4 h-4" />}
              title="Risk Distribution"
              sub="Active loan exposure by risk tier" />
            {risk.total_exposure === 0
              ? <p className="text-sm text-slate-400 text-center py-8">No active exposure.</p>
              : (
                <div className="space-y-3">
                  {[
                    { label: 'Low Risk',    amount: risk.low_risk_amount,    count: risk.low_risk_count,    cls: 'bg-emerald-500', level: 'low' },
                    { label: 'Medium Risk', amount: risk.medium_risk_amount, count: risk.medium_risk_count, cls: 'bg-amber-400',   level: 'medium' },
                    { label: 'High Risk',   amount: risk.high_risk_amount,   count: risk.high_risk_count,   cls: 'bg-rose-500',    level: 'high' },
                  ].map(r => {
                    const pct = risk.total_exposure > 0 ? (r.amount / risk.total_exposure) * 100 : 0;
                    return (
                      <div key={r.label}>
                        <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          <span>{r.label} · {r.count} loans</span>
                          <span>{fmtRWF(r.amount)} · {pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${r.cls} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-slate-100 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Total Exposure</span>
                    <span className="text-slate-900">{fmtRWF(risk.total_exposure)}</span>
                  </div>
                </div>
              )}
          </div>

          {/* Cargo Type Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <SectionHeader icon={<Activity className="w-4 h-4" />}
              title="Cargo Type Breakdown"
              sub="Loan exposure & default rate by cargo" />
            {cargo.length === 0
              ? <p className="text-sm text-slate-400 text-center py-8">No cargo data yet.</p>
              : (
                <div className="space-y-2">
                  {cargo.slice(0, 7).map((c: any) => (
                    <div key={c.cargo_type} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider ${riskColour(c.risk_level)}`}>
                          {c.risk_level}
                        </span>
                        <span className="text-xs font-black text-slate-700 truncate">{c.cargo_type}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <p className="text-[10px] font-black text-slate-900">{fmtRWF(c.total_value)}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{c.loan_count} loans</p>
                        </div>
                        <div className="w-16">
                          <p className="text-[10px] font-black text-rose-500">{fmtPct(c.default_rate)} DR</p>
                          <p className="text-[9px] text-slate-400 font-bold">{fmtPct(c.average_rate)} avg</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* ── Portfolio Composition ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <SectionHeader icon={<TrendingUp className="w-4 h-4" />}
            title="Portfolio Composition"
            sub="Loan lifecycle breakdown" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Repaid',       value: fmtRWF(p.total_amount_repaid ?? 0),    sub: 'Principal recovered',       cls: 'text-emerald-600' },
              { label: 'Avg Loan Size',      value: fmtRWF(p.average_loan_size ?? 0),      sub: 'Per facility',               cls: 'text-[#345E85]' },
              { label: 'Portfolio Yield',    value: fmtPct(p.portfolio_yield),              sub: 'Interest / Disbursed',       cls: 'text-amber-600' },
              { label: 'Capital Adequacy',   value: fmtPct(p.capital_adequacy_ratio),       sub: 'Basel II proxy (Tier 1/RWA)', cls: 'text-purple-600' },
            ].map(({ label, value, sub, cls }) => (
              <div key={label} className="bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-xl font-black ${cls}`}>{value}</p>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PortfolioAnalyticsPage;

