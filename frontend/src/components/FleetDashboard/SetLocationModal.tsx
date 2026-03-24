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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-700 flex items-center justify-center">
                            <FaMapMarkerAlt className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Set Location</h2>
                            <p className="text-xs text-purple-200">{truck.plateNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-purple-200 hover:text-white transition-colors">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Address / Location Name</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            placeholder="e.g. Nairobi, Kenya"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Latitude (optional)</label>
                            <input
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                placeholder="-1.2921"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Longitude (optional)</label>
                            <input
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                placeholder="36.8219"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
