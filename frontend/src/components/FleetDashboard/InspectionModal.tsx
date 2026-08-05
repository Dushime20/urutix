import React, { useState, useEffect } from 'react';
import { FaTimes, FaCalendarAlt, FaClipboardCheck, FaHardHat } from 'react-icons/fa';
import { fleetApi } from '../../services/fleetApi';
import toast from 'react-hot-toast';

interface InspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    truckId: string;
    truckName: string;
    onInspectionScheduled: () => void;
}

const INSPECTION_TYPES = [
    'Routine Safety Check',
    'Maintenance Inspection',
    'Pre-Trip Inspection',
    'Post-Trip Inspection',
    'Annual Certification',
    'Tire & Brake Check'
];

const InspectionModal: React.FC<InspectionModalProps> = ({ isOpen, onClose, truckId, truckName, onInspectionScheduled }) => {
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
    const [inspectorName, setInspectorName] = useState('');
    const [inspectionType, setInspectionType] = useState(INSPECTION_TYPES[0]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!isOpen) {
            // Reset form when closed
            setInspectionDate(new Date().toISOString().split('T')[0]);
            setInspectorName('');
            setInspectionType(INSPECTION_TYPES[0]);
            setNotes('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                truckId,
                date: inspectionDate,
                inspectorName,
                type: inspectionType,
                notes,
                status: 'SCHEDULED', // Default status for new schedule
                createdAt: new Date().toISOString()
            };

            await fleetApi.createSafetyInspection(payload);

            toast.success('Inspection scheduled successfully');
            onInspectionScheduled();
            onClose();
        } catch (error) {
            console.error('Error scheduling inspection:', error);
            toast.error('Failed to schedule inspection');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-gray-950/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-300">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl dark:shadow-none max-w-lg w-full overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 transform transition-all duration-200">

                {/* Header */}
                <div className="bg-white dark:bg-gray-950 px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-blue-600 dark:bg-blue-900/40 flex items-center justify-center transition-colors">
                            <FaClipboardCheck className="text-white dark:text-blue-400 text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">Schedule Inspection</h2>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">For {truckName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-gray-800 p-2 rounded-lg transition-all">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">Inspection Date</label>
                            <div className="relative group">
                                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors text-sm" />
                                <input
                                    type="date"
                                    value={inspectionDate}
                                    onChange={(e) => setInspectionDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">Inspection Type</label>
                            <select
                                value={inspectionType}
                                onChange={(e) => setInspectionType(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none"
                            >
                                {INSPECTION_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">Inspector Name / Agency</label>
                        <div className="relative group">
                            <FaHardHat className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors text-sm" />
                            <input
                                type="text"
                                value={inspectorName}
                                onChange={(e) => setInspectorName(e.target.value)}
                                placeholder="e.g. John Doe or DEKRA"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 transition-colors">Notes / Instructions</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any specific areas to check..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none h-24 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 mt-4 transition-colors">
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
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting ? 'Scheduling...' : 'Schedule Inspection'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default InspectionModal;
