import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Trophy, 
  Crown, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Shield,
  Navigation,
  CheckCircle2,
  Droplets,
  Calendar
} from 'lucide-react';
import { driverApi } from '../../services/driverApi';
import { motion } from 'framer-motion';
import { TranslatedText } from '../translated-text';

export const MonthlyLeaderboard: React.FC = () => {
  const [period, setPeriod] = useState<'MONTHLY' | 'WEEKLY' | 'YEARLY'>('MONTHLY');

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['driver-leaderboard', period],
    queryFn: () => driverApi.getLeaderboard(period),
  });

  const getRankColor = (rank: number) => {
    switch(rank) {
      case 1: return 'text-amber-500 bg-amber-50 border-amber-100';
      case 2: return 'text-slate-400 bg-slate-50 border-slate-100';
      case 3: return 'text-amber-700 bg-amber-50/50 border-amber-200/50';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const getPodiumOrder = (items: any[]) => {
    if (!items || items.length < 3) return items;
    // Order: 2nd, 1st, 3rd for podium layout
    return [items[1], items[0], items[2]];
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-primary-100 shadow-sm">
               Performance Intelligence
             </span>
          </div>
          <h2 className="text-4xl font-black text-[#0f172a] uppercase tracking-tight leading-none">
            <TranslatedText text="Elite Drivers League" />
          </h2>
          <p className="text-slate-400 font-medium mt-3 flex items-center gap-2">
            <Calendar size={14} className="text-primary-500" />
            <TranslatedText text="Recognizing operational excellence and safety leadership" />
          </p>
        </div>

        <div className="flex bg-slate-100/50 p-1.5 rounded-[1.25rem] border border-slate-100 dark:border-slate-800">
          {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p 
                ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-xl shadow-primary-900/5 border border-primary-50' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <TranslatedText text={p} />
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Strategic Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end px-4">
            {getPodiumOrder(leaderboard?.slice(0, 3) || []).map((driver, idx) => (
              <motion.div
                key={driver.driverId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative flex flex-col items-center group ${driver.rank === 1 ? 'z-10' : 'z-0'}`}
              >
                {/* Crown for #1 */}
                {driver.rank === 1 && (
                  <motion.div 
                    animate={{ rotate: [0, 5, -5, 0], y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute -top-12 text-amber-500 drop-shadow-lg"
                  >
                    <Crown size={48} />
                  </motion.div>
                )}

                <div className={`w-full bg-white dark:bg-slate-900 rounded-[3rem] p-8 border-2 shadow-2xl transition-all duration-500 ${
                  driver.rank === 1 ? 'border-amber-200 shadow-amber-200/20 scale-105' : 
                  driver.rank === 2 ? 'border-slate-100 dark:border-slate-800' : 'border-amber-100 shadow-amber-900/5'
                }`}>
                  <div className="relative mb-8 pt-4">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-100 mx-auto overflow-hidden ring-4 ring-white shadow-xl">
                       <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-black text-slate-400 italic">
                         {driver.name?.split(' ').map((n: string) => n[0]).join('') || 'DR'}
                       </div>
                    </div>
                    <div className={`absolute -bottom-2 translate-x-12 left-1/2 -ml-6 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-xl border-4 border-white ${getRankColor(driver.rank)}`}>
                      {driver.rank}
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <h4 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">{driver.name}</h4>
                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">
                       <TranslatedText text="Performance Rank" />
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Safety</p>
                      <div className="flex items-center gap-1.5 text-emerald-600 font-black italic">
                        <Shield size={12} />
                        {driver.safetyScore}%
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Miles</p>
                      <div className="flex items-center gap-1.5 text-primary-600 font-black italic">
                        <Navigation size={12} />
                        {driver.milesCovered.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Ranking Matrix */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Full Standings</h3>
              <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                <span>Rating</span>
                <span className="w-px h-3 bg-slate-200" />
                <span>Efficiency</span>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {leaderboard?.slice(3).map((driver, idx) => (
                <motion.div
                  key={driver.driverId}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group p-8 hover:bg-slate-50/50 dark:bg-slate-950 transition-all flex items-center justify-between gap-12"
                >
                  <div className="flex items-center gap-8 min-w-[300px]">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs font-black text-slate-400 italic">
                      #{driver.rank}
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 uppercase tracking-tight">
                       {driver.name?.split(' ').map((n: string) => n[0]).join('') || 'DR'}
                    </div>
                    <div>
                      <h5 className="font-black text-[#0f172a] uppercase tracking-tight leading-none group-hover:text-primary-600 transition-colors">{driver.name}</h5>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-emerald-500" />
                          {driver.completionRate}% Done
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        {driver.trend === 'up' ? <TrendingUp size={14} className="text-emerald-500" /> : 
                         driver.trend === 'down' ? <TrendingDown size={14} className="text-rose-500" /> : 
                         <Minus size={14} className="text-slate-300" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="flex flex-col">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Safety Index</p>
                      <p className="text-sm font-black text-emerald-600 italic leading-none">{driver.safetyScore}%</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Operational Miles</p>
                      <p className="text-sm font-black text-primary-600 italic leading-none">{driver.milesCovered.toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col hidden md:flex">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Yield Accuracy</p>
                      <p className="text-sm font-black text-[#0f172a] italic leading-none">{driver.completionRate}%</p>
                    </div>
                    <div className="flex flex-col hidden md:flex">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Efficiency</p>
                      <div className="flex items-center gap-1.5">
                        <Droplets size={12} className="text-amber-500" />
                        <p className="text-sm font-black text-amber-600 italic leading-none">{driver.fuelEfficiency} <span className="text-[9px]">MPG</span></p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Hero Footnote */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-150 transition-transform duration-1000">
           <Trophy size={160} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">
            <TranslatedText text="How is Rank Calculated?" />
          </h3>
          <p className="text-blue-100/70 font-medium leading-[1.8] text-sm italic">
            <TranslatedText text="Our proprietary ranking algorithm weighs Safety Scoring (40%), Total Operational Mileage (30%), On-Time Performance (20%), and Resource Efficiency (10%) to highlight the true masters of the road." />
          </p>
          <div className="flex items-center gap-4 mt-8">
             <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest">
               <TranslatedText text="Next update in 14 hours" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
