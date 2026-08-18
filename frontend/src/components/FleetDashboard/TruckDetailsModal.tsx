import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
    X,
    Truck,
    Calendar,
    Users,
    FileText,
    Wrench,
    Clock,
    AlertTriangle,
    Upload,
    Download,
    Eye,
    Fuel,
    Route,
    Star,
    Activity
} from 'lucide-react';
import { fleetApi } from '../../services/fleetApi';
import { documentApi, type Document as DocumentType } from '../../services/documents/documentApi';
import toast from 'react-hot-toast';
import DocumentUploadModal from '../documents/DocumentUploadModal';
import DocumentPreviewModal from '../documents/DocumentPreviewModal';
import { TruckFullProfile } from './TruckFullProfile';

interface TruckDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    truckId: string | null;
}

const TruckDetailsModal = ({ isOpen, onClose, truckId }: TruckDetailsModalProps) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<{ id: string; title: string; fileName: string } | null>(null);

    // Fetch truck data
    const { data: truckData, isLoading, error } = useQuery({
        queryKey: ['truck-details', truckId],
        queryFn: () => fleetApi.getTruck(truckId!),
        enabled: !!truckId && isOpen,
        retry: 1,
    });
    // Cast to any for flexible property access (backend may return extra fields)
    const truck = truckData as any;

    // Fetch documents
    const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
        queryKey: ['truck-documents', truckId],
        queryFn: async () => {
            if (!truckId) return [];
            try {
                return await documentApi.getDocumentsByEntity('TRUCK', truckId);
            } catch (e) {
                console.error('Error fetching truck documents:', e);
                return [];
            }
        },
        enabled: !!truckId && isOpen,
    });

    const documents: DocumentType[] = Array.isArray(documentsData) ? documentsData : [];

    if (!isOpen) return null;

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'AVAILABLE': return 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50';
            case 'IN_TRANSIT': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
            case 'MAINTENANCE': return 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
            case 'INACTIVE': return 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700';
            default: return 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        }
    };

    const getDocStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'VERIFIED': return 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400';
            case 'PENDING': return 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400';
            case 'REJECTED': return 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400';
            case 'EXPIRED': return 'bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400';
            default: return 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400';
        }
    };

    const formatDate = (date: string | undefined) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Truck },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'maintenance', label: 'Maintenance', icon: Wrench },
        { id: 'assignments', label: 'Drivers', icon: Users },
    ];

    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 transition-all duration-300"
                onClick={onClose}
            >
                <div
                    className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col transition-colors duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border border-blue-100 dark:border-blue-900/50 transition-colors">
                                <Truck className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                                    {truck?.plateNumber || 'Truck Details'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mt-1">
                                    {truck?.make} {truck?.model} {truck?.year ? `• ${truck.year}` : ''}
                                </p>
                            </div>
                        </div>                        <div className="flex items-center gap-3">
                            {typeof truck?.status === 'string' && (
                                <span className={`px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider border transition-all ${getStatusColor(truck.status)}`}>
                                    {truck.status.replace(/_/g, ' ')}
                                </span>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-gray-800 rounded-lg transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 transition-colors">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading truck details...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="p-6 bg-white dark:bg-slate-900 transition-colors">
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center transition-colors">
                                    <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">Error Loading Truck</h3>
                                    <p className="text-red-600 dark:text-red-400 text-sm">Could not load truck details. Please try again.</p>
                                </div>
                            </div>
                        ) : !truck ? (
                            <div className="p-6 bg-white dark:bg-slate-900 transition-colors">
                                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 text-center transition-colors">
                                    <Truck className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">Truck Not Found</h3>
                                    <p className="text-amber-600 dark:text-amber-400 text-sm">The requested truck could not be found.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Tabs */}
                                <div className="mb-8">
                                    <nav className="flex flex-wrap gap-2">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = activeTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${isActive
                                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                                                    <span className="uppercase tracking-wider">{tab.label}</span>
                                                    {tab.id === 'documents' && documents.length > 0 && (
                                                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400'}`}>
                                                            {documents.length}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>

                                {/* =========== OVERVIEW TAB =========== */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <MiniStat label="Total Trips" value={truck.totalTrips?.toString() || '0'} icon={Route} />
                                            <MiniStat label="Revenue" value={truck.totalRevenue ? `KES ${Number(truck.totalRevenue).toLocaleString()}` : 'KES 0'} icon={Star} />
                                            <MiniStat label="Fuel Efficiency" value={truck.fuelEfficiency ? `${truck.fuelEfficiency} km/l` : 'N/A'} icon={Fuel} />
                                            <MiniStat label="Rating" value={truck.averageRating ? `${Number(truck.averageRating).toFixed(1)} ★` : 'N/A'} icon={Star} />
                                        </div>
                                        <TruckFullProfile truck={truck} />
                                    </div>
                                )}

                                {/* =========== DOCUMENTS TAB =========== */}
                                {activeTab === 'documents' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight transition-colors">Documents</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 transition-colors">{documents.length} file{documents.length !== 1 ? 's' : ''} attached</p>
                                            </div>
                                            <button
                                                onClick={() => setShowUploadModal(true)}
                                                className="px-5 py-2.5 bg-primary-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
                                            >
                                                <Upload className="w-4 h-4" /> Upload
                                            </button>
                                        </div>

                                        {documentsLoading ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                                            </div>
                                        ) : documents.length === 0 ? (
                                            <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center transition-colors">
                                                <FileText className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4 transition-colors" />
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2 transition-colors">No Documents</h4>
                                                <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 transition-colors">Upload vehicle registration, insurance, or other documents.</p>
                                                <button
                                                    onClick={() => setShowUploadModal(true)}
                                                    className="px-6 py-3 bg-primary-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
                                                >
                                                    Upload First Document
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {documents.map((doc) => (
                                                    <div
                                                        key={doc.id}
                                                        className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-md dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600 transition-all group"
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-500 dark:text-primary-400 flex items-center justify-center shrink-0 transition-colors">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate transition-colors">{doc.title || doc.fileName}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider transition-colors">{doc.documentType?.replace(/_/g, ' ')}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ${getDocStatusColor(doc.status)}`}>
                                                                {doc.status}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 mb-3 transition-colors">
                                                            <span>Size: {(doc.fileSize / 1024).toFixed(1)} KB</span>
                                                            <span>Uploaded: {formatDate(doc.createdAt)}</span>
                                                            {doc.expiryDate && <span className="text-amber-600 dark:text-amber-400 font-bold">Expires: {formatDate(doc.expiryDate)}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-3 border-t border-slate-50 dark:border-slate-700 transition-colors">
                                                            <button
                                                                onClick={() => setPreviewDoc({ id: doc.id, title: doc.title, fileName: doc.fileName })}
                                                                className="flex-1 py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> View
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const blob = await documentApi.downloadDocument(doc.id);
                                                                        const url = URL.createObjectURL(blob);
                                                                        const a = document.createElement('a');
                                                                        a.href = url;
                                                                        a.download = doc.fileName || doc.title;
                                                                        a.click();
                                                                        URL.revokeObjectURL(url);
                                                                    } catch {
                                                                        toast.error('Failed to download document');
                                                                    }
                                                                }}
                                                                className="flex-1 py-2 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                            >
                                                                <Download className="w-3.5 h-3.5" /> Download
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* =========== MAINTENANCE TAB =========== */}
                                {activeTab === 'maintenance' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between transition-colors">
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight transition-colors">Maintenance History</h3>
                                            <Wrench className="w-5 h-5 text-primary-500 dark:text-primary-400 transition-colors" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-primary-50 dark:bg-primary-950/30 rounded-xl transition-colors"><Wrench className="w-4 h-4 text-primary-500 dark:text-primary-400" /></div>
                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Last Service</span>
                                                </div>
                                                <p className="text-lg font-black text-slate-900 dark:text-white transition-colors">{formatDate(truck.lastMaintenanceDate)}</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl transition-colors"><Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" /></div>
                                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Next Due</span>
                                                </div>
                                                <p className="text-lg font-black text-slate-900 dark:text-white transition-colors">{formatDate(truck.nextMaintenanceDate)}</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-emerald-50 rounded-xl"><Activity className="w-4 h-4 text-emerald-500" /></div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Odometer</span>
                                                </div>
                                                <p className="text-lg font-black text-slate-900 dark:text-white">{truck.mileage ? `${Number(truck.mileage).toLocaleString()} km` : 'N/A'}</p>
                                            </div>
                                        </div>

                                        {Array.isArray(truck.maintenance) && truck.maintenance.length > 0 ? (
                                            <div className="space-y-3">
                                                {truck.maintenance.map((record: any, idx: number) => (
                                                    <div key={record.id || idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                                                            <Wrench className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between mb-1">
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{record.title || record.type || 'Maintenance'}</p>
                                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${record.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    {record.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mb-2">{record.description || 'No description'}</p>
                                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <span>{formatDate(record.date)}</span>
                                                                {record.cost && <span>Cost: KES {Number(record.cost).toLocaleString()}</span>}
                                                                {record.location && <span>{record.location}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                                                <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2">No Maintenance Records</h4>
                                                <p className="text-sm text-slate-400">Maintenance history will appear here once records are added.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* =========== ASSIGNMENTS TAB =========== */}
                                {activeTab === 'assignments' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-[#0f172a] tracking-tight">Driver Assignments</h3>
                                            <Users className="w-5 h-5 text-primary-500" />
                                        </div>

                                        {Array.isArray(truck.assignedDrivers) && truck.assignedDrivers.length > 0 ? (
                                            <div className="space-y-4">
                                                {truck.assignedDrivers.map((driver: any, idx: number) => (
                                                    <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl font-black shrink-0">
                                                            {driver.driverName?.charAt(0)?.toUpperCase() || 'D'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-base font-black text-slate-900 dark:text-white mb-1">{driver.driverName}</p>
                                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" /> Assigned: {formatDate(driver.assignmentDate)}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full ${driver.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                    {driver.status}
                                                                </span>
                                                            </div>
                                                            {driver.notes && (
                                                                <p className="text-xs text-slate-500 mt-2">{driver.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                                                <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2">No Drivers Assigned</h4>
                                                <p className="text-sm text-slate-400">Drivers assigned to this truck will appear here.</p>
                                            </div>
                                        )}

                                        {/* Route Assignments */}
                                        {Array.isArray(truck.assignedRoutes) && truck.assignedRoutes.length > 0 && (
                                            <>
                                                <h3 className="text-lg font-black text-[#0f172a] tracking-tight mt-8">Route Assignments</h3>
                                                <div className="space-y-3">
                                                    {truck.assignedRoutes.map((route: any, idx: number) => (
                                                        <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center shrink-0">
                                                                <Route className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{route.routeName}</p>
                                                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                                                    <span>{formatDate(route.assignmentDate)}</span>
                                                                    <span className={`px-2 py-0.5 rounded-full ${route.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                                        {route.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Upload Modal */}
            {showUploadModal && truckId && (
                <DocumentUploadModal
                    isOpen={true}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        refetchDocuments();
                    }}
                    initialEntityType="TRUCK"
                    initialEntityId={truckId}
                    lockEntity={true}
                />
            )}

            {/* Document Preview Modal */}
            {previewDoc && (
                <DocumentPreviewModal
                    isOpen={true}
                    onClose={() => setPreviewDoc(null)}
                    documentId={previewDoc.id}
                    title={previewDoc.title}
                    fileName={previewDoc.fileName}
                />
            )}
        </>,
        document.body
    );
};

/* ============ Helper Components ============ */

const MiniStat = ({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center">
        <Icon className="w-5 h-5 text-primary-400 mx-auto mb-2" />
        <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
    </div>
);

export default TruckDetailsModal;
