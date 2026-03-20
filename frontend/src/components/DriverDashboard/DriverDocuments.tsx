import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Download,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Calendar,
    ShieldCheck,
    AlertTriangle,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { documentApi } from '../../services/documents/documentApi';
import DocumentUploadModal from '../documents/DocumentUploadModal';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import toast from 'react-hot-toast';

interface DriverDocumentsProps {
    driverId: string;
}

export const DriverDocuments: React.FC<DriverDocumentsProps> = ({ driverId }) => {
    const queryClient = useQueryClient();
    const { confirm, DialogComponent } = useConfirmDialog();
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [filterType, setFilterType] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch documents
    const { data: documentsData, isLoading } = useQuery({
        queryKey: ['documents', 'DRIVER', driverId],
        queryFn: () => documentApi.getDocuments({
            entityType: 'DRIVER',
            entityId: driverId,
            page: 1,
            limit: 50 // Fetch enough to show
        }),
        enabled: !!driverId
    });

    const documents = documentsData?.documents || [];

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.documentType.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'ALL' || doc.documentType === filterType;
        return matchesSearch && matchesType;
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => documentApi.deleteDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success('Document deleted successfully');
        },
        onError: () => toast.error('Failed to delete document')
    });

    const handleDelete = async (id: string, title: string) => {
        const isConfirmed = await confirm({
            title: 'Delete Document',
            message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger'
        });

        if (isConfirmed) {
            deleteMutation.mutate(id);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'VERIFIED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'EXPIRED': return 'bg-slate-50 text-slate-500 border-slate-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'VERIFIED': return <CheckCircle className="w-3 h-3" />;
            case 'PENDING': return <Clock className="w-3 h-3" />;
            case 'REJECTED': return <XCircle className="w-3 h-3" />;
            case 'EXPIRED': return <AlertCircle className="w-3 h-3" />;
            default: return <FileText className="w-3 h-3" />;
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDocType = (type: string) => {
        return type.replace('DRIVER_', '').replace(/_/g, ' ');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const requiredTypes = ['DRIVER_LICENSE', 'DRIVER_ID', 'DRIVER_INSURANCE'];
    const completionRate = Math.round((documents.filter(d => requiredTypes.includes(d.documentType)).length / requiredTypes.length) * 100);
    
    const expiringDocs = documents.filter(doc => {
        if (!doc.expiryDate) return false;
        const daysToExpiry = (new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return daysToExpiry > 0 && daysToExpiry < 30;
    });

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Digital Safe Status - Compact & Brand Blue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#345E85] rounded-[2rem] p-6 relative overflow-hidden group border border-white/5 shadow-xl shadow-[#345E85]/20">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 transition-transform group-hover:scale-110" />
                    <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                        <div className="relative">
                            <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="34"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="34"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={213.6}
                                    strokeDashoffset={213.6 - (213.6 * completionRate) / 100}
                                    className="text-white transition-all duration-1000"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-base font-black text-white">{completionRate}%</span>
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                           <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <Lock className="text-white/60 w-3 h-3" />
                                <h3 className="text-[8px] font-black text-white/60 uppercase tracking-[0.3em]">My Digital Safe</h3>
                           </div>
                           <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">Security & Compliance</h2>
                           <p className="text-blue-100/70 text-[10px] font-medium max-w-sm leading-tight">
                               Your personal vault for all logistics documents. Keep your safe 100% full.
                           </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-xl shadow-slate-200/50 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                            <AlertTriangle size={16} />
                        </div>
                        <h4 className="text-[11px] font-black text-[#0f172a] uppercase tracking-tight">Need Attention</h4>
                    </div>
                    <div className="flex-1 space-y-3">
                        {expiringDocs.length > 0 ? expiringDocs.map(doc => (
                            <div key={doc.id} className="flex items-center gap-3 p-2 bg-amber-50/50 border border-amber-100 rounded-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black text-[#0f172a] uppercase truncate">{doc.title}</p>
                                    <p className="text-[8px] font-bold text-amber-600 uppercase">Expiring Soon</p>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-2">
                                <ShieldCheck size={24} className="text-emerald-500 mb-1" />
                                <p className="text-[8px] font-black uppercase tracking-widest leading-none">All Docs Active</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full h-12 pl-4 pr-10 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#345E85] appearance-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <option value="ALL">All Types</option>
                            <option value="DRIVER_LICENSE">License</option>
                            <option value="DRIVER_ID">ID Card</option>
                            <option value="DRIVER_MEDICAL_CERT">Medical Cert</option>
                            <option value="DRIVER_INSURANCE">Insurance</option>
                            <option value="OTHER">Other</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>

                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="h-12 px-6 bg-[#345E85] text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Document</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Documents Grid */}
            {filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No documents found</h3>
                    <p className="text-slate-500 text-sm mt-1">Upload your first document to get started</p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="mt-6 text-[#345E85] font-bold text-sm hover:underline"
                    >
                        Upload Document
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredDocuments.map((doc) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                                className="group bg-white rounded-[2rem] border border-slate-100 p-6 hover:shadow-lg hover:border-blue-100 transition-all duration-300 relative overflow-hidden"
                            >
                                {/* Status Badge */}
                                <div className={`absolute top-6 right-6 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${getStatusColor(doc.status)}`}>
                                    {getStatusIcon(doc.status)}
                                    {doc.status}
                                </div>

                                {/* Icon */}
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="w-7 h-7 text-[#345E85]" strokeWidth={1.5} />
                                </div>

                                {/* Content */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 line-clamp-1" title={doc.title}>
                                            {doc.title}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {formatDocType(doc.documentType)}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-50">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Uploaded</span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                {formatDate(doc.createdAt)}
                                            </div>
                                        </div>
                                        {doc.expiryDate && (
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expires</span>
                                                <div className={`flex items-center gap-1.5 text-xs font-bold ${new Date(doc.expiryDate) < new Date() ? 'text-rose-600' : 'text-slate-600'
                                                    }`}>
                                                    <Clock className={`w-3 h-3 ${new Date(doc.expiryDate) < new Date() ? 'text-rose-500' : 'text-slate-400'}`} />
                                                    {formatDate(doc.expiryDate)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            onClick={() => documentApi.downloadDocument(doc.id)}
                                            className="flex-1 h-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 group/btn"
                                        >
                                            <Download className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                            Download
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id, doc.title)}
                                            className="w-10 h-10 bg-white border border-slate-100 hover:bg-rose-50 hover:border-rose-100 text-slate-400 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Upload Modal */}
            <DocumentUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                initialEntityType="DRIVER"
                initialEntityId={driverId}
                lockEntity={true}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['documents'] });
                    toast.success('Document uploaded successfully');
                }}
            />

            {DialogComponent}
        </div>
    );
};
