import React, { useState, useEffect } from 'react';
import {
    Fuel,
    X,
    Save,
    AlertTriangle,
    Truck,
    User,
    Droplets,
    DollarSign,
    Camera,
    CheckCircle2,
    Globe,
    MapPin
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fleetApi } from '../../../services/fleetApi';
import { driverApi, type Trip } from '../../../services/driverApi';
import type { FleetItem, Driver } from '../../../services/fleetApi';
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
    const [trucks, setTrucks] = useState<FleetItem[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
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

            if (formData.driverId) {
                const driverTrips = await driverApi.getUpcomingTrips(formData.driverId);
                setTrips(driverTrips);
            }
        } catch (error) {
            console.error('Failed to load resources', error);
            toast.error('Failed to load fleet data');
        }
    };

    useEffect(() => {
        if (formData.driverId) {
            driverApi.getUpcomingTrips(formData.driverId).then(setTrips);
        }
    }, [formData.driverId]);

    const handleOdometerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numVal = parseInt(val);
        setFormData(prev => ({ ...prev, odometer: val }));

        if (formData.truckId && numVal) {
            const selectedTruck = trucks.find(t => t.id === formData.truckId);
            if (selectedTruck && selectedTruck.mileage > numVal) {
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            >
                {/* Header Section */}
                <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
                    <div className="flex items-center gap-5">
                        <div className="size-14 bg-primary-50 rounded-[22px] flex items-center justify-center text-primary-500">
                            <Fuel size={28} />
                        </div>
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-1">Fuel</h2>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Add Log</h1>
                        </div>
                    </div>
                    <button onClick={onClose} className="size-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pb-10 space-y-8 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Main Form Area */}
                        <div className="lg:col-span-12 space-y-8">

                            {/* Row 1: Asset & Pilot */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-jakarta">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Vehicle</label>
                                    <div className="relative group">
                                        <Truck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                        <select
                                            required
                                            value={formData.truckId}
                                            onChange={e => setFormData(prev => ({ ...prev, truckId: e.target.value }))}
                                            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest appearance-none cursor-pointer"
                                        >
                                            <option value="">SELECT TRUCK...</option>
                                            {trucks.map(t => (
                                                <option key={t.id} value={t.id}>{t.plateNumber} | {t.make} {t.model}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Driver</label>
                                    <div className="relative group">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                        <select
                                            required
                                            value={formData.driverId}
                                            onChange={e => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                                            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest appearance-none cursor-pointer"
                                        >
                                            <option value="">SELECT DRIVER...</option>
                                            {drivers.map(d => (
                                                <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trip (Optional)</label>
                                    <div className="relative group">
                                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                        <select
                                            value={formData.tripId}
                                            onChange={e => setFormData(prev => ({ ...prev, tripId: e.target.value }))}
                                            disabled={!formData.driverId}
                                            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-[20px] outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest appearance-none cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="">NO TRIP</option>
                                            {trips.map(t => (
                                                <option key={t.id} value={t.id}>{t.tripNumber} | {t.origin?.city || 'N/A'} → {t.destination?.city || 'N/A'}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Fuel Type & Tax Jurisdiction */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fuel Type</label>
                                    <div className="flex gap-2">
                                        {['Diesel', 'DEF', 'Premium', 'Regular'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, fuelType: type as any }))}
                                                className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.fuelType === type
                                                    ? 'bg-primary-500 text-white border-primary-500'
                                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tax State</label>
                                    <div className="relative group">
                                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                        <select
                                            required
                                            value={formData.jurisdiction}
                                            onChange={e => setFormData(prev => ({ ...prev, jurisdiction: e.target.value }))}
                                            className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-500 transition-all text-xs font-black uppercase tracking-widest appearance-none cursor-pointer"
                                        >
                                            {US_STATES.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Metrics & Calculation */}
                            <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                    <DollarSign size={80} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Volume</label>
                                    <div className="relative group">
                                        <Droplets size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                                        <input
                                            type="number" step="any" required placeholder="0.0"
                                            value={formData.gallons}
                                            onChange={e => setFormData(prev => ({ ...prev, gallons: e.target.value }))}
                                            className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all text-xl font-black text-slate-900"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Price per Gal</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black group-focus-within:text-emerald-500 transition-colors">$</span>
                                        <input
                                            type="number" step="any" required placeholder="0.00"
                                            value={formData.costPerGallon}
                                            onChange={e => setFormData(prev => ({ ...prev, costPerGallon: e.target.value }))}
                                            className="w-full h-14 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all text-xl font-black text-slate-900"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Odometer</label>
                                    <div className="relative">
                                        <input
                                            type="number" required placeholder="MILEAGE"
                                            value={formData.odometer}
                                            onChange={handleOdometerChange}
                                            className={`w-full h-14 px-5 bg-white border ${odometerWarning ? 'border-amber-300' : 'border-slate-200'} rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all text-xl font-black text-slate-900`}
                                        />
                                        {odometerWarning && (
                                            <div className="absolute -bottom-6 left-0 text-[8px] font-black text-amber-600 uppercase">
                                                Inconsistent Reading
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Estimated Cost</label>
                                    <div className="h-14 flex items-center px-6 bg-[#1A1C1E] rounded-2xl border border-slate-800">
                                        <span className="font-black text-xl text-white">
                                            ${((parseFloat(formData.gallons || '0') * parseFloat(formData.costPerGallon || '0')) || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 4: Evidence & Verification */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Refuel Date</label>
                                            <input
                                                type="date" required value={formData.date}
                                                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                                className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tank Status</label>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, isFullTank: !prev.isFullTank }))}
                                                className={`w-full h-12 rounded-xl flex items-center justify-center gap-3 transition-all border ${formData.isFullTank
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}
                                            >
                                                {formData.isFullTank ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    {formData.isFullTank ? 'Full Fill-up' : 'Partial Fill'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Station & Notes</label>
                                        <textarea
                                            placeholder="Enter any notes about this entry..."
                                            value={formData.notes}
                                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full h-24 p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-primary-500 transition-all text-xs font-medium resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Documents</label>
                                    <div className="grid grid-cols-2 gap-4 h-[168px]">
                                        {/* Receipt Photo */}
                                        <div className="relative group">
                                            {receiptPreview ? (
                                                <div className="w-full h-full relative rounded-2xl overflow-hidden border-2 border-primary-500/20">
                                                    <img src={receiptPreview} alt="Receipt" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setReceiptPreview(null)}
                                                            className="px-4 py-2 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                                        >
                                                            Discard
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50/30 transition-all cursor-pointer group">
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'receipt')} />
                                                    <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary-500 group-hover:bg-white transition-all mb-2">
                                                        <Camera size={18} />
                                                    </div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary-500">Receipt Photo</p>
                                                </label>
                                            )}
                                        </div>

                                        {/* Odometer Photo */}
                                        <div className="relative group">
                                            {odometerPreview ? (
                                                <div className="w-full h-full relative rounded-2xl overflow-hidden border-2 border-amber-500/20">
                                                    <img src={odometerPreview} alt="Odometer" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setOdometerPreview(null)}
                                                            className="px-4 py-2 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                                        >
                                                            Discard
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl hover:border-amber-500 hover:bg-amber-50/30 transition-all cursor-pointer group">
                                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'odometer')} />
                                                    <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:bg-white transition-all mb-2">
                                                        <Camera size={18} />
                                                    </div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-500">Odometer Photo</p>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submission Protocol */}
                    <div className="flex items-center gap-6 pt-10 border-t border-slate-50">
                        <button
                            type="button" onClick={onClose}
                            className="flex-1 h-14 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-[22px] transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={submitting}
                            className="flex-[2] h-14 bg-primary-500 text-white font-black text-[10px] uppercase tracking_widest rounded-[22px] hover:bg-primary-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
                        >
                            {submitting ? 'SAVING...' : (
                                <>
                                    <Save size={16} className="group-hover:translate-x-1 transition-transform" />
                                    Save Log
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
