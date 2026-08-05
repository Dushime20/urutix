import React, { useState, useEffect } from 'react';
import { type Driver } from '../../services/fleetApi';
import { FaTimes, FaUser, FaIdCard, FaPhone, FaEnvelope, FaSpinner } from 'react-icons/fa';

interface DriverFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: Driver | null;
    mode: 'create' | 'edit';
}

const DriverFormModal: React.FC<DriverFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    mode
}) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        licenseNumber: '',
        phone: '',
        email: '',
        status: 'ACTIVE',
        availabilityStatus: 'AVAILABLE',
        experience: 0
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData && mode === 'edit') {
            setFormData({
                firstName: initialData.firstName || '',
                lastName: initialData.lastName || '',
                licenseNumber: initialData.licenseNumber || '',
                phone: initialData.phone || '',
                email: initialData.email || '',
                status: initialData.status || 'ACTIVE',
                availabilityStatus: initialData.availabilityStatus || 'AVAILABLE',
                experience: initialData.experience || 0
            });
        } else {
            // Reset form for create mode
            setFormData({
                firstName: '',
                lastName: '',
                licenseNumber: '',
                phone: '',
                email: '',
                status: 'ACTIVE',
                availabilityStatus: 'AVAILABLE',
                experience: 0
            });
        }
    }, [initialData, mode, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting driver form:', error);
            // Toast is handled by parent or api service usually, but we can add one here if needed
            // toast.error('Failed to save driver'); 
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-gray-950/90 backdrop-blur-sm p-4 overflow-y-auto transition-all duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl dark:shadow-none border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden transform transition-all duration-200">
                {/* Header */}
                <div className="bg-white dark:bg-gray-950 px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-900/40 flex items-center justify-center transition-colors">
                            <FaUser className="text-white dark:text-blue-400 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-gray-900 dark:text-white font-semibold text-lg leading-tight transition-colors">
                                {mode === 'create' ? 'Register New Driver' : 'Edit Driver Profile'}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 transition-colors tracking-wide">Enter driver credentials</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-gray-800 p-2 rounded-lg transition-all"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    <div className="grid grid-cols-2 gap-4">
                        {/* First Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">First Name</label>
                            <div className="relative group">
                                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    placeholder="e.g. John"
                                />
                            </div>
                        </div>

                        {/* Last Name */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Last Name</label>
                            <div className="relative group">
                                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    placeholder="e.g. Doe"
                                />
                            </div>
                        </div>
                    </div>

                    {/* License Number */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Driver's License No.</label>
                        <div className="relative group">
                            <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                name="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="e.g. DL-12345678"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Phone Number</label>
                            <div className="relative group">
                                <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    placeholder="+254 7..."
                                />
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Experience (Years)</label>
                            <input
                                type="number"
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Email Address</label>
                        <div className="relative group">
                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                placeholder="john.doe@example.com"
                            />
                        </div>
                    </div>

                    {/* Status Selects */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Account Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Availability</label>
                            <select
                                name="availabilityStatus"
                                value={formData.availabilityStatus}
                                onChange={handleChange}
                                className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 outline-none transition-all"
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="ON_TRIP">On Trip</option>
                                <option value="OFF_DUTY">Off Duty</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-white bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm dark:shadow-none"
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin" /> Saving...
                                </>
                            ) : (
                                mode === 'create' ? 'Create Driver' : 'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DriverFormModal;
