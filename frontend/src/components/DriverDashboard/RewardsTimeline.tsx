import React from 'react';
import { 
  Trophy, 
  Gift, 
  Star, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  TrendingUp,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface RewardStep {
  id: string;
  title: string;
  requirement: string;
  status: 'unlocked' | 'locked' | 'completed';
  icon: React.ElementType;
}

export const RewardsTimeline: React.FC = () => {
  const { format: formatCurrency } = useCurrencyFormat();
  const { tSync: t } = useTranslation();
  const steps: RewardStep[] = [
    { 
      id: '1', 
      title: 'Safety Rookie', 
      requirement: '10 Safe Missions', 
      status: 'completed', 
      icon: Star 
    },
    { 
      id: '2', 
      title: 'Fuel Savior', 
      requirement: 'Save 50L Fuel', 
      status: 'unlocked', 
      icon: TrendingUp 
    },
    { 
      id: '3', 
      title: 'Elite Captain', 
      requirement: '100 On-Time Trips', 
      status: 'unlocked', 
      icon: Trophy 
    },
    { 
      id: '4', 
      title: 'Legendary Navigator', 
      requirement: '500 Successful Deliveries', 
      status: 'locked', 
      icon: Zap 
    }
  ];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 flex flex-col h-full">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <Gift size={22} />
           </div>
           <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1"><TranslatedText text="Driver Perks" /></p>
              <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight"><TranslatedText text="Rewards Roadmap" /></h3>
           </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
            <TranslatedText text="Current Level" />: 14
        </div>
      </div>

      <div className="flex-1 relative space-y-8">
        {/* Connection Line */}
        <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-slate-100 -z-10" />

        {steps.map((step, idx) => (
          <motion.div 
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-start gap-6 group"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 transition-all duration-500 relative ${
              step.status === 'completed' ? 'bg-emerald-500 border-emerald-50 text-white shadow-lg shadow-emerald-200' :
              step.status === 'unlocked' ? 'bg-blue-500 border-blue-50 text-white shadow-lg shadow-blue-200' :
              'bg-white border-slate-50 text-slate-300'
            }`}>
                {step.status === 'completed' ? <CheckCircle2 size={20} /> :
                 step.status === 'locked' ? <Lock size={18} /> :
                 <step.icon size={20} />}
            </div>

            <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-black uppercase tracking-tight ${step.status === 'locked' ? 'text-slate-400' : 'text-[#0f172a]'}`}>
                        <TranslatedText text={step.title} />
                    </h4>
                    {step.status === 'unlocked' && (
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest animate-pulse"><TranslatedText text="Claim Now!" /></span>
                    )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><TranslatedText text={step.requirement} /></p>
                
                {step.status === 'unlocked' && (
                    <button className="mt-3 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:gap-3 transition-all">
                        <TranslatedText text="View Prize" /> <ArrowRight size={12} />
                    </button>
                )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 p-6 bg-slate-900 rounded-[2rem] relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10"><TranslatedText text="Next Big Reward" /></p>
         <h4 className="text-white font-black uppercase tracking-tight text-lg mb-1 relative z-10">{formatCurrency(100)} <TranslatedText text="Performance Bonus" /></h4>
         <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden relative z-10">
            <motion.div 
                animate={{ width: '85%' }}
                className="h-full bg-emerald-500 rounded-full"
            />
         </div>
         <p className="text-[9px] font-bold text-emerald-400 mt-2 uppercase tracking-widest relative z-10"><TranslatedText text="85% Complete • 15 more missions to go" /></p>
      </div>
    </div>
  );
};
