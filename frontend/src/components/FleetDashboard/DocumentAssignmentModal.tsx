import React, { useState, useEffect } from 'react';
import { FaTimes, FaFileAlt, FaPlus } from 'react-icons/fa';
import { fleetApi } from '../../services/fleetApi';
import { documentApi } from '../../services/documents/documentApi'; // Import documentApi
import toast from 'react-hot-toast';

interface DocumentAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityId: string;
    entityName: string;
    entityType: 'truck' | 'driver';
}

interface ComplianceRecord {
    id: string;
    regulation: string; // Used as Document Type
    requirement: string; // Used as Reference Number
    status: string;
    dueDate: string; // Expiry Date
    lastChecked: string; // Issue Date
    notes?: string;
    documentation?: string[];
}

const TRUCK_DOCUMENTS = [
    'Registration',
    'Insurance',
    'Roadworthiness Certificate',
    'Permit',
    'Inspection Report',
    'Tax Disc',
    'Other'
];

const DRIVER_DOCUMENTS = [
    'Driver License',
    'Medical Certificate',
    'ID Card / Passport',
    'Good Conduct Certificate',
    'Defensive Driving Cert',
    'Other'
];

const DocumentAssignmentModal: React.FC<DocumentAssignmentModalProps> = ({ isOpen, onClose, entityId, entityName, entityType }) => {
    const [documents, setDocuments] = useState<ComplianceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    const docTypes = entityType === 'truck' ? TRUCK_DOCUMENTS : DRIVER_DOCUMENTS;

    // Form State
    const [newDocType, setNewDocType] = useState(docTypes[0]);
    const [newDocRef, setNewDocRef] = useState('');
    const [newDocExpiry, setNewDocExpiry] = useState('');
    const [newDocIssueDate, setNewDocIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [newDocNotes, setNewDocNotes] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // State for file
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && entityId) {
            loadDocuments();
        }
    }, [isOpen, entityId]);

    // Reset doc type when entity type changes
    useEffect(() => {
        setNewDocType(docTypes[0]);
    }, [entityType]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            let data = [];
            if (entityType === 'truck') {
                data = await fleetApi.getComplianceHistory(entityId);
            } else {
                data = await fleetApi.getDriverDocuments(entityId);
            }
            setDocuments(data);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let documentUrls: string[] = [];

            // Handle file upload if a file is selected
            if (selectedFile) {
                const uploadRequest = {
                    entityType: entityType === 'truck' ? 'VEHICLE' : 'DRIVER',
                    entityId: entityId,
                    documentType: 'OTHER', // Map specific types if needed
                    category: 'COMPLIANCE',
                    title: `${newDocType} - ${newDocRef}`,
                    description: newDocNotes,
                    expiryDate: newDocExpiry,
                    priority: 'NORMAL',
                    sendNotification: false
                };

                // Upload the document
                const uploadedDoc = await documentApi.createDocument(uploadRequest, selectedFile);
                if (uploadedDoc && uploadedDoc.fileUrl) {
                    documentUrls.push(uploadedDoc.fileUrl); // Or use ID: uploadedDoc.id
                }
            }

            const docData = {
                regulation: newDocType,
                requirement: newDocRef,
                dueDate: newDocExpiry, // Expiry
                lastChecked: newDocIssueDate, // Issue Date
                nextCheck: newDocExpiry, // Renewal Date
                status: 'COMPLIANT',
                responsibleParty: 'Fleet Manager',
                notes: newDocNotes,
                documentation: documentUrls // Attach uploaded file URL(s)
            };

            if (entityType === 'truck') {
                await fleetApi.addComplianceRecord(entityId, docData);
            } else {
                await fleetApi.addDriverDocument(entityId, docData);
            }

            toast.success('Document added successfully');
            setShowAddForm(false);
            resetForm();
            loadDocuments();
        } catch (error) {
            console.error('Error adding document:', error);
            toast.error('Failed to add document');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewDocType(docTypes[0]);
        setNewDocRef('');
        setNewDocExpiry('');
        setNewDocIssueDate(new Date().toISOString().split('T')[0]);
        setNewDocNotes('');
        setSelectedFile(null); // Reset file selection
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entityType === 'truck' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                            <FaFileAlt className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Manage Documents</h2>
                            <p className="text-xs text-slate-400">For {entityName} ({entityType === 'truck' ? 'Vehicle' : 'Driver'})</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">

                    {/* Action Bar */}
                    {!showAddForm && (
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800">Current Documents</h3>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${entityType === 'truck' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                            >
                                <FaPlus /> Add Document
                            </button>
                        </div>
                    )}

                    {showAddForm ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800">Add New Document</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
                            </div>

                            <form onSubmit={handleAddDocument} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Document Type</label>
                                        <select
                                            value={newDocType}
                                            onChange={(e) => setNewDocType(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                        >
                                            {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Reference Number</label>
                                        <input
                                            type="text"
                                            value={newDocRef}
                                            onChange={(e) => setNewDocRef(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            placeholder="e.g. Policy #12345"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Issue Date</label>
                                        <input
                                            type="date"
                                            value={newDocIssueDate}
                                            onChange={(e) => setNewDocIssueDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Expiry Date</label>
                                        <input
                                            type="date"
                                            value={newDocExpiry}
                                            onChange={(e) => setNewDocExpiry(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* File Upload Section */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Document File</label>
                                    <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                                        <input
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setSelectedFile(file);
                                            }}
                                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Accepted formats: PDF, Images, Docs (Max 10MB)</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                                    <textarea
                                        value={newDocNotes}
                                        onChange={(e) => setNewDocNotes(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-20 resize-none"
                                        placeholder="Optional notes..."
                                    />
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${entityType === 'truck' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    >
                                        {submitting ? 'Saving...' : 'Save Document'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {loading ? (
                                <div className="flex justify-center py-10">
                                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${entityType === 'truck' ? 'border-indigo-600' : 'border-emerald-600'}`}></div>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FaFileAlt className="text-slate-300 text-xl" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No documents found</p>
                                    <p className="text-xs text-slate-400 mt-1">Click "Add Document" to upload or create records</p>
                                </div>
                            ) : (
                                documents.map(doc => (
                                    <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold
                                                ${['Registration', 'Permit', 'Driver License'].includes(doc.regulation) ? 'bg-emerald-100 text-emerald-600' :
                                                    ['Insurance', 'Medical Certificate'].includes(doc.regulation) ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}
                                            `}>
                                                {doc.regulation.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{doc.regulation}</h4>
                                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                                    <span className="font-mono">{doc.requirement}</span>
                                                    <span>•</span>
                                                    <span className={new Date(doc.dueDate) < new Date() ? "text-red-500 font-bold" : "text-slate-500"}>
                                                        Expires: {new Date(doc.dueDate).toLocaleDateString()}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentAssignmentModal;
