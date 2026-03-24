import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaTools, FaTruck, FaMoneyBillWave, FaClipboardList, FaStore } from 'react-icons/fa';
import { fleetApi, type FleetItem } from '../../../services/fleetApi';
import toast from 'react-hot-toast';

interface MaintenanceSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preselectedTruckId?: string;
}

const SERVICE_TYPES = [
    'Preventive Maintenance (PM)',
    'Oil Change',
    'Tire Rotation/Replacement',
    'Brake Service',
    'Engine Repair',
    'Electrical System',
    'Inspection',
    'Other'
];

const MaintenanceSchedulerModal: React.FC<MaintenanceSchedulerModalProps> = ({ isOpen, onClose, onSuccess, preselectedTruckId }) => {
    const [trucks, setTrucks] = useState<FleetItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [selectedTruckId, setSelectedTruckId] = useState(preselectedTruckId || '');
    const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [cost, setCost] = useState<number | ''>('');
    const [vendor, setVendor] = useState('');
    const [nextDueDate, setNextDueDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadTrucks();
            if (preselectedTruckId) setSelectedTruckId(preselectedTruckId);
        }
    }, [isOpen, preselectedTruckId]);

    const loadTrucks = async () => {
        setLoading(true);
        try {
            const data = await fleetApi.getTrucks();
            setTrucks(data || []);
        } catch (error) {
            console.error('Error loading trucks:', error);
            toast.error('Failed to load fleet vehicles');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTruckId || !title || !date) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const maintenanceData = {
                type: serviceType,
                title,
                description: `${description} (Vendor: ${vendor})`,
                date,
                cost: Number(cost) || 0,
                nextDueDate,
                status: 'SCHEDULED',
                priority: 'NORMAL',
                location: vendor
            };

            await fleetApi.scheduleMaintenance(selectedTruckId, maintenanceData);

            toast.success('Maintenance scheduled successfully');
            onSuccess();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error scheduling maintenance:', error);
            toast.error('Failed to schedule maintenance');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedTruckId(preselectedTruckId || '');
        setServiceType(SERVICE_TYPES[0]);
        setTitle('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setCost('');
        setVendor('');
        setNextDueDate('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Panel */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-gray-100">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 flex justify-between items-center border-b border-slate-700/50">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                                    <FaTools className="text-indigo-400" />
                                </div>
                                Schedule Maintenance
                            </h3>
                            <p className="text-slate-400 text-xs mt-1 ml-11">Create a new service appointment</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-6 space-y-6 bg-slate-50/50">

                            {/* Section 1: Vehicle Context */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FaTruck className="text-slate-300" /> Vehicle Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Vehicle *</label>
                                        <div className="relative">
                                            <select
                                                value={selectedTruckId}
                                                onChange={(e) => setSelectedTruckId(e.target.value)}
                                                className="block w-full rounded-lg border-slate-300 bg-slate-50 py-2.5 pl-3 pr-10 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                                required
                                                disabled={!!preselectedTruckId || loading}
                                            >
                                                <option value="">{loading ? 'Loading fleet...' : 'Select a truck...'}</option>
                                                {trucks.map(truck => (
                                                    <option key={truck.id} value={truck.id}>
                                                        {truck.plateNumber} - {truck.make} {truck.model}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Service Type</label>
                                        <select
                                            value={serviceType}
                                            onChange={(e) => setServiceType(e.target.value)}
                                            className="block w-full rounded-lg border-slate-300 bg-slate-50 py-2.5 pl-3 pr-10 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                        >
                                            {SERVICE_TYPES.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Service Details */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FaClipboardList className="text-slate-300" /> Service Details
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title / Summary *</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g. 50,000km Preventive Maintenance"
                                            className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description & Notes</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all resize-none"
                                            placeholder="Enter any specific instructions or reported issues..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Logistics */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FaCalendarAlt className="text-slate-300" /> Schedule & Cost
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date *</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Est. Cost ($)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaMoneyBillWave className="text-slate-400" />
                                            </div>
                                            <input
                                                type="number"
                                                value={cost}
                                                onChange={(e) => setCost(e.target.value ? Number(e.target.value) : '')}
                                                placeholder="0.00"
                                                className="block w-full rounded-lg border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Service Provider</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaStore className="text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={vendor}
                                                onChange={(e) => setVendor(e.target.value)}
                                                placeholder="e.g. Official Dealer"
                                                className="block w-full rounded-lg border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Next Due (Optional)</label>
                                        <input
                                            type="date"
                                            value={nextDueDate}
                                            onChange={(e) => setNextDueDate(e.target.value)}
                                            className="block w-full rounded-lg border-slate-300 py-2.5 px-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 rounded-b-2xl border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Scheduling...' : 'Confirm Schedule'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceSchedulerModal;
