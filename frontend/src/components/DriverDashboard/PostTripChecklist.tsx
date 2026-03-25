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
  PackageCheck,
  ClipboardCheck,
  Lock,
  Flag,
  PenTool,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Camera,
  Upload,
  File as FileIcon
} from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { toast } from 'react-hot-toast';
import { safetyApi, InspectionTypes, InspectionStatuses } from '../../services/safetyApi';
import { documentApi } from '../../services/documents/documentApi';

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

interface PostTripChecklistProps {
  truckId?: string;
  truckPlate?: string;
  driverId?: string;
  driverName?: string;
  onComplete?: (data: { odometer: string; location: string }) => void;
}

export const PostTripChecklist: React.FC<PostTripChecklistProps> = ({ 
  truckId,
  truckPlate,
  driverId,
  driverName,
  onComplete 
}) => {
  const [odometer, setOdometer] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [podFile, setPodFile] = useState<File | null>(null);
  const [vehicleFile, setVehicleFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<ChecklistCategory[]>([
    {
      id: 'cargo',
      title: 'Cargo & Delivery',
      icon: PackageCheck,
      items: [
        { id: 'cargo-1', label: 'All items unloaded & accounted for', status: 'pending' },
        { id: 'cargo-2', label: 'Proof of Delivery (POD) signed', status: 'pending' },
        { id: 'cargo-3', label: 'Customer confirmation received', status: 'pending' },
      ]
    },
    {
      id: 'vehicle',
      title: 'Vehicle Status',
      icon: Truck,
      items: [
        { id: 'veh-1', label: 'Post-trip walkaround inspection', status: 'pending' },
        { id: 'veh-2', label: 'Exterior lights (all functional)', status: 'pending' },
        { id: 'veh-3', label: 'Tire condition (no new damage)', status: 'pending' },
      ]
    },
    {
      id: 'eng',
      title: 'Fluids & Engine',
      icon: Droplet,
      items: [
        { id: 'eng-1', label: 'Fuel level recorded', status: 'pending' },
        { id: 'eng-2', label: 'No visual fluid leaks', status: 'pending' },
      ]
    },
    {
      id: 'admin',
      title: 'Digital & Admin',
      icon: ClipboardCheck,
      items: [
        { id: 'adm-2', label: 'All trip expenses reported', status: 'pending' },
        { id: 'adm-3', label: 'Logbook (ELD) certified & closed', status: 'pending' },
      ]
    },
    {
      id: 'sec',
      title: 'Security',
      icon: Lock,
      items: [
        { id: 'sec-1', label: 'Vehicle properly parked & locked', status: 'pending' },
        { id: 'sec-2', label: 'Cargo bay secured / empty', status: 'pending' },
      ]
    }
  ]);

  const [expandedCategory, setExpandedCategory] = useState<string | null>('cargo');

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
    return categories.flatMap(c => c.items).every(i => i.status !== 'pending') && 
           signature.trim().length > 0 && 
           odometer.trim().length > 0;
  };

  const handleSubmit = async () => {
    if (!isFullyCompleted()) {
      toast.error("Please complete all check items, sign and enter odometer before closing the mission.");
      return;
    }

    setIsSubmitting(true);
    const allItems = categories.flatMap(cat => cat.items.map(item => ({
      id: item.id,
      category: cat.title,
      item: item.label,
      status: item.status === 'ok' ? 'passed' : 'failed'
    })));

    const hasFailures = allItems.some(i => i.status === 'failed');

    try {
      await safetyApi.createInspection({
        type: InspectionTypes.POST_TRIP,
        inspector: signature,
        inspectionDate: new Date().toISOString(),
        truckId,
        truckPlate,
        driverId,
        driverName,
        status: hasFailures ? InspectionStatuses.FAILED : InspectionStatuses.PASSED,
        items: allItems,
        notes: `Post-trip inspection signed by ${signature}. Odometer: ${odometer}, Location: ${location}`
      });

      // Upload Compliance Photos if present
      if (podFile || vehicleFile) {
        const uploadPromises = [];
        if (podFile) {
          uploadPromises.push(documentApi.createDocument({
              entityType: 'DRIVER',
              entityId: driverId || 'unknown',
              documentType: 'PROOF_OF_DELIVERY',
              category: 'OPERATIONAL',
              title: `POD - Trip Closure - ${new Date().toLocaleDateString()}`,
              description: `Proof of Delivery uploaded during post-trip checklist by ${driverName || signature}`,
              priority: 'NORMAL'
          }, podFile));
        }
        if (vehicleFile) {
          uploadPromises.push(documentApi.createDocument({
              entityType: 'TRUCK',
              entityId: truckId || 'unknown',
              documentType: 'VEHICLE_CONDITION',
              category: 'SAFETY',
              title: `Veh Condition - ${new Date().toLocaleDateString()}`,
              description: `Post-trip vehicle condition photo uploaded by ${driverName || signature}`,
              priority: hasFailures ? 'HIGH' : 'NORMAL'
          }, vehicleFile));
        }
        await Promise.all(uploadPromises);
      }

      toast.success("Post-trip inspection & documents submitted successfully!");
      if (onComplete) onComplete({ odometer, location });
    } catch (error) {
      console.error('Failed to submit post-trip inspection:', error);
      toast.error("Failed to submit post-trip report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[800px]">
      {/* Header */}
      <div className="p-8 pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center text-orange-600">
              <Flag size={24} />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
                <TranslatedText text="Mission Debrief" />
              </h3>
              <p className="text-xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                <TranslatedText text="Post-Trip Checklist" />
              </p>
            </div>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progress</div>
             <div className="text-xl font-black text-orange-600 tracking-tighter">{Math.round(getProgress())}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            className="h-full bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]"
          />
        </div>
      </div>

      {/* Categories Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="space-y-4">
          {categories.map((category) => (
            <div 
              key={category.id}
              className={`rounded-3xl border transition-all ${expandedCategory === category.id ? 'border-orange-100 bg-orange-50/20 dark:border-orange-900/20 dark:bg-orange-900/5 shadow-sm' : 'border-slate-50 dark:border-slate-800'}`}
            >
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="w-full p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedCategory === category.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 font-black'}`}>
                    <category.icon size={20} />
                  </div>
                  <div className="text-left">
                    <p className={`font-black uppercase tracking-widest text-xs transition-colors ${expandedCategory === category.id ? 'text-orange-700 dark:text-orange-400 font-black' : 'text-slate-600 dark:text-slate-400 font-bold'}`}>
                      <TranslatedText text={category.title} />
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                      {category.items.filter(i => i.status !== 'pending').length} / {category.items.length} Verified
                    </p>
                  </div>
                </div>
                {expandedCategory === category.id ? <ChevronDown size={20} className="text-orange-400" /> : <ChevronRight size={20} className="text-slate-300" />}
              </button>

              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-100/50 dark:border-slate-800/50"
                  >
                    <div className="p-4 space-y-2 bg-white/50 dark:bg-slate-900/50">
                      {category.items.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-50 dark:border-slate-800/50 group/item hover:border-orange-100 transition-all shadow-sm"
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
                              <TranslatedText text={item.status === 'pending' ? 'Check' : item.status === 'ok' ? 'Pass' : 'Issue'} />
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
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <TrendingUp size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Final Odometer</span>
                </div>
                <input 
                    type="number" 
                    placeholder="000,000"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-xl font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <MapPin size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Parked Location</span>
                </div>
                <input 
                    type="text" 
                    placeholder="Terminal B-12"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
            </div>
        </div>

        <div className="mb-8 space-y-4">
            <div className="flex items-center gap-3 mb-2 px-1">
                <Camera size={16} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliance Documentation</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                    onClick={() => document.getElementById('pod-upload')?.click()}
                    className={`p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex items-center gap-4 ${podFile ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50 hover:border-orange-200'}`}
                >
                    <input id="pod-upload" type="file" className="hidden" onChange={(e) => setPodFile(e.target.files?.[0] || null)} accept="image/*" />
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${podFile ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>
                        {podFile ? <FileIcon size={20} /> : <Upload size={20} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-tight">{podFile ? podFile.name : 'Proof of Delivery (POD)'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{podFile ? 'Ready to Sync' : 'Tap to Snap Receipt/POD'}</p>
                    </div>
                </div>

                <div 
                    onClick={() => document.getElementById('veh-upload')?.click()}
                    className={`p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex items-center gap-4 ${vehicleFile ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50 hover:border-orange-200'}`}
                >
                    <input id="veh-upload" type="file" className="hidden" onChange={(e) => setVehicleFile(e.target.files?.[0] || null)} accept="image/*" />
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${vehicleFile ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>
                        {vehicleFile ? <FileIcon size={20} /> : <Camera size={20} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-tight">{vehicleFile ? vehicleFile.name : 'Vehicle Condition Photo'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{vehicleFile ? 'Inspection Proof Ready' : 'Mandatory for debrief'}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="mb-8 p-6 bg-slate-100 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
                <PenTool size={16} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Mission Signature</p>
            </div>
            <div className="relative">
                <input 
                    type="text" 
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Sign to certify all unload & vehicle checks"
                    className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 font-medium italic text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 transition-all shadow-inner"
                />
            </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isFullyCompleted() || isSubmitting}
          className={`w-full py-5 rounded-[2.5rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${
            isFullyCompleted() && !isSubmitting
              ? 'bg-[#345E85] text-white shadow-[#345E85]/20 hover:bg-[#0f172a] active:scale-[0.98]' 
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-50'
          }`}
        >
          {isSubmitting ? <TranslatedText text="Submitting..." /> : (
            <>
              <ShieldCheck size={18} />
              <TranslatedText text="Finalize Mission & debrief" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
