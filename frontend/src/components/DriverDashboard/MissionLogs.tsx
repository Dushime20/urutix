import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Truck,
  ChevronDown,
  MapPin,
  Route,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { driverApi } from '../../services/driverApi';
import { TranslatedText } from '../translated-text';
import { StatusBadge } from '../EnliteUI/Tables';
import { cn } from '@/utils/cn';

interface MissionLogsProps {
  driverId: string;
}

type Filter = 'all' | 'current' | 'previous';

function formatPeriod(from: string | null, to: string | null, current: boolean): string {
  const fmt = (value: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  const start = fmt(from) || '—';
  if (current) return `${start} – Present`;
  return `${start} – ${fmt(to) || '—'}`;
}

function formatShortDate(value: string | null): string {
  if (!value) return 'TBD';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDistance(km: number): string {
  if (!km) return '0 km';
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${km.toLocaleString()} km`;
}

export const MissionLogs: React.FC<MissionLogsProps> = ({ driverId }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-assignment-history', driverId],
    queryFn: () => driverApi.getAssignmentHistory(driverId),
    enabled: !!driverId,
  });

  const history = data?.history || [];

  const filtered = useMemo(() => {
    if (filter === 'current') return history.filter((h) => h.current);
    if (filter === 'previous') return history.filter((h) => !h.current);
    return history;
  }, [history, filter]);

  const filterBtn = (id: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(id)}
      className={cn(
        'px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all',
        filter === id
          ? 'bg-white dark:bg-slate-800 text-[#2b5271] shadow-sm border border-slate-200 dark:border-slate-700'
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
      )}
    >
      <TranslatedText text={label} />
    </button>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2b5271]/10 flex items-center justify-center text-[#2b5271] dark:text-blue-300 shrink-0">
            <History size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              <TranslatedText text="Mission Logs" />
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              <TranslatedText text="Truck Assignment History" />
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl text-[10px] font-bold">
            <div>
              <span className="text-slate-400 uppercase tracking-widest mr-1.5">
                <TranslatedText text="Tenure" />
              </span>
              <span className="text-slate-900 dark:text-white font-black">
                {data?.tenureDays ? `${data.tenureDays}d` : '—'}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-slate-400 uppercase tracking-widest mr-1.5">
                <TranslatedText text="Vehicles" />
              </span>
              <span className="text-[#2b5271] dark:text-blue-300 font-black">
                {data?.vehicleCount ?? 0}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-slate-400 uppercase tracking-widest mr-1.5">
                <TranslatedText text="Missions" />
              </span>
              <span className="text-slate-900 dark:text-white font-black">
                {data?.totalMissions ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl w-fit mb-6">
        {filterBtn('all', 'All')}
        {filterBtn('current', 'Current')}
        {filterBtn('previous', 'Previous')}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900/60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-14 px-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4">
            <Truck size={26} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight mb-1">
            <TranslatedText text="No assignment history yet" />
          </h4>
          <p className="text-sm text-slate-500 max-w-sm">
            <TranslatedText text="Missions you complete on assigned trucks will appear here as a running log." />
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => {
            const isOpen = expandedId === item.id;
            const truckName = [item.make, item.model].filter(Boolean).join(' ') || 'Vehicle';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={cn(
                  'rounded-2xl border transition-all overflow-hidden',
                  item.current
                    ? 'bg-white dark:bg-slate-900 border-[#2b5271]/30 shadow-sm'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-900',
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : item.id)}
                  className="w-full text-left p-5"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                          item.current
                            ? 'bg-[#2b5271] text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700',
                        )}
                      >
                        <Truck size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                            {truckName}
                          </h4>
                          {item.current && (
                            <StatusBadge
                              label={<TranslatedText text="Active" />}
                              variant="success"
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <span className="text-[#2b5271] dark:text-blue-300">{item.plate || '—'}</span>
                          <span className="text-slate-300">•</span>
                          <span>{formatPeriod(item.assignedFrom, item.assignedTo, item.current)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 min-w-[88px]">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                          <TranslatedText text="Missions" />
                        </p>
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                          {item.missions}
                        </p>
                      </div>
                      <div className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 min-w-[96px]">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                          <TranslatedText text="Distance" />
                        </p>
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                          {formatDistance(item.distance)}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform',
                          'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400',
                          isOpen && 'rotate-180 text-[#2b5271]',
                        )}
                      >
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-0">
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                          {item.missionsList.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">
                              <TranslatedText text="No missions logged on this vehicle yet." />
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {item.missionsList.map((mission) => (
                                <li
                                  key={mission.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/50"
                                >
                                  <div className="flex items-start gap-3 min-w-0">
                                    <Route size={14} className="text-[#2b5271] mt-0.5 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight truncate">
                                        {mission.origin} → {mission.destination}
                                      </p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                        <span>{mission.tripNumber || 'Mission'}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="inline-flex items-center gap-1">
                                          <MapPin size={10} />
                                          {formatShortDate(mission.date)}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 pl-7 sm:pl-0">
                                    <StatusBadge
                                      status={mission.status}
                                      label={mission.status?.replace(/_/g, ' ') || '—'}
                                    />
                                    {mission.distance > 0 && (
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {formatDistance(mission.distance)}
                                      </span>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
