import React, { useState, useEffect } from 'react';
import {
    X,
    Search,
    History,
    UserPlus,
    Trash2,
    Users,
    Calendar,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { fleetApi, type Driver, type DriverAssignment, type Truck } from '../../services/fleetApi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { errorMessage } from '../../utils/error';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    truckId: string;
    truckName: string;
    onAssignSuccess: () => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ isOpen, onClose, truckId, truckName, onAssignSuccess }) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [trucks, setTrucks] = useState<Truck[]>([]);
    const [currentAssignments, setCurrentAssignments] = useState<DriverAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'active' | 'assign'>('active');
    const [assignSubMode, setAssignSubMode] = useState<'existing' | 'new'>('existing');
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteFormData, setInviteFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        licenseNumber: '',
        licenseIssueDate: '',
        licenseExpiry: '',
        licenseState: '',
        licenseCountry: 'USA',
        employmentType: 'FULL_TIME' as const,
        hireDate: new Date().toISOString().split('T')[0],
        experience: 0
    });
    const [refreshKey, setRefreshKey] = useState(0); // Added for re-fetching data after invite/assign

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, truckId, refreshKey]); // Added refreshKey to dependencies

    const loadData = async () => {
        setLoading(true);
        try {
            const [truck, allDrivers, allTrucks] = await Promise.all([
                fleetApi.getTruck(truckId),
                fleetApi.getDrivers(),
                fleetApi.getTrucks({}),
            ]);

            if (truck?.assignedDrivers) {
                setCurrentAssignments(truck.assignedDrivers);
            } else {
                setCurrentAssignments([]);
            }

            setDrivers(allDrivers.filter(d => d.status === 'ACTIVE'));
            setTrucks(allTrucks);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error(errorMessage(error, 'Failed to load driver assignment data'));
        } finally {
            setLoading(false);
        }
    };

    const getTruckLabel = (id?: string) => {
        if (!id) return 'another truck';
        const truck = trucks.find(t => t.id === id);
        if (!truck) return 'another truck';
        return truck.plateNumber || `${truck.make || ''} ${truck.model || ''}`.trim() || 'another truck';
    };

    const matchesDriverSearch = (driver: Driver) =>
        `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const handleAssign = async (driverId: string, driverName: string) => {
        setSubmitting(driverId);
        try {
            await fleetApi.assignDriverToTruck(truckId, driverId);
            toast.success(`Assigned ${driverName} to ${truckName}`);
            onAssignSuccess();
            await loadData();
            setViewMode('active');
        } catch (error) {
            console.error('Error assigning driver:', error);
            toast.error(errorMessage(error, 'Failed to assign driver'));
        } finally {
            setSubmitting(null);
        }
    };

    const handleUnassign = async (driverId: string, driverName: string) => {
        if (!window.confirm(`Are you sure you want to unassign ${driverName}?`)) return;

        setSubmitting(driverId);
        try {
            await fleetApi.unassignDriverFromTruck(truckId, driverId);
            toast.success(`Unassigned ${driverName}`);
            onAssignSuccess();
            await loadData();
        } catch (error) {
            console.error('Error unassigning driver:', error);
            toast.error(errorMessage(error, 'Failed to unassign driver'));
        } finally {
            setSubmitting(null);
        }
    };

    const handleTransfer = async (driverId: string, driverName: string) => {
        const assignedTruck = drivers.find(d => d.id === driverId)?.currentTruckId;
        const fromLabel = getTruckLabel(assignedTruck);
        if (!window.confirm(`Move ${driverName} from ${fromLabel} to ${truckName}?`)) return;

        setSubmitting(driverId);
        try {
            const result = await fleetApi.transferDriverToTruck(truckId, driverId);
            toast.success(result.message || `Transferred ${driverName} to ${truckName}`);
            onAssignSuccess();
            await loadData();
            setViewMode('active');
        } catch (error) {
            console.error('Error transferring driver:', error);
            toast.error(errorMessage(error, 'Failed to transfer driver'));
        } finally {
            setSubmitting(null);
        }
    };

    const handleInviteAndAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting('invite');
        try {
            // 1. Create the driver (backend sends invitation email)
            const newDriver = await fleetApi.createDriver({
                ...inviteFormData,
                status: 'ACTIVE',
                availabilityStatus: 'AVAILABLE'
            });

            toast.success(`Invitation sent to ${inviteFormData.email}`);

            // 2. Automatically assign to truck
            await fleetApi.assignDriverToTruck(newDriver.id, truckId);
            toast.success(`${inviteFormData.firstName} has been assigned to ${truckName}`);

            setRefreshKey(prev => prev + 1);
            setViewMode('active');
            setInviteFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                dateOfBirth: '',
                address: '',
                licenseNumber: '',
                licenseIssueDate: '',
                licenseExpiry: '',
                licenseState: '',
                licenseCountry: 'USA',
                employmentType: 'FULL_TIME' as const,
                hireDate: new Date().toISOString().split('T')[0],
                experience: 0
            });
        } catch (error: any) {
            toast.error(errorMessage(error, 'Failed to invite driver'));
        } finally {
            setSubmitting(null);
        }
    };

    const activeDriverIds = currentAssignments
        .filter(a => a.status === 'active')
        .map(a => a.driverId);

    const availableDrivers = drivers.filter(driver =>
        !activeDriverIds.includes(driver.id) &&
        (!driver.currentTruckId || driver.currentTruckId === truckId) &&
        matchesDriverSearch(driver)
    );

    const transferCandidates = drivers.filter(driver =>
        !activeDriverIds.includes(driver.id) &&
        driver.currentTruckId &&
        driver.currentTruckId !== truckId &&
        matchesDriverSearch(driver)
    );

    const activeAssignments = currentAssignments.filter(a => a.status === 'active');
    const inactiveAssignments = currentAssignments.filter(a => a.status !== 'active');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-gray-950/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl dark:shadow-none max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 transition-colors duration-200"
            >
                {/* Header Composition */}
                <div className="bg-white dark:bg-gray-900 px-8 pt-8 pb-4 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors">
                                <Users size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">Driver Assignments</h1>
                                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1 transition-colors">Manage personnel for {truckName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-gray-800 rounded-lg transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Pills */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-1 flex gap-1 transition-colors">
                        <button
                            onClick={() => setViewMode('active')}
                            className={`flex-1 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'active'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-gray-100 dark:border-gray-600'
                                : 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <History size={14} />
                            Active & History ({currentAssignments.length})
                        </button>
                        <button
                            onClick={() => setViewMode('assign')}
                            className={`flex-1 py-3 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'assign'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-gray-100 dark:border-gray-600'
                                : 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <UserPlus size={14} />
                            Assign New Driver
                        </button>
                    </div>
                </div>

                {/* Body Composition */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 dark:bg-gray-900 transition-colors duration-200">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
                            <Loader2 size={32} className="animate-spin mb-4 text-gray-500 dark:text-gray-400" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Loading data...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {viewMode === 'active' ? (
                                <motion.div
                                    key="active-list"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="space-y-8"
                                >
                                    {/* Deployment Status */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-2">
                                                <div className="size-1.5 bg-green-500 rounded-full" />
                                                <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest transition-colors">Currently Assigned</h3>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest transition-colors">{activeAssignments.length} Drivers</span>
                                        </div>

                                        {activeAssignments.length > 0 ? (
                                            <div className="grid gap-3">
                                                {activeAssignments.map((assignment, idx) => (
                                                    <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none flex items-center justify-between group hover:border-blue-100 dark:hover:border-blue-900/50 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-12 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                <span className="font-bold text-sm">{assignment.driverName.charAt(0)}</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{assignment.driverName}</h4>
                                                                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 transition-colors">
                                                                    <Calendar size={12} />
                                                                    <span>Assigned {new Date(assignment.assignmentDate).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUnassign(assignment.driverId, assignment.driverName)}
                                                            className="size-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                                                            disabled={submitting === assignment.driverId}
                                                        >
                                                            {submitting === assignment.driverId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-gray-800 p-12 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-center flex flex-col items-center transition-colors">
                                                <div className="size-12 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600 mb-6 group-hover:bg-gray-100 dark:group-hover:bg-gray-600 transition-colors">
                                                    <Users size={24} />
                                                </div>
                                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6 transition-colors">No Drivers Assigned</p>
                                                <button
                                                    onClick={() => setViewMode('assign')}
                                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
                                                >
                                                    Assign Driver
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Historical Logs */}
                                    {inactiveAssignments.length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 px-2">
                                                <History size={14} className="text-gray-400 dark:text-gray-500" />
                                                <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Assignment History</h3>
                                            </div>
                                            <div className="grid gap-2">
                                                {inactiveAssignments.map((assignment, idx) => (
                                                    <div key={idx} className="bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between opacity-70 hover:opacity-100 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-bold transition-colors">
                                                                {assignment.driverName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors">{assignment.driverName}</h4>
                                                                <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 transition-colors">
                                                                    {new Date(assignment.assignmentDate).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-bold px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 uppercase tracking-tighter transition-colors">
                                                            {assignment.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="assign-view"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Sub-navigation Toggles */}
                                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none mb-6 transition-colors">
                                        <button
                                            onClick={() => setAssignSubMode('existing')}
                                            className={`flex-1 py-2.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${assignSubMode === 'existing'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'
                                                }`}
                                        >
                                            Find Existing
                                        </button>
                                        <button
                                            onClick={() => setAssignSubMode('new')}
                                            className={`flex-1 py-2.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${assignSubMode === 'new'
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'
                                                }`}
                                        >
                                            Invite New
                                        </button>
                                    </div>

                                    {assignSubMode === 'existing' ? (
                                        <>
                                            {/* Search Input */}
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="SEARCH BY NAME OR LICENSE..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] font-bold uppercase tracking-widest text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm dark:shadow-none"
                                                    autoFocus
                                                />
                                            </div>

                                            {/* Search Results */}
                                            {availableDrivers.length === 0 && transferCandidates.length === 0 ? (
                                                <div className="py-20 text-center flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-100 dark:border-gray-700 transition-colors">
                                                    <div className="size-16 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-200 dark:text-gray-600 mb-6">
                                                        <Search size={32} />
                                                    </div>
                                                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">No drivers found</p>
                                                    <button
                                                        onClick={() => setAssignSubMode('new')}
                                                        className="mt-4 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline transition-colors"
                                                    >
                                                        Invite a new driver instead?
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {availableDrivers.length > 0 && (
                                                        <div className="grid gap-3">
                                                            {availableDrivers.map(driver => (
                                                                <div key={driver.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all flex items-center justify-between group">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="size-12 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                            <span className="font-bold text-sm">{driver.firstName[0]}{driver.lastName[0]}</span>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{driver.firstName} {driver.lastName}</h4>
                                                                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                                                                <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider transition-colors">{driver.licenseNumber}</span>
                                                                                <div className="size-1 bg-green-500 rounded-full" />
                                                                                <span className="text-green-600 dark:text-green-400 uppercase tracking-tighter transition-colors">Available</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleAssign(driver.id, `${driver.firstName} ${driver.lastName}`)}
                                                                        disabled={submitting !== null}
                                                                        className="px-6 py-2.5 bg-gray-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center gap-2"
                                                                    >
                                                                        {submitting === driver.id ? <Loader2 size={14} className="animate-spin" /> : <><UserPlus size={14} /> Assign</>}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {transferCandidates.length > 0 && (
                                                        <div className="space-y-3">
                                                            <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest px-1">
                                                                Assigned to another truck — transfer to {truckName}
                                                            </p>
                                                            <div className="grid gap-3">
                                                                {transferCandidates.map(driver => (
                                                                    <div key={driver.id} className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/40 transition-all flex items-center justify-between group">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="size-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-amber-500 transition-colors">
                                                                                <span className="font-bold text-sm">{driver.firstName[0]}{driver.lastName[0]}</span>
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{driver.firstName} {driver.lastName}</h4>
                                                                                <div className="flex items-center gap-2 text-[10px] font-bold">
                                                                                    <span className="text-gray-400 dark:text-gray-500 uppercase tracking-wider transition-colors">{driver.licenseNumber}</span>
                                                                                    <div className="size-1 bg-amber-500 rounded-full" />
                                                                                    <span className="text-amber-600 dark:text-amber-400 uppercase tracking-tighter transition-colors">
                                                                                        On {getTruckLabel(driver.currentTruckId)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleTransfer(driver.id, `${driver.firstName} ${driver.lastName}`)}
                                                                            disabled={submitting !== null}
                                                                            className="px-6 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 transition-all flex items-center gap-2"
                                                                        >
                                                                            {submitting === driver.id ? <Loader2 size={14} className="animate-spin" /> : <><ArrowRight size={14} /> Transfer</>}
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        /* Invite New Driver Form */
                                        <form onSubmit={handleInviteAndAssign} className="space-y-4">
                                            {/* Personal Information Section */}
                                            <div className="space-y-3">
                                                <h4 className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Personal Information</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">First Name *</label>
                                                        <input
                                                            required
                                                            type="text"
                                                            value={inviteFormData.firstName}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                            placeholder="John"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Last Name *</label>
                                                        <input
                                                            required
                                                            type="text"
                                                            value={inviteFormData.lastName}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                            placeholder="Doe"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Email Address *</label>
                                                    <input
                                                        required
                                                        type="email"
                                                        value={inviteFormData.email}
                                                        onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                        placeholder="driver@example.com"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Phone Number *</label>
                                                        <input
                                                            required
                                                            type="tel"
                                                            value={inviteFormData.phone}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                            placeholder="+1 (555) 123-4567"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Date of Birth *</label>
                                                        <input
                                                            required
                                                            type="date"
                                                            value={inviteFormData.dateOfBirth}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                            max={new Date(Date.now() - 567648000000).toISOString().split('T')[0]} // 18 years ago
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Address *</label>
                                                    <textarea
                                                        required
                                                        value={inviteFormData.address}
                                                        onChange={(e) => setInviteFormData(prev => ({ ...prev, address: e.target.value }))}
                                                        rows={2}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all resize-none"
                                                        placeholder="Street address, City, State, ZIP"
                                                    />
                                                </div>
                                            </div>

                                            {/* License Information Section */}
                                            <div className="space-y-3 pt-2">
                                                <h4 className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">License Information</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">License Number *</label>
                                                        <input
                                                            required
                                                            type="text"
                                                            value={inviteFormData.licenseNumber}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                            placeholder="DL-XXXXXX"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">License Expiry *</label>
                                                        <input
                                                            required
                                                            type="date"
                                                            value={inviteFormData.licenseExpiry}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                                                            min={new Date().toISOString().split('T')[0]} // Must be future date
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">License State *</label>
                                                        <input
                                                            required
                                                            type="text"
                                                            value={inviteFormData.licenseState}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, licenseState: e.target.value }))}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                            placeholder="CA, TX, NY, etc."
                                                            maxLength={50}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">License Country *</label>
                                                        <input
                                                            required
                                                            type="text"
                                                            value={inviteFormData.licenseCountry}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, licenseCountry: e.target.value }))}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                            placeholder="USA"
                                                            maxLength={50}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">License Issue Date *</label>
                                                    <input
                                                        required
                                                        type="date"
                                                        value={inviteFormData.licenseIssueDate}
                                                        onChange={(e) => setInviteFormData(prev => ({ ...prev, licenseIssueDate: e.target.value }))}
                                                        max={new Date().toISOString().split('T')[0]} // Must be past date
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Employment Details Section */}
                                            <div className="space-y-3 pt-2">
                                                <h4 className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Employment Details</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Employment Type *</label>
                                                        <select
                                                            required
                                                            value={inviteFormData.employmentType}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, employmentType: e.target.value as any }))}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                        >
                                                            <option value="FULL_TIME">Full-Time</option>
                                                            <option value="PART_TIME">Part-Time</option>
                                                            <option value="CONTRACT">Contract</option>
                                                            <option value="OWNER_OPERATOR">Owner-Operator</option>
                                                            <option value="FREELANCE">Freelance</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Hire Date *</label>
                                                        <input
                                                            required
                                                            type="date"
                                                            value={inviteFormData.hireDate}
                                                            onChange={(e) => setInviteFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Years of Experience</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="50"
                                                        value={inviteFormData.experience}
                                                        onChange={(e) => setInviteFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={submitting === 'invite'}
                                                    className="w-full py-4 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                                                >
                                                    {submitting === 'invite' ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <UserPlus size={16} />
                                                            Send Invitation & Assign
                                                        </>
                                                    )}
                                                </button>
                                                <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 mt-4 text-center px-6 leading-relaxed">
                                                    The driver will receive an email to create their password and confirm their account activation.
                                                </p>
                                            </div>
                                        </form>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-8 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end transition-colors">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                    >
                        Close Window
                        <ArrowRight size={14} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AssignmentModal;
