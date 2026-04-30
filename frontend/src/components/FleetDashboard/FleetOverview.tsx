// init

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Users, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Clock, Zap, Star, DollarSign, Fuel,
  Activity, ArrowRight, Shield, BarChart3, MapPin,
  Package, RefreshCw, ChevronRight, Circle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FleetOverviewProps {
  trucks: any[];
  drivers: any[];
  analytics: any;
  loading: boolean;
  trips?: any[];
  onRefresh?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number, currency = 'RWF') =>
  new Intl.NumberFormat('en-RW', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
      up ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
         : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? '+' : ''}{value}{suffix}
    </span>
  );
}

function MiniBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${w}%` }} />
    </div>
  );
}

// Simple sparkline using SVG — no external chart lib needed
function Sparkline({ data, color = '#3b82f6', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={w} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={(data.length - 1) * step} cy={height - ((data[data.length - 1] - min) / range) * height} r="3" fill={color} />
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: number;
  sparkData?: number[];
  sparkColor?: string;
  onClick?: () => void;
  alert?: boolean;
}

function KpiCard({ title, value, sub, icon, iconBg, trend, sparkData, sparkColor, onClick, alert }: KpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } ${alert ? 'border-red-200 dark:border-red-800' : 'border-slate-100 dark:border-slate-800'}`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend !== undefined && <TrendBadge value={trend} />}
        {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
        {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Fleet Status Donut ────────────────────────────────────────────────────────

function FleetStatusRing({ available, inTransit, maintenance, outOfService }: {
  available: number; inTransit: number; maintenance: number; outOfService: number;
}) {
  const total = available + inTransit + maintenance + outOfService || 1;
  const segments = [
    { label: 'Available',     value: available,     color: '#10b981', dark: '#34d399' },
    { label: 'In Transit',    value: inTransit,     color: '#3b82f6', dark: '#60a5fa' },
    { label: 'Maintenance',   value: maintenance,   color: '#f59e0b', dark: '#fbbf24' },
    { label: 'Out of Service',value: outOfService,  color: '#ef4444', dark: '#f87171' },
  ];

  // Build SVG arc segments
  const r = 52; const cx = 64; const cy = 64;
  let startAngle = -90;
  const arcs = segments.map(seg => {
    const angle = (seg.value / total) * 360;
    const endAngle = startAngle + angle;
    const large = angle > 180 ? 1 : 0;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const d = angle < 0.5 ? '' : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const result = { ...seg, d, startAngle };
    startAngle = endAngle;
    return result;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Fleet Status</p>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128">
            {arcs.map((arc, i) => arc.d ? (
              <path key={i} d={arc.d} fill={arc.color} opacity={0.9} />
            ) : null)}
            <circle cx={cx} cy={cy} r={36} fill="white" className="dark:fill-slate-900" />
            <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-900 dark:fill-white" fontSize="18" fontWeight="900">{total}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700" letterSpacing="1">TRUCKS</text>
          </svg>
        </div>
        <div className="flex-1 space-y-2.5">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">{seg.value}</span>
                <span className="text-[10px] text-slate-400">{pct(seg.value, total)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Driver Leaderboard ────────────────────────────────────────────────────────

function DriverLeaderboard({ drivers }: { drivers: any[] }) {
  const navigate = useNavigate();
  const ranked = useMemo(() => {
    return [...drivers]
      .filter(d => d.rating || d.safetyScore || d.onTimeDeliveryRate)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);
  }, [drivers]);

  if (ranked.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉', '4', '5'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Top Drivers</p>
        <button
          onClick={() => navigate('/dashboard/fleet/drivers')}
          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View all <ChevronRight size={12} />
        </button>
      </div>
      <div className="space-y-3">
        {ranked.map((d, i) => {
          const name = `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.name || 'Driver';
          const rating = d.rating ? Number(d.rating).toFixed(1) : '—';
          const trips = d.totalTrips || 0;
          const onTime = d.onTimeDeliveryRate ? Math.round(d.onTimeDeliveryRate) : null;
          return (
            <div key={d.id} className="flex items-center gap-3">
              <span className="text-base w-6 text-center flex-shrink-0">{medals[i]}</span>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Users size={14} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{name}</p>
                <p className="text-[10px] text-slate-400">{trips} trips{onTime ? ` · ${onTime}% on-time` : ''}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span className="text-sm font-black text-slate-800 dark:text-white">{rating}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Truck Health Table ────────────────────────────────────────────────────────

function TruckHealthTable({ trucks }: { trucks: any[] }) {
  const navigate = useNavigate();

  const statusColor: Record<string, string> = {
    AVAILABLE:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    IN_TRANSIT:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    MAINTENANCE:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    OUT_OF_SERVICE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusDot: Record<string, string> = {
    AVAILABLE:      'bg-emerald-500',
    IN_TRANSIT:     'bg-blue-500',
    MAINTENANCE:    'bg-amber-500',
    OUT_OF_SERVICE: 'bg-red-500',
  };

  const shown = trucks.slice(0, 6);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-slate-800">
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fleet Health</p>
        <button
          onClick={() => navigate('/dashboard/fleet/trucks')}
          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Manage fleet <ChevronRight size={12} />
        </button>
      </div>
      {shown.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">No trucks registered yet.</div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {shown.map(truck => {
            const name = [truck.make, truck.model].filter(Boolean).join(' ') || truck.plateNumber || 'Truck';
            const plate = truck.plateNumber || truck.licensePlate || '—';
            const status = truck.status || 'AVAILABLE';
            const mileage = truck.mileage ? `${Number(truck.mileage).toLocaleString()} km` : '—';
            const driver = truck.currentDriver
              ? `${truck.currentDriver.firstName || ''} ${truck.currentDriver.lastName || ''}`.trim()
              : null;
            const maintenanceDue = truck.nextMaintenanceDate
              ? new Date(truck.nextMaintenanceDate) < new Date(Date.now() + 7 * 86400000)
              : false;

            return (
              <div key={truck.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[status] || 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{name}</p>
                    {maintenanceDue && (
                      <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertTriangle size={9} /> Maint.
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">{plate} · {mileage}{driver ? ` · ${driver}` : ''}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[status] || 'bg-slate-100 text-slate-500'}`}>
                  {status.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Alerts Panel ──────────────────────────────────────────────────────────────

function AlertsPanel({ trucks, drivers }: { trucks: any[]; drivers: any[] }) {
  const navigate = useNavigate();

  const alerts = useMemo(() => {
    const list: { id: string; type: 'warning' | 'danger' | 'info'; title: string; desc: string; action?: string; path?: string }[] = [];
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 86400000);

    trucks.forEach(t => {
      const plate = t.plateNumber || 'Truck';
      if (t.status === 'OUT_OF_SERVICE') {
        list.push({ id: `oos-${t.id}`, type: 'danger', title: `${plate} out of service`, desc: 'Requires immediate attention', path: '/dashboard/fleet/trucks' });
      }
      if (t.insuranceExpiry && new Date(t.insuranceExpiry) < soon) {
        list.push({ id: `ins-${t.id}`, type: 'warning', title: `${plate} insurance expiring`, desc: `Expires ${new Date(t.insuranceExpiry).toLocaleDateString()}`, path: '/dashboard/fleet/trucks' });
      }
      if (t.registrationExpiry && new Date(t.registrationExpiry) < soon) {
        list.push({ id: `reg-${t.id}`, type: 'warning', title: `${plate} registration expiring`, desc: `Expires ${new Date(t.registrationExpiry).toLocaleDateString()}`, path: '/dashboard/fleet/trucks' });
      }
      if (t.nextMaintenanceDate && new Date(t.nextMaintenanceDate) < soon) {
        list.push({ id: `mnt-${t.id}`, type: 'warning', title: `${plate} maintenance due`, desc: `Due ${new Date(t.nextMaintenanceDate).toLocaleDateString()}`, path: '/dashboard/fleet/trucks' });
      }
    });

    drivers.forEach(d => {
      const name = `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Driver';
      if (d.licenseExpiry && new Date(d.licenseExpiry) < soon) {
        list.push({ id: `lic-${d.id}`, type: 'warning', title: `${name}'s license expiring`, desc: `Expires ${new Date(d.licenseExpiry).toLocaleDateString()}`, path: '/dashboard/fleet/drivers' });
      }
      if (d.medicalCertExpiry && new Date(d.medicalCertExpiry) < soon) {
        list.push({ id: `med-${d.id}`, type: 'warning', title: `${name}'s medical cert expiring`, desc: `Expires ${new Date(d.medicalCertExpiry).toLocaleDateString()}`, path: '/dashboard/fleet/drivers' });
      }
    });

    return list.slice(0, 6);
  }, [trucks, drivers]);

  const typeStyle = {
    danger:  { bg: 'bg-red-50 dark:bg-red-900/20',    icon: 'text-red-500',    dot: 'bg-red-500' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-500',  dot: 'bg-amber-500' },
    info:    { bg: 'bg-blue-50 dark:bg-blue-900/20',   icon: 'text-blue-500',   dot: 'bg-blue-500' },
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Alerts & Compliance</p>
          {alerts.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {alerts.length}
            </span>
          )}
        </div>
      </div>
      {alerts.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2 text-center">
          <CheckCircle2 size={28} className="text-emerald-500" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">All clear!</p>
          <p className="text-xs text-slate-400">No compliance issues detected.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {alerts.map(alert => {
            const s = typeStyle[alert.type];
            return (
              <div
                key={alert.id}
                onClick={() => alert.path && navigate(alert.path)}
                className={`flex items-start gap-3 px-5 py-3 ${s.bg} cursor-pointer hover:opacity-90 transition-opacity`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{alert.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{alert.desc}</p>
                </div>
                <ChevronRight size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Revenue Trend Bar Chart ───────────────────────────────────────────────────

function RevenueTrendChart({ analytics }: { analytics: any }) {
  // Build 7-day mock trend from analytics data (real data would come from API)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const base = analytics?.totalRevenue ? analytics.totalRevenue / 7 : 50000;
  const data = useMemo(() => days.map((d, i) => ({
    day: d,
    value: Math.round(base * (0.7 + Math.random() * 0.6)),
  })), [base]);

  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Revenue Trend</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {analytics?.totalRevenue ? fmt(analytics.totalRevenue) : 'RWF 0'}
          </p>
        </div>
        <TrendBadge value={12} />
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {data.map((d, i) => {
          const h = Math.max(4, (d.value / max) * 80);
          const isToday = i === new Date().getDay() - 1;
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${isToday ? 'bg-blue-500' : 'bg-slate-100 dark:bg-slate-800'}`}
                style={{ height: `${h}px` }}
                title={`${d.day}: ${fmt(d.value)}`}
              />
              <span className={`text-[9px] font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────

function QuickActions({ onAddTruck, onAddDriver }: { onAddTruck: () => void; onAddDriver: () => void }) {
  const navigate = useNavigate();
  const actions = [
    { label: 'Add Truck',      icon: Truck,     color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',     onClick: onAddTruck },
    { label: 'Add Driver',     icon: Users,     color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', onClick: onAddDriver },
    { label: 'Log Fuel',       icon: Fuel,      color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',  onClick: () => navigate('/dashboard/fleet/fuel') },
    { label: 'View Matches',   icon: Zap,       color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', onClick: () => navigate('/dashboard/fleet?tab=matches') },
    { label: 'Financials',     icon: DollarSign,color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',  onClick: () => navigate('/dashboard/fleet/overview') },
    { label: 'Safety',         icon: Shield,    color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',          onClick: () => navigate('/dashboard/fleet/safety') },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Quick Actions</p>
      <div className="grid grid-cols-3 gap-2">
        {actions.map(a => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl ${a.color} hover:opacity-80 active:scale-95 transition-all`}
          >
            <a.icon size={18} />
            <span className="text-[10px] font-bold text-center leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Driver Availability Bar ───────────────────────────────────────────────────

function DriverAvailability({ drivers }: { drivers: any[] }) {
  const stats = useMemo(() => {
    const active    = drivers.filter(d => d.status === 'ACTIVE' || d.availabilityStatus === 'AVAILABLE').length;
    const inTransit = drivers.filter(d => d.status === 'IN_TRANSIT').length;
    const onLeave   = drivers.filter(d => d.status === 'ON_LEAVE').length;
    const inactive  = drivers.filter(d => ['INACTIVE', 'SUSPENDED', 'TERMINATED'].includes(d.status)).length;
    return { active, inTransit, onLeave, inactive, total: drivers.length };
  }, [drivers]);

  const bars = [
    { label: 'Available',   value: stats.active,    color: 'bg-emerald-500' },
    { label: 'In Transit',  value: stats.inTransit, color: 'bg-blue-500' },
    { label: 'On Leave',    value: stats.onLeave,   color: 'bg-amber-500' },
    { label: 'Inactive',    value: stats.inactive,  color: 'bg-slate-300 dark:bg-slate-600' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Driver Availability</p>
        <span className="text-sm font-black text-slate-800 dark:text-white">{stats.total} total</span>
      </div>
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-4">
        {bars.map(b => b.value > 0 && (
          <div
            key={b.label}
            className={`${b.color} transition-all duration-700`}
            style={{ width: `${pct(b.value, stats.total || 1)}%` }}
            title={`${b.label}: ${b.value}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {bars.map(b => (
          <div key={b.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${b.color}`} />
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{b.label}</span>
            <span className="text-[10px] font-black text-slate-800 dark:text-white ml-auto">{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Performance Scorecard ─────────────────────────────────────────────────────

function PerformanceScorecard({ analytics, trucks, drivers }: { analytics: any; trucks: any[]; drivers: any[] }) {
  const utilization = analytics?.utilizationRate
    ?? (trucks.length > 0 ? pct(trucks.filter(t => t.status === 'IN_TRANSIT').length, trucks.length) : 0);

  const avgRating = analytics?.averageRating
    ?? (drivers.length > 0
      ? drivers.reduce((s, d) => s + (Number(d.rating) || 0), 0) / drivers.filter(d => d.rating).length || 0
      : 0);

  const onTimeRate = analytics?.onTimeDeliveryRate
    ?? (drivers.length > 0
      ? drivers.reduce((s, d) => s + (Number(d.onTimeDeliveryRate) || 0), 0) / drivers.filter(d => d.onTimeDeliveryRate).length || 0
      : 0);

  const safetyScore = analytics?.safetyScore
    ?? (drivers.length > 0
      ? drivers.reduce((s, d) => s + (Number(d.safetyScore) || 0), 0) / drivers.filter(d => d.safetyScore).length || 0
      : 0);

  const metrics = [
    { label: 'Fleet Utilization',   value: Math.round(utilization),  max: 100, unit: '%', color: 'bg-blue-500',    good: 70 },
    { label: 'Avg Driver Rating',   value: Number(avgRating.toFixed(1)), max: 5, unit: '/5', color: 'bg-amber-500', good: 4 },
    { label: 'On-Time Delivery',    value: Math.round(onTimeRate),   max: 100, unit: '%', color: 'bg-emerald-500', good: 85 },
    { label: 'Safety Score',        value: Math.round(safetyScore),  max: 100, unit: '%', color: 'bg-purple-500',  good: 90 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Performance Scorecard</p>
      <div className="space-y-4">
        {metrics.map(m => {
          const isGood = m.value >= m.good;
          return (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{m.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 dark:text-white">{m.value}{m.unit}</span>
                  {isGood
                    ? <CheckCircle2 size={12} className="text-emerald-500" />
                    : <AlertTriangle size={12} className="text-amber-500" />
                  }
                </div>
              </div>
              <MiniBar value={m.value} max={m.max} color={m.color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main FleetOverview Component ──────────────────────────────────────────────

export const FleetOverview: React.FC<FleetOverviewProps> = ({
  trucks, drivers, analytics, loading, onRefresh,
  onAddTruck, onAddDriver,
}: FleetOverviewProps & { onAddTruck?: () => void; onAddDriver?: () => void }) => {
  const navigate = useNavigate();

  // Derived fleet stats
  const truckStats = useMemo(() => {
    const available      = trucks.filter(t => t.status === 'AVAILABLE').length;
    const inTransit      = trucks.filter(t => t.status === 'IN_TRANSIT').length;
    const maintenance    = trucks.filter(t => t.status === 'MAINTENANCE').length;
    const outOfService   = trucks.filter(t => t.status === 'OUT_OF_SERVICE').length;
    const utilization    = pct(inTransit, trucks.length || 1);
    const totalRevenue   = analytics?.totalRevenue ?? trucks.reduce((s, t) => s + (Number(t.totalRevenue) || 0), 0);
    const totalTrips     = analytics?.totalTrips ?? trucks.reduce((s, t) => s + (Number(t.totalTrips) || 0), 0);
    const avgRating      = analytics?.averageRating
      ?? (drivers.filter(d => d.rating).length > 0
        ? drivers.reduce((s, d) => s + (Number(d.rating) || 0), 0) / drivers.filter(d => d.rating).length
        : 0);
    return { available, inTransit, maintenance, outOfService, utilization, totalRevenue, totalTrips, avgRating };
  }, [trucks, drivers, analytics]);

  // Sparkline data (simulated weekly trend)
  const revSpark = useMemo(() => Array.from({ length: 7 }, (_, i) =>
    Math.round((truckStats.totalRevenue / 7) * (0.6 + Math.random() * 0.8))
  ), [truckStats.totalRevenue]);

  const tripSpark = useMemo(() => Array.from({ length: 7 }, (_, i) =>
    Math.round((truckStats.totalTrips / 7) * (0.5 + Math.random() * 1))
  ), [truckStats.totalTrips]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Row 1: KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Trucks"
          value={trucks.length}
          sub={`${truckStats.inTransit} in transit · ${truckStats.available} available`}
          icon={<Truck size={18} />}
          iconBg="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          onClick={() => navigate('/dashboard/fleet/trucks')}
        />
        <KpiCard
          title="Fleet Utilization"
          value={`${truckStats.utilization}%`}
          sub={`${truckStats.inTransit} of ${trucks.length} trucks active`}
          icon={<Activity size={18} />}
          iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          trend={truckStats.utilization > 60 ? 5 : -3}
        />
        <KpiCard
          title="Total Revenue"
          value={fmt(truckStats.totalRevenue)}
          sub="All-time earnings"
          icon={<DollarSign size={18} />}
          iconBg="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          trend={12}
          sparkData={revSpark}
          sparkColor="#10b981"
        />
        <KpiCard
          title="Total Trips"
          value={truckStats.totalTrips}
          sub={`${drivers.length} drivers registered`}
          icon={<Package size={18} />}
          iconBg="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          trend={8}
          sparkData={tripSpark}
          sparkColor="#8b5cf6"
          onClick={() => navigate('/dashboard/fleet/trips')}
        />
      </div>

      {/* ── Row 2: Status Ring + Performance + Alerts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <FleetStatusRing
          available={truckStats.available}
          inTransit={truckStats.inTransit}
          maintenance={truckStats.maintenance}
          outOfService={truckStats.outOfService}
        />
        <PerformanceScorecard analytics={analytics} trucks={trucks} drivers={drivers} />
        <AlertsPanel trucks={trucks} drivers={drivers} />
      </div>

      {/* ── Row 3: Revenue Chart + Driver Availability + Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <RevenueTrendChart analytics={analytics} />
        <DriverAvailability drivers={drivers} />
        <QuickActions
          onAddTruck={onAddTruck || (() => navigate('/dashboard/fleet/trucks'))}
          onAddDriver={onAddDriver || (() => navigate('/dashboard/fleet/drivers'))}
        />
      </div>

      {/* ── Row 4: Fleet Health Table + Driver Leaderboard ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <TruckHealthTable trucks={trucks} />
        </div>
        <DriverLeaderboard drivers={drivers} />
      </div>

    </div>
  );
};

export default FleetOverview;
