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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-[#0f172a] px-6 py-4 flex items-center justify-between border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <FaUser className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-tight">
                                {mode === 'create' ? 'Register New Driver' : 'Edit Driver Profile'}
                            </h2>
                            <p className="text-blue-200 text-xs mt-0.5">Enter driver credentials</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    <div className="grid grid-cols-2 gap-4">
                        {/* First Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                            <div className="relative group">
                                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#135bec] transition-colors" />
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all outline-none placeholder:text-slate-400"
                                    placeholder="e.g. John"
                                />
                            </div>
                        </div>

                        {/* Last Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                            <div className="relative group">
                                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#135bec] transition-colors" />
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all outline-none placeholder:text-slate-400"
                                    placeholder="e.g. Doe"
                                />
                            </div>
                        </div>
                    </div>

                    {/* License Number */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Driver's License No.</label>
                        <div className="relative group">
                            <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#135bec] transition-colors" />
                            <input
                                type="text"
                                name="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all outline-none placeholder:text-slate-400"
                                placeholder="e.g. DL-12345678"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                            <div className="relative group">
                                <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#135bec] transition-colors" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all outline-none placeholder:text-slate-400"
                                    placeholder="+254 7..."
                                />
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience (Years)</label>
                            <input
                                type="number"
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                        <div className="relative group">
                            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#135bec] transition-colors" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] transition-all outline-none placeholder:text-slate-400"
                                placeholder="john.doe@example.com"
                            />
                        </div>
                    </div>

                    {/* Status Selects */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] outline-none"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Availability</label>
                            <select
                                name="availabilityStatus"
                                value={formData.availabilityStatus}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-[#135bec]/20 focus:border-[#135bec] outline-none"
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="ON_TRIP">On Trip</option>
                                <option value="OFF_DUTY">Off Duty</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-[#135bec] to-blue-600 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center gap-2 "
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
