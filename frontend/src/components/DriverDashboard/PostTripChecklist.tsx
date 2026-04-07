import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  ChevronRight, 
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
  File as FileIcon,
  ArrowLeft,
  ArrowRight,
  Check
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
  const [currentStep, setCurrentStep] = useState(1);
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

  const isStep1Valid = () => odometer.trim().length > 0 && location.trim().length > 0;
  const isStep2Valid = () => categories.flatMap(c => c.items).every(i => i.status !== 'pending');
  const isStep4Valid = () => signature.trim().length > 0;

  const handleSubmit = async () => {
    if (!isStep4Valid()) {
      toast.error("Please sign to authorize the mission debrief.");
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

      if (podFile || vehicleFile) {
        const uploadPromises = [];
        if (podFile && driverId) {
          uploadPromises.push(documentApi.createDocument({
              entityType: 'DRIVER',
              entityId: driverId,
              documentType: 'PROOF_OF_DELIVERY',
              category: 'OPERATIONAL',
              title: `POD - Trip Closure - ${new Date().toLocaleDateString()}`,
              description: `Proof of Delivery uploaded during post-trip checklist by ${driverName || signature}`,
              priority: 'NORMAL'
          }, podFile));
        }
        if (vehicleFile && truckId) {
          uploadPromises.push(documentApi.createDocument({
              entityType: 'TRUCK',
              entityId: truckId,
              documentType: 'VEHICLE_CONDITION',
              category: 'SAFETY',
              title: `Veh Condition - ${new Date().toLocaleDateString()}`,
              description: `Post-trip vehicle condition photo uploaded by ${driverName || signature}`,
              priority: hasFailures ? 'HIGH' : 'NORMAL'
          }, vehicleFile));
        }
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }
      }

      toast.success("Mission debrief submitted successfully!");
      if (onComplete) onComplete({ odometer, location });
    } catch (error) {
      console.error('Failed to submit post-trip inspection:', error);
      toast.error("Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Trip Stats', description: 'Odometer & Location', icon: TrendingUp },
    { id: 2, label: 'Safety Checks', description: 'Inspection items', icon: ClipboardCheck },
    { id: 3, label: 'Mission Media', description: 'Photos & Documents', icon: Camera },
    { id: 4, label: 'Finalize', description: 'Authorization', icon: PenTool },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:flex-row h-full lg:max-h-[850px] relative">
      
      {/* SIDEBAR SIDE-STEPPER (Desktop/Tablet) */}
      <aside className="hidden lg:flex w-80 bg-slate-50/50 dark:bg-slate-950/40 border-r border-slate-100 dark:border-slate-800 flex-col p-10">
        <div className="mb-12">
            <div className="w-12 h-12 rounded-2xl bg-[#345E85] flex items-center justify-center text-white shadow-lg mb-4">
                <Flag size={24} />
            </div>
            <h3 className="text-xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">Mission Debrief</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Post-Trip Closure</p>
        </div>

        <nav className="flex-1 space-y-1 relative">
            {/* Connection Line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800" />
            
            {steps.map((s) => {
                const isActive = s.id === currentStep;
                const isCompleted = s.id < currentStep;
                const isUpcoming = s.id > currentStep;

                return (
                    <div 
                        key={s.id}
                        className={`relative flex items-center gap-6 p-4 rounded-[1.5rem] transition-all duration-300 ${isActive ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm' : ''}`}
                    >
                        <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 font-bold
                            ${isActive ? 'bg-[#345E85] text-white shadow-[#345E85]/20' : 
                              isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                        >
                            {isCompleted ? <Check size={20} /> : <s.icon size={20} />}
                        </div>
                        
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-[#345E85]' : isCompleted ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {s.label}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{s.description}</p>
                        </div>

                        {isActive && (
                            <motion.div 
                                layoutId="activeStep"
                                className="absolute -left-2 w-1 h-6 bg-[#345E85] rounded-full"
                            />
                        )}
                    </div>
                );
            })}
        </nav>

        <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Progress</span>
                <span className="text-sm font-black text-slate-800 dark:text-white italic">{Math.round((currentStep / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${(currentStep / steps.length) * 100}%` }} className="h-full bg-[#345E85]" />
            </div>
        </div>
      </aside>

      {/* TOP-STEPPER (Mobile Fallback) */}
      <div className="lg:hidden p-6 pb-2 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50">
           <div className="flex items-center gap-1.5">
                {steps.map((s) => (
                    <div 
                        key={s.id}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${s.id === currentStep ? 'bg-[#345E85] w-8' : s.id < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                    />
                ))}
            </div>
            <div className="text-right">
                <p className="text-[8px] font-black text-slate-400 uppercase">Step {currentStep}/4</p>
                <p className="text-[10px] font-black text-[#345E85] uppercase tracking-tighter">{steps[currentStep-1].label}</p>
            </div>
      </div>

      {/* MAIN CONTENT AREA (Right) */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
            {currentStep === 1 && (
                <motion.div 
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="absolute inset-0 p-8 md:p-12 lg:p-20 overflow-y-auto custom-scrollbar"
                >
                <div className="max-w-xl mx-auto space-y-12">
                    <div className="space-y-3">
                        <h4 className="text-3xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight italic">Trip Stats Verification</h4>
                        <p className="text-sm font-medium text-slate-400">Please provide your final mission metrics.</p>
                    </div>

                    <div className="grid gap-10">
                        <div className="p-10 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-sm focus-within:ring-4 focus-within:ring-[#345E85]/5 transition-all">
                            <div className="flex items-center gap-3 mb-6 text-slate-400">
                                <TrendingUp size={20} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-black text-slate-500">Current Odometer (KM)</span>
                            </div>
                            <input 
                                type="number" 
                                placeholder="000,000"
                                value={odometer}
                                onChange={(e) => setOdometer(e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-5xl font-black text-[#345E85] dark:text-teal-400 italic focus:outline-none placeholder:text-slate-200 dark:placeholder:text-slate-800 tracking-tighter"
                            />
                        </div>

                        <div className="p-10 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-sm focus-within:ring-4 focus-within:ring-[#345E85]/5 transition-all">
                            <div className="flex items-center gap-3 mb-6 text-slate-400">
                                <MapPin size={20} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-black text-slate-500">Parked At Location</span>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Terminal B / Gate 12"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight focus:outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700 font-black"
                            />
                        </div>
                    </div>
                </div>
                </motion.div>
            )}

            {currentStep === 2 && (
                <motion.div 
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="absolute inset-0 p-8 md:p-12 overflow-y-auto custom-scrollbar"
                >
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <div className="space-y-1">
                            <h4 className="text-2xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">Post-Operational Checks</h4>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">All systems must be verified</p>
                        </div>
                        <div className="text-right">
                           <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Checklist</div>
                           <div className="text-xl font-black text-emerald-500 tracking-tight italic">
                              {categories.flatMap(c => c.items).filter(i => i.status !== 'pending').length} / {categories.flatMap(c => c.items).length}
                           </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {categories.map((category) => (
                            <div 
                                key={category.id}
                                className={`rounded-[2rem] border transition-all ${expandedCategory === category.id ? 'border-[#345E85]/20 bg-[#345E85]/5 dark:border-[#345E85]/20 dark:bg-[#345E85]/5' : 'border-slate-50 dark:border-slate-800 bg-slate-50/20'}`}
                            >
                                <button
                                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                                    className="w-full p-6 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${expandedCategory === category.id ? 'bg-[#345E85] text-white shadow-lg shadow-blue-900/10' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}>
                                            <category.icon size={22} />
                                        </div>
                                        <div className="text-left font-black uppercase tracking-widest text-[#0f172a] dark:text-slate-300 text-xs"><TranslatedText text={category.title} /></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black italic shadow-inner ${category.items.every(i => i.status === 'ok') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {category.items.filter(i => i.status !== 'pending').length}/{category.items.length}
                                        </div>
                                        {expandedCategory === category.id ? <ArrowLeft size={16} className="rotate-90 text-[#345E85]" /> : <ChevronRight size={18} className="text-slate-300" />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {expandedCategory === category.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-[#345E85]/10"
                                        >
                                            <div className="p-4 space-y-3">
                                                {category.items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-50 dark:border-slate-800/50 shadow-sm hover:border-[#345E85]/20 group transition-all">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-tight italic"><TranslatedText text={item.label} /></span>
                                                        <button
                                                            onClick={() => toggleStatus(category.id, item.id)}
                                                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                                                                item.status === 'ok' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                                                                item.status === 'fail' ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                                                            }`}
                                                        >
                                                            <TranslatedText text={item.status === 'pending' ? 'TAP TO CHECK' : item.status === 'ok' ? 'PASSED' : 'ISSUE'} />
                                                        </button>
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
                </motion.div>
            )}

            {currentStep === 3 && (
                <motion.div 
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="absolute inset-0 p-8 md:p-12 lg:p-20 overflow-y-auto custom-scrollbar"
                >
                <div className="max-w-2xl mx-auto space-y-12">
                    <div className="space-y-3">
                        <h4 className="text-3xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight italic">Compliance Documentation</h4>
                        <p className="text-sm font-medium text-slate-400">Capture Proof of Delivery and vehicle condition.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div 
                        onClick={() => document.getElementById('pod-side-upload')?.click()}
                        className={`p-10 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer group text-center space-y-6 ${podFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50 hover:border-[#345E85]/50'}`}
                        >
                            <input id="pod-side-upload" type="file" className="hidden" onChange={(e) => setPodFile(e.target.files?.[0] || null)} accept="image/*" />
                            <div className={`w-20 h-20 rounded-[1.8rem] mx-auto flex items-center justify-center transition-all shadow-xl ${podFile ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 group-hover:scale-110'}`}>
                                {podFile ? <CheckCircle2 size={36} /> : <Upload size={36} />}
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#0f172a] dark:text-slate-200 uppercase tracking-tight">{podFile ? podFile.name : 'Proof of Delivery'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">TAP TO SCAN SIGNED POD</p>
                            </div>
                        </div>

                        <div 
                        onClick={() => document.getElementById('veh-side-upload')?.click()}
                        className={`p-10 rounded-[3rem] border-2 border-dashed transition-all cursor-pointer group text-center space-y-6 ${vehicleFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50 hover:border-[#345E85]/50'}`}
                        >
                            <input id="veh-side-upload" type="file" className="hidden" onChange={(e) => setVehicleFile(e.target.files?.[0] || null)} accept="image/*" />
                            <div className={`w-20 h-20 rounded-[1.8rem] mx-auto flex items-center justify-center transition-all shadow-xl ${vehicleFile ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 group-hover:scale-110'}`}>
                                {vehicleFile ? <CheckCircle2 size={36} /> : <Camera size={36} />}
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#0f172a] dark:text-slate-200 uppercase tracking-tight">{vehicleFile ? vehicleFile.name : 'Vehicle Condition'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">SNAP WALKAROUND PROOF</p>
                            </div>
                        </div>
                    </div>
                </div>
                </motion.div>
            )}

            {currentStep === 4 && (
                <motion.div 
                key="step4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="absolute inset-0 p-8 md:p-12 lg:p-20 overflow-y-auto custom-scrollbar"
                >
                <div className="max-w-xl mx-auto space-y-12">
                    <div className="space-y-3">
                        <h4 className="text-3xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight italic">Mission Authorization</h4>
                        <p className="text-sm font-medium text-slate-400">Finalize and certify all mission closure data.</p>
                    </div>

                    <div className="bg-slate-100/50 dark:bg-slate-800/40 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800/50 space-y-8">
                        <div className="flex items-center justify-between pb-6 border-b border-white dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <TrendingUp size={16} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Odometer</span>
                            </div>
                            <span className="text-2xl font-black text-[#345E85] dark:text-teal-400 italic font-mono tracking-tighter">{odometer} KM</span>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[.25em] ml-1">Driver Digital Signature</p>
                            <div className="relative group">
                                <PenTool className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-[#345E85] transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    value={signature}
                                    onChange={(e) => setSignature(e.target.value)}
                                    placeholder="Type Your Full Legal Name"
                                    className="w-full h-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] pl-16 pr-8 text-2xl font-black text-[#0f172a] italic focus:outline-none focus:ring-4 focus:ring-[#345E85]/5 focus:border-[#345E85]/40 transition-all shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="text-center bg-blue-50 dark:bg-blue-900/5 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/10">
                        <p className="text-[10px] font-black text-[#345E85] leading-relaxed italic opacity-70">
                            "By finalizing, I certify that all cargo unloads are verified and the physical vehicle condition is accurately reported."
                        </p>
                    </div>
                </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        {/* Global Action Navigation bar (Bottom) */}
        <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/80 backdrop-blur-xl">
             <div className="max-w-4xl mx-auto flex items-center gap-6">
                {currentStep > 1 && (
                    <button 
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="w-20 h-20 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={28} />
                    </button>
                )}
                
                {currentStep < steps.length ? (
                    <button 
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        disabled={currentStep === 1 ? !isStep1Valid() : currentStep === 2 ? !isStep2Valid() : false}
                        className={`flex-1 h-20 rounded-[1.8rem] flex items-center justify-center gap-4 text-xs font-black uppercase tracking-[0.25em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-30 disabled:grayscale ${
                            (currentStep === 1 ? isStep1Valid() : currentStep === 2 ? isStep2Valid() : true) 
                            ? 'bg-[#345E85] text-white shadow-blue-900/20 hover:bg-[#0f172a]' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 shadow-none'
                        }`}
                    >
                        Save & Continue
                        <ArrowRight size={22} />
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmit}
                        disabled={!isStep4Valid() || isSubmitting}
                        className={`flex-1 h-20 rounded-[1.8rem] flex items-center justify-center gap-4 text-xs font-black uppercase tracking-[0.25em] transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 ${
                            isStep4Valid() && !isSubmitting
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 shadow-none font-black'
                        }`}
                    >
                        {isSubmitting ? <TranslatedText text="Authenticating..." /> : (
                            <>
                                <ShieldCheck size={24} />
                                <TranslatedText text="Authorize Mission Closure" />
                            </>
                        )}
                    </button>
                )}
             </div>
        </div>
      </main>
    </div>
  );
};
