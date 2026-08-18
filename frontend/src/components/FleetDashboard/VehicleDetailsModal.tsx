import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruck, FaIdCard, FaTools, FaFileAlt, FaCheckCircle, FaMapMarkerAlt, FaHistory } from 'react-icons/fa';
import { fleetApi } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import { flattenComplianceDocuments } from '../../utils/vehicleComplianceDocuments';
import { TruckFullProfile } from './TruckFullProfile';

interface VehicleDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    truckId: string;
}

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({ isOpen, onClose, truckId }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'maintenance' | 'documents'>('overview');
    const [loading, setLoading] = useState(true);
    const [vehicle, setVehicle] = useState<any>(null);
    const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && truckId) {
            loadVehicleDetails();
        }
    }, [isOpen, truckId]);

    const loadVehicleDetails = async () => {
        setLoading(true);
        try {
            const [truckData, maintenanceData] = await Promise.all([
                fleetApi.getTruck(truckId),
                fleetApi.getMaintenanceHistory(truckId)
            ]);
            setVehicle(truckData);
            setMaintenanceHistory(maintenanceData);
        } catch (error) {
            console.error('Error loading vehicle details:', error);
            toast.error('Failed to load vehicle details');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900/50';
            case 'MAINTENANCE': return 'bg-blue-100 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
            case 'OUT_OF_SERVICE': return 'bg-red-100 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-900/50';
            case 'ON_TRIP': return 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-950/60 dark:bg-gray-950/90 backdrop-blur-sm transition-all duration-300" onClick={onClose}></div>

            {/* Modal Panel */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 text-left border border-gray-100 dark:border-gray-800 shadow-2xl dark:shadow-none transition-all sm:my-8 sm:w-full sm:max-w-4xl duration-200">

                    {/* Header */}
                    <div className="bg-white dark:bg-gray-950 px-6 py-5 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-blue-600 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-white dark:text-blue-400 transition-colors">
                                <FaTruck size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3 transition-colors">
                                    {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Loading...'}
                                    {vehicle && (
                                        <span className={`text-xs uppercase font-medium px-2 py-0.5 rounded-lg border ${getStatusColor(vehicle.status)}`}>
                                            {vehicle.status.replace('_', ' ')}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 transition-colors">
                                    {vehicle ? vehicle.plateNumber : '...'} • {vehicle ? (vehicle.vin || 'No VIN') : '...'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="size-10 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm dark:shadow-none"
                        >
                            <FaTimes size={18} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row h-[600px]">
                    {/* Sidebar / Tabs */}
                    <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col transition-colors">
                        <nav className="space-y-1 flex-1">
                            {[
                                { id: 'overview', label: 'Overview', icon: 'dashboard' },
                                { id: 'compliance', label: 'Compliance', icon: 'verified_user' },
                                { id: 'maintenance', label: 'Maintenance', icon: 'build' },
                                { id: 'documents', label: 'Documents', icon: 'folder' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        {/* Quick Stats Sidebar Widget */}
                        <div className="mt-8 bg-white dark:bg-gray-900 p-5 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none transition-colors">
                            <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Core Vitals</h4>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Health Index</span>
                                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-widest">88%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 mb-5">
                                <div className="bg-green-500 dark:bg-green-400 h-1 rounded-full transition-all duration-500" style={{ width: '88%' }}></div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Fuel Reserve</span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">76%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1">
                                <div className="bg-blue-600 dark:bg-blue-400 h-1 rounded-full transition-all duration-500" style={{ width: '76%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 bg-white dark:bg-gray-900 p-8 overflow-y-auto transition-colors">
                                {activeTab === 'overview' && (
                                    <TruckFullProfile truck={vehicle} />
                                )}

                                {activeTab === 'maintenance' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Financial Maintenance Log</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {maintenanceHistory.length > 0 ? (
                                                maintenanceHistory.map((record) => (
                                                    <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-white dark:hover:bg-gray-800 hover:border-blue-100 dark:hover:border-blue-900/50 transition-all group">
                                                        <div className="flex items-start gap-5">
                                                            <div className={`p-3 rounded-lg transition-colors ${record.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'}`}>
                                                                <FaTools size={18} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 dark:text-white transition-colors uppercase tracking-tight">{record.title}</h4>
                                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 transition-colors leading-relaxed">{record.description}</p>
                                                                <div className="flex items-center gap-5 mt-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">
                                                                    <span className="flex items-center gap-1.5"><FaHistory size={12} className="opacity-50" /> {new Date(record.date).toLocaleDateString()}</span>
                                                                    <span className="flex items-center gap-1.5">Origin: {record.location || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 sm:mt-0 text-right space-y-2">
                                                            <div className="font-black text-gray-900 dark:text-white text-lg transition-colors tracking-tighter">${record.cost}</div>
                                                            <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-md transition-all ${record.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'}`}>
                                                                {record.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-gray-100 dark:border-gray-800 transition-colors">
                                                    <FaTools className="mx-auto text-gray-300 dark:text-gray-700 text-4xl mb-4 opacity-50 transition-opacity" />
                                                    <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Registry is empty</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {activeTab === 'compliance' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            {(() => {
                                                const items = flattenComplianceDocuments(vehicle?.complianceDocuments);
                                                if (items.length === 0) {
                                                    return (
                                                        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-gray-100 dark:border-gray-800">
                                                            <FaFileAlt className="mx-auto text-gray-300 dark:text-gray-700 text-4xl mb-4 opacity-50" />
                                                            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                                                                No compliance documents on file
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return items.map(({ title, record }, idx) => {
                                                    const expired = Boolean(record.expiryDate) && new Date(record.expiryDate as string) < new Date(new Date().toDateString());
                                                    return (
                                                        <div key={`${title}-${idx}`} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-lg">
                                                            <div className="flex items-center gap-5">
                                                                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg">
                                                                    <FaFileAlt size={18} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{title}</h4>
                                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-widest">
                                                                        {record.number ? `${record.number} · ` : ''}
                                                                        {record.expiryDate
                                                                            ? `Valid until ${new Date(record.expiryDate).toLocaleDateString()}`
                                                                            : 'No expiry on file'}
                                                                        {record.fileName ? ` · ${record.fileName}` : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[10px] font-black px-4 py-1 rounded-md uppercase tracking-widest flex items-center gap-1.5 ${
                                                                expired
                                                                    ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40'
                                                                    : 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40'
                                                            }`}>
                                                                <FaCheckCircle size={12} /> {expired ? 'Expired' : (record.status || 'Valid')}
                                                            </span>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'documents' && (
                                    <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-gray-100 dark:border-gray-800 transition-colors flex flex-col items-center justify-center">
                                        <FaFileAlt className="text-gray-300 dark:text-gray-700 text-4xl mb-6 opacity-30 transition-opacity" />
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-8">Document Vault Restricted</p>
                                        <button className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm dark:shadow-none transition-all">
                                            Initialize Registry Upload
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleDetailsModal;
