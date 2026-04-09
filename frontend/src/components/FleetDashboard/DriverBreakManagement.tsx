import React, { useState } from 'react';
import { Clock, Coffee, Play, Square, History } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../../services/driverApi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface DriverBreakManagementProps {
  driverId: string;
}

interface Break {
  id: string;
  breakType: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  notes: string;
}

export const DriverBreakManagement: React.FC<DriverBreakManagementProps> = ({ driverId }) => {
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  // Fetch break history
  const { data: breaksData, isLoading } = useQuery({
    queryKey: ['driver-breaks', driverId],
    queryFn: () => driverApi.getBreaks(driverId, { limit: 10 }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const breaks: Break[] = breaksData?.breaks || [];
  const activeBreak = breaks.find(b => !b.endTime);

  // Start break mutation
  const startBreakMutation = useMutation({
    mutationFn: () => driverApi.startBreak(driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-breaks', driverId] });
      toast.success('Break started successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start break');
    },
  });

  // End break mutation
  const endBreakMutation = useMutation({
    mutationFn: () => driverApi.endBreak(driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-breaks', driverId] });
      toast.success('Break ended successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to end break');
    },
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getBreakTypeColor = (type: string) => {
    switch (type) {
      case 'REST':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      case 'MEAL':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'SLEEP':
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-colors">
      <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-4">
        <Coffee size={14} /> Safety & Records
      </h4>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="size-8 border-4 border-slate-100 dark:border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Break Status */}
          {activeBreak ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    On Break
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getBreakTypeColor(activeBreak.breakType)}`}>
                  {activeBreak.breakType}
                </span>
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 mb-3">
                Started: {new Date(activeBreak.startTime).toLocaleTimeString()}
              </div>
              <button
                onClick={() => endBreakMutation.mutate()}
                disabled={endBreakMutation.isPending}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Square size={12} />
                {endBreakMutation.isPending ? 'Ending...' : 'End Break'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => startBreakMutation.mutate()}
              disabled={startBreakMutation.isPending}
              className="w-full py-3 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900 disabled:opacity-50"
            >
              <Play size={12} />
              {startBreakMutation.isPending ? 'Starting...' : 'Start Break'}
            </button>
          )}

          {/* Break History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <History size={12} />
            {showHistory ? 'Hide' : 'Show'} Break History
          </button>

          {/* Break History */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {breaks.filter(b => b.endTime).length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                      No break history
                    </p>
                  ) : (
                    breaks
                      .filter(b => b.endTime)
                      .map((breakItem) => (
                        <div
                          key={breakItem.id}
                          className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getBreakTypeColor(breakItem.breakType)}`}>
                              {breakItem.breakType}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {formatDuration(breakItem.duration || 0)}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 dark:text-slate-500 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(breakItem.startTime).toLocaleDateString()} {new Date(breakItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
