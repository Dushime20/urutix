import React, { useState } from 'react';
import { FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import { fleetApi } from '../../services/fleetApi';
import toast from 'react-hot-toast';

interface SetLocationModalProps {
    truck: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export const SetLocationModal: React.FC<SetLocationModalProps> = ({ truck, isOpen, onClose, onUpdate }) => {
    const [address, setAddress] = useState(
        typeof truck?.currentLocation === 'string'
            ? truck.currentLocation
            : truck?.currentLocation?.address || ''
    );
    const [latitude, setLatitude] = useState(
        truck?.currentLocation?.latitude?.toString() || ''
    );
    const [longitude, setLongitude] = useState(
        truck?.currentLocation?.longitude?.toString() || ''
    );
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const locationData: any = { currentLocation: address };

            // If lat/lng provided, use structured location
            if (latitude && longitude) {
                locationData.currentLocation = {
                    address,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                };
            }

            await fleetApi.updateTruck(truck.id, locationData);
            toast.success(`Location updated for ${truck.plateNumber}`);
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error updating location:', error);
            toast.error(error?.response?.data?.message || 'Failed to update location');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-gray-950/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl dark:shadow-none max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-800 transform transition-all duration-200">
                {/* Header */}
                <div className="bg-white dark:bg-gray-950 px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-blue-600 dark:bg-blue-900/40 flex items-center justify-center transition-colors">
                            <FaMapMarkerAlt className="text-white dark:text-blue-400 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">Set Location</h2>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">{truck.plateNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-gray-800 p-2 rounded-lg transition-all">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">Address / Location Name</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            placeholder="e.g. Nairobi, Kenya"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">Latitude (optional)</label>
                            <input
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none"
                                placeholder="-1.2921"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">Longitude (optional)</label>
                            <input
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none"
                                placeholder="36.8219"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-6 transition-colors">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Saving...' : 'Update Location'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SetLocationModal;
