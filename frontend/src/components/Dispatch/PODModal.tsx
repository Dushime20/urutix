import React, { useState, useRef } from 'react';
import { FaTimes, FaCamera, FaUpload, FaPen, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { fleetApi } from '../../services/fleetApi';

interface PODModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    vehicleName: string;
    onComplete: () => void;
}

const PODModal: React.FC<PODModalProps> = ({ isOpen, onClose, tripId, vehicleName, onComplete }) => {
    const [step, setStep] = useState<1 | 2>(1); // 1: Photo, 2: Signature/Confirm
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [receiverName, setReceiverName] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Photo Upload Handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    // Submission Handler
    const handleSubmit = async () => {
        if (!file || !receiverName) {
            toast.error('Please upload a photo and enter receiver name');
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading('Uploading Proof of Delivery...');

        try {
            // 1. Upload Photo
            const podUrl = await fleetApi.uploadPOD(tripId, file);

            // 2. Complete Trip
            await fleetApi.completeTrip(tripId, {
                podUrl,
                receiverName,
                notes,
                completedAt: new Date().toISOString()
            });

            toast.success('Trip Completed Successfully!', { id: toastId });
            onComplete();
            onClose();
        } catch (error) {
            console.error('POD Submission Failed:', error);
            toast.error('Failed to submit Proof of Delivery', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <FaCheckCircle className="text-emerald-500" /> Complete Delivery
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Vehicle: {vehicleName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="font-bold text-slate-800 mb-2">Step 1: Capture POD</h3>
                                <p className="text-sm text-slate-500">Upload a photo of the signed document or delivered cargo.</p>
                            </div>

                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 transition-colors relative group cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {previewUrl ? (
                                    <div className="relative h-48 w-full">
                                        <img src={previewUrl} alt="POD Preview" className="w-full h-full object-contain rounded-lg" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                            <p className="text-white font-bold flex items-center gap-2">
                                                <FaCamera /> Change Photo
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50">
                                            <FaUpload className="text-2xl" />
                                        </div>
                                        <p className="font-medium">Click to upload photo</p>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!file}
                                onClick={() => setStep(2)}
                                className="w-full py-3 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                            >
                                Next Step
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="font-bold text-slate-800 mb-1">Step 2: Confirmation</h3>
                                <p className="text-sm text-slate-500">Enter receiver details to finalize.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Received By (Name)</label>
                                <div className="relative">
                                    <FaPen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={receiverName}
                                        onChange={e => setReceiverName(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Delivery Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none text-sm"
                                    placeholder="Any comments about the delivery condition..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !receiverName}
                                    className="flex-[2] py-3 bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? 'Completing...' : 'Complete Delivery'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PODModal;
