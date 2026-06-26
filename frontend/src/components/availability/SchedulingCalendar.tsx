import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Truck,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { TruckScheduleItem } from '../../services/availabilityApi';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScheduleEntry {
  id: string;
  resourceType: 'TRUCK' | 'DRIVER';
  resourceId: string;
  resourceLabel: string; // e.g. "RAB 123X" or "John Doe"
  cargoId: string;
  tripId: string;
  pickupDateTime: string;
  deliveryDateTime: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';
}

interface Props {
  entries: ScheduleEntry[];
  loading?: boolean;
  className?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PLANNED:     { bg: 'bg-yellow-100 border-yellow-300',  text: 'text-yellow-800', label: 'Scheduled' },
  IN_PROGRESS: { bg: 'bg-blue-100 border-blue-300',      text: 'text-blue-800',   label: 'In Transit' },
  COMPLETED:   { bg: 'bg-emerald-100 border-emerald-300',text: 'text-emerald-800',label: 'Completed' },
  CANCELLED:   { bg: 'bg-red-100 border-red-300',        text: 'text-red-800',    label: 'Cancelled' },
  DELAYED:     { bg: 'bg-orange-100 border-orange-300',  text: 'text-orange-800', label: 'Delayed' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function dateInRange(date: Date, start: Date, end: Date): boolean {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SchedulingCalendar: React.FC<Props> = ({ entries, loading, className }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = startOfMonth(currentDate).getDay();
  const totalDays = daysInMonth(currentDate);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Build a map: day-of-month → entries active that day
  const dayEntries = useMemo(() => {
    const map = new Map<number, ScheduleEntry[]>();
    for (let d = 1; d <= totalDays; d++) {
      const day = new Date(year, month, d);
      const active = entries.filter(e => {
        const start = new Date(e.pickupDateTime);
        const end   = new Date(e.deliveryDateTime);
        return dateInRange(day, start, end);
      });
      if (active.length > 0) map.set(d, active);
    }
    return map;
  }, [entries, year, month, totalDays]);

  const selectedEntries = useMemo(() => {
    if (!selectedDay) return [];
    const d = selectedDay.getDate();
    return dayEntries.get(d) || [];
  }, [selectedDay, dayEntries]);

  // Calendar grid cells (blanks + days)
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const today = new Date();

  return (
    <div className={cn('bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Scheduling Calendar</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            Truck & driver reservations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-all"
          >
            <ChevronLeft size={14} className="text-slate-500" />
          </button>
          <span className="text-xs font-black text-slate-700 uppercase tracking-widest min-w-[110px] text-center">
            {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-all"
          >
            <ChevronRight size={14} className="text-slate-500" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Calendar grid */}
        <div className="flex-1 p-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {Object.entries(STATUS_STYLES).map(([key, style]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded border', style.bg)} />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{style.label}</span>
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`blank-${idx}`} />;

              const dayDate  = new Date(year, month, day);
              const isToday  = isSameDay(dayDate, today);
              const isSelected = selectedDay && isSameDay(dayDate, selectedDay);
              const activeEntries = dayEntries.get(day) || [];
              const hasConflict = activeEntries.some(e => e.status === 'DELAYED');

              // Determine dot color based on highest-priority status
              const dotColors: string[] = [];
              if (activeEntries.some(e => e.status === 'IN_PROGRESS')) dotColors.push('bg-blue-400');
              if (activeEntries.some(e => e.status === 'PLANNED'))     dotColors.push('bg-yellow-400');
              if (activeEntries.some(e => e.status === 'DELAYED'))     dotColors.push('bg-orange-500');

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : dayDate)}
                  className={cn(
                    'relative flex flex-col items-center justify-start p-1.5 rounded-xl min-h-[44px] transition-all',
                    isToday && 'ring-2 ring-[#345E85] ring-offset-1',
                    isSelected && 'bg-[#345E85] text-white',
                    !isSelected && activeEntries.length > 0 && 'bg-slate-50 hover:bg-slate-100',
                    !isSelected && activeEntries.length === 0 && 'hover:bg-slate-50',
                  )}
                >
                  <span className={cn(
                    'text-[11px] font-black',
                    isSelected ? 'text-white' : isToday ? 'text-[#345E85]' : 'text-slate-700',
                  )}>
                    {day}
                  </span>
                  {dotColors.length > 0 && !isSelected && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dotColors.slice(0, 3).map((c, i) => (
                        <div key={i} className={cn('w-1.5 h-1.5 rounded-full', c)} />
                      ))}
                    </div>
                  )}
                  {hasConflict && !isSelected && (
                    <AlertTriangle size={8} className="text-orange-500 mt-0.5" />
                  )}
                  {activeEntries.length > 3 && !isSelected && (
                    <span className="text-[7px] font-black text-slate-400">+{activeEntries.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel: selected day entries */}
        <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-100 p-6">
          {selectedDay ? (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                {selectedDay.toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : selectedEntries.length > 0 ? (
                <div className="space-y-2">
                  {selectedEntries.map(entry => {
                    const style = STATUS_STYLES[entry.status] || STATUS_STYLES.PLANNED;
                    return (
                      <div
                        key={entry.id}
                        className={cn('rounded-xl p-3 border', style.bg)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {entry.resourceType === 'TRUCK'
                            ? <Truck size={12} className={style.text} />
                            : <User size={12} className={style.text} />}
                          <span className={cn('text-[9px] font-black uppercase tracking-widest', style.text)}>
                            {entry.resourceLabel}
                          </span>
                        </div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest truncate">
                          Cargo {entry.cargoId.slice(0, 8)}…
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={8} className="text-slate-400" />
                          <span className="text-[8px] text-slate-500">
                            {new Date(entry.pickupDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' → '}
                            {new Date(entry.deliveryDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className={cn('inline-block mt-1 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border', style.bg, style.text)}>
                          {style.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">All resources free</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select a day to see reservations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Missing import for Calendar icon
function Calendar(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
