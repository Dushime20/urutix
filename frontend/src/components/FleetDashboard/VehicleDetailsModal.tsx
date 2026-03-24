import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruck, FaIdCard, FaTools, FaFileAlt, FaCheckCircle, FaMapMarkerAlt, FaHistory } from 'react-icons/fa';
import { fleetApi } from '../../services/fleetApi';
import toast from 'react-hot-toast';

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
            case 'AVAILABLE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'MAINTENANCE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'OUT_OF_SERVICE': return 'bg-red-100 text-red-800 border-red-200';
            case 'ON_TRIP': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Panel */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-100">

                    {/* Header */}
                    <div className="bg-[#0f172a] px-6 py-5 flex justify-between items-start border-b border-slate-700/50">
                        <div className="flex gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <FaTruck className="text-blue-400 text-xl" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Loading...'}
                                    {vehicle && (
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusColor(vehicle.status)}`}>
                                            {vehicle.status.replace('_', ' ')}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-slate-400 text-sm mt-1 font-mono tracking-wide">
                                    {vehicle ? vehicle.plateNumber : '...'} • {vehicle ? (vehicle.vin || 'No VIN') : '...'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="p-12 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row h-[600px]">
                            {/* Sidebar / Tabs */}
                            <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4">
                                <nav className="space-y-1">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('compliance')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'compliance' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                    >
                                        <FaCheckCircle className={activeTab === 'compliance' ? 'text-indigo-500' : 'text-slate-400'} />
                                        Compliance
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('maintenance')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'maintenance' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                    >
                                        <FaTools className={activeTab === 'maintenance' ? 'text-indigo-500' : 'text-slate-400'} />
                                        Maintenance
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('documents')}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'documents' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                    >
                                        <FaFileAlt className={activeTab === 'documents' ? 'text-indigo-500' : 'text-slate-400'} />
                                        Documents
                                    </button>
                                </nav>

                                {/* Quick Stats Sidebar Widget */}
                                <div className="mt-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vehicle Health</h4>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-slate-600 font-medium">Condition</span>
                                        <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Good</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '88%' }}></div>
                                    </div>

                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-slate-600 font-medium">Fuel Level</span>
                                        <span className="text-xs text-slate-900 font-bold">76%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '76%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 bg-white p-8 overflow-y-auto">
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                    <FaTruck className="text-slate-400" /> Specifications
                                                </h4>
                                                <dl className="space-y-3 text-sm">
                                                    <div className="flex justify-between">
                                                        <dt className="text-slate-500">Year</dt>
                                                        <dd className="font-semibold text-slate-900">{vehicle.year || 'N/A'}</dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-slate-500">Type</dt>
                                                        <dd className="font-semibold text-slate-900">{vehicle.truckType || 'Heavy Truck'}</dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-slate-500">Max Capacity</dt>
                                                        <dd className="font-semibold text-slate-900">{vehicle.maxWeight ? `${vehicle.maxWeight} kg` : 'N/A'}</dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-slate-500">Fuel Type</dt>
                                                        <dd className="font-semibold text-slate-900">Diesel</dd>
                                                    </div>
                                                </dl>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                    <FaIdCard className="text-slate-400" /> Assigned Driver
                                                </h4>
                                                {vehicle.assignedDrivers && vehicle.assignedDrivers.length > 0 ? (
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${vehicle.assignedDrivers[0].driverName}`}
                                                            alt="Driver"
                                                            className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm"
                                                        />
                                                        <div>
                                                            <p className="font-bold text-slate-900">{vehicle.assignedDrivers[0].driverName}</p>
                                                            <p className="text-xs text-slate-500">ID: {vehicle.assignedDrivers[0].driverId}</p>
                                                            <span className="inline-block mt-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Active</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 text-slate-500 text-sm italic">
                                                        No driver currently assigned
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-slate-400" /> Last Known Location
                                            </h4>
                                            <div className="bg-slate-100 rounded-xl h-48 flex items-center justify-center border-2 border-dashed border-slate-200">
                                                <div className="text-center text-slate-400">
                                                    <FaMapMarkerAlt className="mx-auto text-3xl mb-2 opacity-50" />
                                                    <p className="text-sm">Map visualization would appear here</p>
                                                    <p className="text-xs opacity-70">Lat: -1.2921, Long: 36.8219 (Nairobi, KE)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'maintenance' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-slate-900">Service History</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {maintenanceHistory.length > 0 ? (
                                                maintenanceHistory.map((record) => (
                                                    <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                                                        <div className="flex items-start gap-4">
                                                            <div className={`p-2 rounded-lg ${record.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                <FaTools />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900">{record.title}</h4>
                                                                <p className="text-sm text-slate-500">{record.description}</p>
                                                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                                                    <span className="flex items-center gap-1"><FaHistory size={10} /> {new Date(record.date).toLocaleDateString()}</span>
                                                                    <span className="flex items-center gap-1">Vendor: {record.location || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 sm:mt-0 text-right">
                                                            <div className="font-bold text-slate-900">${record.cost}</div>
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${record.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                {record.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                    <FaTools className="mx-auto text-slate-300 text-4xl mb-3" />
                                                    <p className="text-slate-500 font-medium">No maintenance history found</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'compliance' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Mock Compliance Data - would come from API in real implementation */}
                                            {['Vehicle Insurance', 'Road Worthiness Inspection', 'Transport Permit'].map((doc, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                                            <FaFileAlt />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900">{doc}</h4>
                                                            <p className="text-xs text-slate-500">Expires: {new Date(Date.now() + (idx * 30 + 60) * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                                        <FaCheckCircle size={10} /> Valid
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'documents' && (
                                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <FaFileAlt className="mx-auto text-slate-300 text-4xl mb-3" />
                                        <p className="text-slate-500 font-medium">Document repository integration showing here</p>
                                        <button className="mt-4 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 shadow-sm transition-all">
                                            Upload New Document
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
