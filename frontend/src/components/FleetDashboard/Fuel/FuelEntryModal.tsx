import React, { useState, useEffect } from 'react';
import {
    Fuel,
    X,
    Save,
    AlertTriangle,
    Truck,
    User,
    Droplets,
    Camera,
    CheckCircle2,
    Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fleetApi } from '../../../services/fleetApi';
import { driverApi } from '../../../services/driverApi';
import type { Truck as FleetTruck, Driver } from '../../../services/fleetApi';
import { fuelApi } from '../../../services/fuelApi';
import { motion } from 'framer-motion';

interface FuelEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const FuelEntryModal: React.FC<FuelEntryModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [trucks, setTrucks] = useState<FleetTruck[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [formData, setFormData] = useState({
        truckId: '',
        driverId: '',
        tripId: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        gallons: '',
        costPerGallon: '',
        odometer: '',
        location: '',
        fuelCardId: '',
        fuelType: 'Diesel' as 'Diesel' | 'DEF' | 'Premium' | 'Regular',
        isFullTank: true,
        jurisdiction: 'TX',
        notes: ''
    });
    const [odometerWarning, setOdometerWarning] = useState<string | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [odometerPreview, setOdometerPreview] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) loadResources();
    }, [isOpen]);

    const loadResources = async () => {
        try {
            const [trucksData, driversData] = await Promise.all([
                fleetApi.getTrucks({ status: 'AVAILABLE' }),
                fleetApi.getDrivers({ status: 'ACTIVE' })
            ]);
            setTrucks(trucksData);
            setDrivers(driversData);
        } catch (error) {
            console.error('Failed to load resources', error);
            toast.error('Failed to load fleet data');
        }
    };

    useEffect(() => {
    }, [formData.driverId]);

    const handleOdometerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numVal = parseInt(val);
        setFormData(prev => ({ ...prev, odometer: val }));

        if (formData.truckId && numVal) {
            const selectedTruck = trucks.find(t => t.id === formData.truckId);
            if (selectedTruck && selectedTruck.mileage !== undefined && selectedTruck.mileage > numVal) {
                setOdometerWarning(`Reading is behind current mileage (${selectedTruck.mileage.toLocaleString()})`);
            } else {
                setOdometerWarning(null);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'receipt' | 'odometer') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'receipt') setReceiptPreview(reader.result as string);
                else setOdometerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await fuelApi.createFuelLog({
                truckId: formData.truckId,
                driverId: formData.driverId || undefined,
                tripId: formData.tripId || undefined,
                fuelDate: new Date(`${formData.date}T${formData.time}`).toISOString(),
                gallons: parseFloat(formData.gallons),
                pricePerGallon: parseFloat(formData.costPerGallon),
                odometer: parseInt(formData.odometer) || undefined,
                location: formData.location,
                notes: formData.notes || undefined,
                paymentMethod: formData.fuelCardId ? `Card: ${formData.fuelCardId}` : 'Wallet/Cash',
            });
            toast.success('Fuel log synchronized successfully');
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                truckId: '', driverId: '', tripId: '', date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0].slice(0, 5),
                gallons: '', costPerGallon: '', odometer: '', location: '', fuelCardId: '',
                fuelType: 'Diesel', isFullTank: true, jurisdiction: 'TX', notes: ''
            });
            setReceiptPreview(null);
            setOdometerPreview(null);
        } catch (error) {
            console.error('Failed to add fuel log', error);
            toast.error('Failed to save fuel log');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-colors">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-4xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors"
            >
                {/* Header Section */}
                <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 transition-colors">
                    <div className="flex items-center gap-5">
                        <div className="size-14 bg-primary-50 dark:bg-blue-900/20 rounded-[22px] flex items-center justify-center text-primary-500 dark:text-blue-400">
                            <Fuel size={28} />
                        </div>
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 dark:text-blue-400 mb-1">Fuel</h2>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add Log</h1>
                        </div>
                    </div>
                    <button onClick={onClose} className="size-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 pb-12 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Form Area */}
                        <div className="lg:col-span-12 space-y-10">

                            {/* Row 1: Asset & Pilot */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Operational Asset</label>
                                    <div className="relative group">
                                        <Truck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
                                        <select
                                            required
                                            value={formData.truckId}
                                            onChange={e => setFormData(prev => ({ ...prev, truckId: e.target.value }))}
                                            className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-blue-400/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer text-slate-900 dark:text-white"
                                        >
                                            <option value="" className="bg-white dark:bg-slate-900 text-slate-400">SELECT TRUCK VEHICLE...</option>
                                            {trucks.map(t => (
                                                <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900">{t.plateNumber} | {t.make} {t.model}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Assigned Driver</label>
                                    <div className="relative group">
                                        <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
                                        <select
                                            required
                                            value={formData.driverId}
                                            onChange={e => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                                            className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-blue-400/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer text-slate-900 dark:text-white"
                                        >
                                            <option value="" className="bg-white dark:bg-slate-900 text-slate-400">SELECT VERIFIED DRIVER...</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900">{d.firstName} {d.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Fuel Type & Tax Jurisdiction */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Fuel Specification</label>
                                    <div className="flex gap-2">
                                        {['Diesel', 'DEF', 'Premium', 'Regular'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, fuelType: type as any }))}
                                                className={`flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.fuelType === type
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/10'
                                                    : 'bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Tax Jurisdiction</label>
                                    <div className="relative group">
                                        <Globe size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
                                        <select
                                            required
                                            value={formData.jurisdiction}
                                            onChange={e => setFormData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                                            className="w-full h-14 pl-14 pr-6 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-blue-400/5 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-xs font-black uppercase tracking-widest appearance-none cursor-pointer text-slate-900 dark:text-white"
                                        >
                                            {US_STATES.map(state => (
                                                <option key={state} value={state} className="bg-white dark:bg-slate-900">{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Metrics & Calculation */}
                            <div className="p-10 bg-[#fafafa] dark:bg-slate-950/40 rounded-[3rem] border border-gray-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-10 relative overflow-hidden transition-colors shadow-sm">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none text-blue-600">
                                    <Droplets size={120} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Fuel Volume</label>
                                    <div className="relative group">
                                        <input
                                            type="number" step="any" required placeholder="0.00"
                                            value={formData.gallons}
                                            onChange={e => setFormData(prev => ({ ...prev, gallons: e.target.value }))}
                                            className="w-full h-16 px-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-blue-400/5 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-2xl font-black text-slate-900 dark:text-white"
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase">GAL</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Unit Pricing</label>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 font-black group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400 transition-colors">$</span>
                                        <input
                                            type="number" step="any" required placeholder="0.00"
                                            value={formData.costPerGallon}
                                            onChange={e => setFormData(prev => ({ ...prev, costPerGallon: e.target.value }))}
                                            className="w-full h-16 pl-12 pr-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-500/5 dark:focus:ring-emerald-400/5 focus:border-emerald-500 dark:focus:border-emerald-500 transition-all text-2xl font-black text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Asset Mileage</label>
                                    <div className="relative">
                                        <input
                                            type="number" required placeholder="ODO"
                                            value={formData.odometer}
                                            onChange={handleOdometerChange}
                                            className={`w-full h-16 px-6 bg-white dark:bg-slate-950 border ${odometerWarning ? 'border-amber-300 dark:border-amber-500/50' : 'border-slate-200 dark:border-slate-800'} rounded-2xl outline-none focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-blue-400/5 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-2xl font-black text-slate-900 dark:text-white`}
                                        />
                                        {odometerWarning && (
                                            <div className="absolute -bottom-7 left-0 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight flex items-center gap-1">
                                                <AlertTriangle size={10} /> Discrepancy Detected
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Transaction Value</label>
                                    <div className="h-16 flex items-center px-8 bg-[#1A1C1E] dark:bg-slate-900 rounded-2xl border border-slate-800 dark:border-slate-700 transition-all shadow-xl shadow-slate-900/10">
                                        <span className="font-black text-2xl text-emerald-500 dark:text-emerald-400 tracking-tight">
                                            ${((parseFloat(formData.gallons || '0') * parseFloat(formData.costPerGallon || '0')) || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 4: Evidence & Verification */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Fill Date</label>
                                            <input
                                                type="date" required value={formData.date}
                                                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                                className="w-full h-14 px-6 bg-[#fafafa] dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-900 dark:text-white transition-all focus:border-blue-500 dark:focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Tank Protocol</label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, isFullTank: !prev.isFullTank }))}
                                                className={`w-full h-14 rounded-2xl flex items-center justify-center gap-3 transition-all border ${formData.isFullTank
                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30'
                                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30'
                                                    }`}
                                            >
                                                {formData.isFullTank ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {formData.isFullTank ? 'FULL LOG' : 'PARTIAL LOG'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Internal Remarks</label>
                                        <textarea
                                            placeholder="Enter any administrative notes about this fuel synchronization..."
                                            value={formData.notes}
                                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full h-32 p-6 bg-[#fafafa] dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-[2rem] outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-xs font-medium resize-none text-slate-700 dark:text-slate-300 leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Verification Documents</label>
                                    <div className="grid grid-cols-2 gap-6 h-[204px]">
                                        {/* Receipt Photo */}
                                        <div className="relative group">
                                            {receiptPreview ? (
                                                <div className="w-full h-full relative rounded-[2rem] overflow-hidden border-2 border-blue-500/30 dark:border-blue-500/20 transition-all shadow-xl">
                                                    <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => setReceiptPreview(null)}
                                                            className="px-6 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                                        >
                                                            DISCARD
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer group shadow-sm">
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'receipt')} />
                                                    <div className="size-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:bg-white dark:group-hover:bg-slate-950 transition-all mb-3 shadow-sm">
                                                        <Camera size={24} />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400">RECEIPT CAPTURE</p>
                                                </label>
                                            )}
                                        </div>

                                        {/* Odometer Photo */}
                                        <div className="relative group">
                                            {odometerPreview ? (
                                                <div className="w-full h-full relative rounded-[2rem] overflow-hidden border-2 border-amber-500/30 dark:border-amber-400/20 transition-all shadow-xl">
                                                    <img src={odometerPreview} alt="Odometer" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => setOdometerPreview(null)}
                                                            className="px-6 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                                        >
                                                            DISCARD
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-amber-500 dark:hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all cursor-pointer group shadow-sm">
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'odometer')} />
                                                    <div className="size-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-amber-500 dark:group-hover:text-amber-400 group-hover:bg-white dark:group-hover:bg-slate-950 transition-all mb-3 shadow-sm">
                                                        <Camera size={24} />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400">ODOMETER CAPTURE</p>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submission Protocol */}
                    <div className="flex items-center gap-6 pt-12 border-t border-slate-50 dark:border-slate-800 transition-colors">
                        <button
                            type="button" onClick={onClose}
                            className="flex-1 h-16 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-500 font-black text-[11px] uppercase tracking-[0.2em] rounded-[2rem] transition-all active:scale-95 border border-slate-100 dark:border-slate-800"
                        >
                            CLOSE INTERFACE
                        </button>
                        <button
                            type="submit" disabled={submitting}
                            className="flex-[2] h-16 bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-[2rem] hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-[0.98] group shadow-xl shadow-blue-500/10"
                        >
                            {submitting ? 'SYNCHRONIZING...' : (
                                <>
                                    <Save size={18} className="group-hover:scale-125 transition-transform" />
                                    FINALIZE LOG ENTRY
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default FuelEntryModal;
