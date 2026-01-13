import React, { useState, useEffect } from 'react';
import { FaGasPump, FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { fleetApi } from '../../../services/fleetApi';
import type { FleetItem, Driver } from '../../../services/fleetApi';

interface FuelEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const FuelEntryModal: React.FC<FuelEntryModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);

    // Data Sources
    const [trucks, setTrucks] = useState<FleetItem[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);

    // Form Stats
    const [formData, setFormData] = useState({
        truckId: '',
        driverId: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        gallons: '',
        costPerGallon: '',
        odometer: '',
        location: '',
        fuelCardId: ''
    });

    const [odometerWarning, setOdometerWarning] = useState<string | null>(null);

    // Load Data
    useEffect(() => {
        if (isOpen) {
            loadResources();
        }
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

    // Smart Odometer Check
    const handleOdometerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numVal = parseInt(val);
        setFormData(prev => ({ ...prev, odometer: val }));

        if (formData.truckId && numVal) {
            const selectedTruck = trucks.find(t => t.id === formData.truckId);
            if (selectedTruck && selectedTruck.mileage > numVal) {
                setOdometerWarning(`Warning: Value is lower than current truck mileage (${selectedTruck.mileage.toLocaleString()})`);
            } else {
                setOdometerWarning(null);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const totalCost = parseFloat(formData.gallons) * parseFloat(formData.costPerGallon);

            await fleetApi.addFuelLog({
                truckId: formData.truckId,
                driverId: formData.driverId,
                date: new Date(`${formData.date}T${formData.time}`).toISOString(),
                gallons: parseFloat(formData.gallons),
                costPerGallon: parseFloat(formData.costPerGallon),
                totalCost: totalCost,
                odometer: parseInt(formData.odometer),
                location: formData.location,
                fuelCardId: formData.fuelCardId || undefined
            });

            toast.success('Fuel Log Added Successfully');
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                truckId: '',
                driverId: '',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0].slice(0, 5),
                gallons: '',
                costPerGallon: '',
                odometer: '',
                location: '',
                fuelCardId: ''
            });

        } catch (error) {
            console.error('Failed to add fuel log', error);
            toast.error('Failed to add fuel log');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FaGasPump className="text-amber-500" /> New Fuel Entry
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">

                    {/* Row 1: Who */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</label>
                            <select
                                required
                                value={formData.truckId}
                                onChange={e => {
                                    setFormData(prev => ({ ...prev, truckId: e.target.value }));
                                    // Auto-select driver if assigned? Implementation for later.
                                }}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            >
                                <option value="">Select Vehicle...</option>
                                {trucks.map(t => (
                                    <option key={t.id} value={t.id}>{t.plateNumber} - {t.make} {t.model}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Driver</label>
                            <select
                                required
                                value={formData.driverId}
                                onChange={e => setFormData(prev => ({ ...prev, driverId: e.target.value }))}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            >
                                <option value="">Select Driver...</option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: When & Where */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time</label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location / Station</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Shell #402, Dallas"
                                value={formData.location}
                                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>
                    </div>

                    {/* Row 3: Fuel Details */}
                    <div className="p-5 bg-amber-50 rounded-xl border border-amber-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-700 uppercase tracking-wider">Gallons</label>
                            <input
                                type="number"
                                step="any"
                                required
                                placeholder="0.00"
                                value={formData.gallons}
                                onChange={e => setFormData(prev => ({ ...prev, gallons: e.target.value }))}
                                className="w-full h-12 px-4 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-bold text-lg text-amber-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-700 uppercase tracking-wider">Price / Gal</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-bold">$</span>
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    placeholder="0.00"
                                    value={formData.costPerGallon}
                                    onChange={e => setFormData(prev => ({ ...prev, costPerGallon: e.target.value }))}
                                    className="w-full h-12 pl-8 pr-4 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-bold text-lg text-amber-900"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-700 uppercase tracking-wider">Total Cost</label>
                            <div className="h-12 flex items-center px-4 bg-amber-100 rounded-lg border border-amber-200">
                                <span className="font-bold text-xl text-amber-900">
                                    ${((parseFloat(formData.gallons || '0') * parseFloat(formData.costPerGallon || '0')) || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Odometer & Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Odometer Reading</label>
                            <input
                                type="number"
                                required
                                placeholder="Current Mileage"
                                value={formData.odometer}
                                onChange={handleOdometerChange}
                                className={`w-full h-12 px-4 bg-slate-50 border ${odometerWarning ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'} rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium`}
                            />
                            {odometerWarning && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-red-50 text-red-600 text-xs p-2 rounded border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-1">
                                    <FaExclamationTriangle /> {odometerWarning}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fuel Card ID (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. WEX-1234"
                                value={formData.fuelCardId}
                                onChange={e => setFormData(prev => ({ ...prev, fuelCardId: e.target.value }))}
                                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                        </div>
                    </div>



                    {/* Footer Actions */}
                    <div className="flex items-center gap-4 pt-4 mt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            {submitting ? 'Saving Entry...' : (
                                <>
                                    <FaSave /> Save Fuel Log
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default FuelEntryModal;
