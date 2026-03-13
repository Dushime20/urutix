import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '../services/tenantApi';
import toast from 'react-hot-toast';
import { FaCheck, FaTimes, FaFileAlt, FaShieldAlt, FaSpinner, FaCloudUploadAlt } from 'react-icons/fa';

interface TenantKYCModalProps {
    tenantId: string;
    tenantName: string;
    currentStatus: 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'INCOMPLETE';
    kycData?: any;
    isOpen: boolean;
    onClose: () => void;
}

const TenantKYCModal: React.FC<TenantKYCModalProps> = ({
    tenantId,
    tenantName,
    currentStatus,
    kycData,
    isOpen,
    onClose,
}) => {
    const qc = useQueryClient();
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    // State for manual submission (if admin is uploading on behalf of tenant)
    const [isSubmittingMode, setIsSubmittingMode] = useState(false);
    const [registrationNumber, setRegistrationNumber] = useState(kycData?.registrationNumber || '');
    const [taxId, setTaxId] = useState(kycData?.taxId || '');

    const { mutate: updateStatus, isPending: isUpdating } = useMutation({
        mutationFn: ({ status, notes }: { status: 'APPROVED' | 'REJECTED' | 'INCOMPLETE' | 'UNDER_REVIEW'; notes?: string }) =>
            tenantApi.updateKYCStatus(tenantId, status, notes),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-tenants'] });
            qc.invalidateQueries({ queryKey: ['tenant-details', tenantId] });
            toast.success('KYC status updated successfully');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to update KYC status');
        },
    });

    const { mutate: submitData, isPending: isSubmitting } = useMutation({
        mutationFn: (data: any) => tenantApi.submitKYC(tenantId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-tenants'] });
            qc.invalidateQueries({ queryKey: ['tenant-details', tenantId] });
            toast.success('KYC data submitted successfully');
            setIsSubmittingMode(false);
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to submit KYC data');
        }
    });


    if (!isOpen) return null;

    const handleSubmit = () => {
        submitData({
            registrationNumber,
            taxId,
            // In a real app, file upload logic would go here
        })
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FaShieldAlt className="text-gray-700" />
                        <h2 className="text-lg font-bold text-gray-900">KYC Verification: {tenantName}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FaTimes />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Banner */}
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${
                        currentStatus === 'APPROVED' ? 'bg-green-50 text-green-800' :
                        currentStatus === 'REJECTED' ? 'bg-red-50 text-red-800' :
                        currentStatus === 'SUBMITTED' ? 'bg-blue-50 text-blue-800' :
                        currentStatus === 'UNDER_REVIEW' ? 'bg-yellow-50 text-yellow-800' :
                        'bg-gray-50 text-gray-800'
                    }`}>
                        <span className="font-bold">Current Status:</span>
                        <span>{currentStatus}</span>
                        {currentStatus === 'SUBMITTED' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-auto">
                                Awaiting Review
                            </span>
                        )}
                        {currentStatus === 'UNDER_REVIEW' && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full ml-auto">
                                In Progress
                            </span>
                        )}
                    </div>

                    {/* Submitted Data View or Edit Mode */}
                    {(currentStatus === 'PENDING' || currentStatus === 'INCOMPLETE' || isSubmittingMode) ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-gray-800">Registration Details</h3>
                                {!isSubmittingMode && (
                                    <button
                                        onClick={() => setIsSubmittingMode(true)}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Edit / Upload
                                    </button>
                                )}
                            </div>

                            {isSubmittingMode ? (
                                <div className="space-y-3 border p-4 rounded-lg bg-gray-50">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Registration Number</label>
                                        <input
                                            type="text"
                                            value={registrationNumber}
                                            onChange={(e) => setRegistrationNumber(e.target.value)}
                                            className="w-full border rounded p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tax ID</label>
                                        <input
                                            type="text"
                                            value={taxId}
                                            onChange={(e) => setTaxId(e.target.value)}
                                            className="w-full border rounded p-2 text-sm"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                                        >
                                            {isSubmitting && <FaSpinner className="animate-spin" />}
                                            Submit KYC Data
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 italic">
                                    No active KYC submission. User needs to submit documents or Admin can upload manually.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 border-b pb-2">Submitted Documents & Data</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 block">Registration Number</span>
                                    <span className="font-medium text-gray-900">{kycData?.registrationNumber || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block">Tax ID</span>
                                    <span className="font-medium text-gray-900">{kycData?.taxId || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Mock Document List */}
                            <div className="mt-4">
                                <span className="text-gray-500 block text-xs uppercase font-bold mb-2">Documents</span>
                                {kycData?.documents?.length > 0 ? (
                                    <ul className="space-y-2">
                                        {kycData.documents.map((doc: any, idx: number) => (
                                            <li key={idx} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                                <FaFileAlt className="text-gray-400" />
                                                <span className="text-sm text-blue-600 hover:underline">{doc.type}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <span className="text-gray-400 text-sm">No documents attached.</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        {showRejectForm ? (
                            <div className="w-full space-y-3">
                                <textarea
                                    placeholder="Reason for rejection..."
                                    className="w-full border p-2 rounded text-sm"
                                    rows={3}
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowRejectForm(false)}
                                        className="text-gray-600 text-sm px-3 py-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => updateStatus({ status: 'REJECTED', notes: rejectReason })}
                                        disabled={isUpdating || !rejectReason}
                                        className="bg-red-600 text-white text-sm px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Confirm Rejection
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                {(currentStatus === 'SUBMITTED' || currentStatus === 'PENDING') && (
                                    <>
                                        <button
                                            onClick={() => updateStatus({ status: 'UNDER_REVIEW' })}
                                            disabled={isUpdating}
                                            className="px-4 py-2 border border-blue-200 text-blue-600 rounded hover:bg-blue-50"
                                        >
                                            Mark Under Review
                                        </button>
                                        <button
                                            onClick={() => setShowRejectForm(true)}
                                            disabled={isUpdating}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => updateStatus({ status: 'APPROVED' })}
                                            disabled={isUpdating}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                        >
                                            {isUpdating && <FaSpinner className="animate-spin" />}
                                            Approve KYC
                                        </button>
                                    </>
                                )}
                                {currentStatus === 'UNDER_REVIEW' && (
                                    <>
                                        <button
                                            onClick={() => setShowRejectForm(true)}
                                            disabled={isUpdating}
                                            className="px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => updateStatus({ status: 'APPROVED' })}
                                            disabled={isUpdating}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                                        >
                                            {isUpdating && <FaSpinner className="animate-spin" />}
                                            Approve KYC
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantKYCModal;
