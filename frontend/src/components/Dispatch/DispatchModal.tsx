import React, { useState, useEffect } from 'react';
import { FaTimes, FaMapMarkerAlt, FaTruck, FaUser } from 'react-icons/fa';
import { fleetApi, type FleetItem, type Driver } from '../../services/fleetApi';
import toast from 'react-hot-toast';

interface DispatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const DispatchModal: React.FC<DispatchModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [params, setParams] = useState({
        truckId: '',
        driverId: '',
        origin: '',
        destination: '',
        notes: ''
    });

    const [trucks, setTrucks] = useState<FleetItem[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fetchedTrucks, fetchedDrivers] = await Promise.all([
                fleetApi.getTrucks({ status: 'AVAILABLE' }), // Prefer available trucks
                fleetApi.getDrivers({ status: 'ACTIVE' }) // Prefer active drivers
            ]);
            setTrucks(fetchedTrucks);
            setDrivers(fetchedDrivers);
        } catch (error) {
            console.error('Error fetching dispatch resources:', error);
            toast.error('Failed to load available resources');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(params);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <FaMapMarkerAlt /> New Dispatch Trip
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Vehicle</label>
                            <div className="relative">
                                <FaTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                <select
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                                    value={params.truckId}
                                    onChange={e => setParams({ ...params, truckId: e.target.value })}
                                    required
                                    disabled={loading}
                                >
                                    <option value="">{loading ? 'Loading...' : 'Select Truck'}</option>
                                    {trucks.map(truck => (
                                        <option key={truck.id} value={truck.id}>
                                            {truck.plateNumber} ({truck.make} {truck.model})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Assign Driver</label>
                            <div className="relative">
                                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                <select
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                                    value={params.driverId}
                                    onChange={e => setParams({ ...params, driverId: e.target.value })}
                                    required
                                    disabled={loading}
                                >
                                    <option value="">{loading ? 'Loading...' : 'Select Driver'}</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.firstName} {driver.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Origin</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                placeholder="Start location"
                                value={params.origin}
                                onChange={e => setParams({ ...params, origin: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Destination</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                placeholder="End location"
                                value={params.destination}
                                onChange={e => setParams({ ...params, destination: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Trip Notes</label>
                        <textarea
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm h-24 resize-none"
                            placeholder="Special instructions, cargo details..."
                            value={params.notes}
                            onChange={e => setParams({ ...params, notes: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm text-sm"
                        >
                            Create Dispatch
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default DispatchModal;
