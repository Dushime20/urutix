import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown,
  Truck,
  Droplet,
  Settings,
  ShieldCheck,
  ClipboardCheck,
  PenTool,
  ShieldAlert
} from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { toast } from 'react-hot-toast';

interface ChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'ok' | 'fail';
  note?: string;
}

interface ChecklistCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  items: ChecklistItem[];
}

export const PreTripChecklist: React.FC = () => {
  const [categories, setCategories] = useState<ChecklistCategory[]>([
    {
      id: 'ext',
      title: 'Exterior & Lighting',
      icon: Truck,
      items: [
        { id: 'ext-1', label: 'Tire Pressure & Tread', status: 'pending' },
        { id: 'ext-2', label: 'Wheel Nuts & Rims', status: 'pending' },
        { id: 'ext-3', label: 'Headlights & High Beams', status: 'pending' },
        { id: 'ext-4', label: 'Turn Signals & Hazards', status: 'pending' },
        { id: 'ext-5', label: 'Brake Lights', status: 'pending' },
      ]
    },
    {
      id: 'eng',
      title: 'Engine & Fluids',
      icon: Droplet,
      items: [
        { id: 'eng-1', label: 'Engine Oil Level', status: 'pending' },
        { id: 'eng-2', label: 'Coolant Level', status: 'pending' },
        { id: 'eng-3', label: 'Windshield Washer Fluid', status: 'pending' },
        { id: 'eng-4', label: 'Fuel Level & DEF', status: 'pending' },
        { id: 'eng-5', label: 'Belts & Hoses Condition', status: 'pending' },
      ]
    },
    {
      id: 'saf',
      title: 'Safety Equipment',
      icon: ShieldCheck,
      items: [
        { id: 'saf-1', label: 'Fire Extinguisher Charge', status: 'pending' },
        { id: 'saf-2', label: 'Reflective Triangles', status: 'pending' },
        { id: 'saf-3', label: 'First Aid Kit', status: 'pending' },
        { id: 'saf-4', label: 'Seat Belts Functionality', status: 'pending' },
      ]
    },
    {
      id: 'sys',
      title: 'Systems & Controls',
      icon: Settings,
      items: [
        { id: 'sys-1', label: 'Air Brake Test', status: 'pending' },
        { id: 'sys-2', label: 'Horn Functionality', status: 'pending' },
        { id: 'sys-3', label: 'Wipers & Washer', status: 'pending' },
        { id: 'sys-4', label: 'Dashboard Indicators', status: 'pending' },
      ]
    },
    {
      id: 'doc',
      title: 'Digital & Physical Documents',
      icon: ClipboardCheck,
      items: [
        { id: 'doc-1', label: 'Vehicle Registration', status: 'pending' },
        { id: 'doc-2', label: 'Insurance Certificate', status: 'pending' },
        { id: 'doc-3', label: 'Transit Permits', status: 'pending' },
        { id: 'doc-4', label: 'Cargo Manifest / Waybill', status: 'pending' },
        { id: 'doc-5', label: 'Driver License', status: 'pending' },
      ]
    }
  ]);

  const [expandedCategory, setExpandedCategory] = useState<string | null>('ext');

  const toggleStatus = (catId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => {
          if (item.id !== itemId) return item;
          const nextStatus: ChecklistItem['status'] = 
            item.status === 'pending' ? 'ok' : 
            item.status === 'ok' ? 'fail' : 'pending';
          return { ...item, status: nextStatus };
        })
      };
    }));
  };

  const getProgress = () => {
    const allItems = categories.flatMap(c => c.items);
    const completed = allItems.filter(i => i.status !== 'pending').length;
    return (completed / allItems.length) * 100;
  };

  const isFullyCompleted = () => {
    return categories.flatMap(c => c.items).every(i => i.status !== 'pending');
  };

  const handleSubmit = () => {
    if (!isFullyCompleted()) {
      toast.error("Please complete all check items before submitting.");
      return;
    }
    const hasFailures = categories.flatMap(c => c.items).some(i => i.status === 'fail');
    if (hasFailures) {
      toast.error("Critical failures detected. Please report maintenance issues.");
    } else {
      toast.success("Pre-trip inspection completed successfully!");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[800px]">
      {/* Header */}
      <div className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center text-primary-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
                <TranslatedText text="Operations Dashboard" />
              </h3>
              <p className="text-xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                <TranslatedText text="Pre-Trip Inspection" />
              </p>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progress</div>
             <div className="text-xl font-black text-primary-600">{Math.round(getProgress())}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            className="h-full bg-primary-600 rounded-full"
          />
        </div>
      </div>

      {/* Categories Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="space-y-4">
          {categories.map((category) => (
            <div 
              key={category.id}
              className={`rounded-3xl border transition-all ${expandedCategory === category.id ? 'border-primary-100 bg-primary-50/20 dark:border-primary-900/20 dark:bg-primary-900/5' : 'border-slate-50 dark:border-slate-800'}`}
            >
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="w-full p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${expandedCategory === category.id ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                    <category.icon size={20} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black uppercase tracking-widest text-xs transition-colors ${expandedCategory === category.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      <TranslatedText text={category.title} />
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                      {category.items.filter(i => i.status !== 'pending').length} / {category.items.length} Completed
                    </p>
                  </div>
                </div>
                {expandedCategory === category.id ? <ChevronDown size={20} className="text-primary-400" /> : <ChevronRight size={20} className="text-slate-300" />}
              </button>

              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100/50 dark:border-slate-800/50"
                  >
                    <div className="p-4 space-y-2">
                      {category.items.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-50 dark:border-slate-800/50 group/item hover:border-primary-100 transition-all shadow-sm"
                        >
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight italic">
                            <TranslatedText text={item.label} />
                          </span>
                          
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleStatus(category.id, item.id); }}
                              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-90 ${
                                item.status === 'ok' 
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                                  : item.status === 'fail'
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                                    : 'bg-slate-50 text-slate-400 border border-slate-100 dark:bg-slate-800'
                              }`}
                            >
                              {item.status === 'ok' ? <CheckCircle2 size={16} /> : item.status === 'fail' ? <AlertCircle size={16} /> : <Circle size={16} />}
                              <TranslatedText text={item.status === 'pending' ? 'Verify' : item.status === 'ok' ? 'Pass' : 'Fail'} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
        <div className="mb-8 p-6 bg-slate-100 rounded-[2rem] border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
                <PenTool size={16} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Signature Required</p>
            </div>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Enter your full name to sign"
                    className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-medium italic text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all shadow-inner"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase italic">Digital Signature</div>
            </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${
            isFullyCompleted() 
              ? 'bg-primary-600 text-white shadow-primary-200 hover:bg-primary-700 active:scale-[0.98]' 
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-50'
          }`}
        >
          <ShieldAlert size={18} />
          <TranslatedText text="Certify & Start Mission" />
        </button>
        <p className="mt-6 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed">
          <TranslatedText text="Legal Certification: Mission Ready • Vehicle Operations Safe" />
        </p>
      </div>
    </div>
  );
};
