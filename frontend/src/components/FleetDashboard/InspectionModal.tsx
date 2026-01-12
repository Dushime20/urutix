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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center">
                            <FaClipboardCheck className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Schedule Inspection</h2>
                            <p className="text-xs text-slate-400">For {truckName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Inspection Date</label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                                <input
                                    type="date"
                                    value={inspectionDate}
                                    onChange={(e) => setInspectionDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Inspection Type</label>
                            <select
                                value={inspectionType}
                                onChange={(e) => setInspectionType(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm bg-white"
                            >
                                {INSPECTION_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Inspector Name / Agency</label>
                        <div className="relative">
                            <FaHardHat className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <input
                                type="text"
                                value={inspectorName}
                                onChange={(e) => setInspectorName(e.target.value)}
                                placeholder="e.g. John Doe or DEKRA"
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any specific areas to check..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm h-24 resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
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
