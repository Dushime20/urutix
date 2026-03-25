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
import { fleetApi, type Driver, type DriverAssignment } from '../../services/fleetApi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    truckId: string;
    truckName: string;
    onAssignSuccess: () => void;
}

const AssignmentModal: React.FC<AssignmentModalProps> = ({ isOpen, onClose, truckId, truckName, onAssignSuccess }) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
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
        licenseNumber: ''
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
            const truck = await fleetApi.getTruck(truckId);
            if (truck && truck.assignedDrivers) {
                setCurrentAssignments(truck.assignedDrivers);
            } else {
                setCurrentAssignments([]);
            }

            const allDrivers = await fleetApi.getDrivers();
            setDrivers(allDrivers.filter(d => d.status === 'ACTIVE'));
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

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
            toast.error('Failed to assign driver');
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
            toast.error('Failed to unassign driver');
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
                availabilityStatus: 'AVAILABLE',
                // Add required dummy/default dates for initial creation
                dateOfBirth: '1990-01-01',
                licenseIssueDate: new Date().toISOString().split('T')[0],
                licenseExpiry: new Date(Date.now() + 31536000000).toISOString().split('T')[0], // +1 year
                hireDate: new Date().toISOString().split('T')[0],
                experience: 0
            });

            toast.success(`Invitation sent to ${inviteFormData.email}`);

            // 2. Automatically assign to truck
            await fleetApi.assignDriverToTruck(newDriver.id, truckId);
            toast.success(`${inviteFormData.firstName} has been assigned to ${truckName}`);

            setRefreshKey(prev => prev + 1);
            setViewMode('active');
            setInviteFormData({ firstName: '', lastName: '', email: '', licenseNumber: '' });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to invite driver');
        } finally {
            setSubmitting(null);
        }
    };

    const activeDriverIds = currentAssignments
        .filter(a => a.status === 'active')
        .map(a => a.driverId);

    const availableDrivers = drivers.filter(driver =>
        !activeDriverIds.includes(driver.id) &&
        (`${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()))
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
                        <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all">
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
                                            {availableDrivers.length === 0 ? (
                                                <div className="py-20 text-center flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-100 dark:border-gray-700 transition-colors">
                                                    <div className="size-16 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-200 dark:text-gray-600 mb-6">
                                                        <Search size={32} />
                                                    </div>
                                                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">No available drivers found</p>
                                                    <button
                                                        onClick={() => setAssignSubMode('new')}
                                                        className="mt-4 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline transition-colors"
                                                    >
                                                        Invite a new driver instead?
                                                    </button>
                                                </div>
                                            ) : (
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
                                        </>
                                    ) : (
                                        /* Invite New Driver Form */
                                        <form onSubmit={handleInviteAndAssign} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">First Name</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={inviteFormData.firstName}
                                                        onChange={(e) => setInviteFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                        placeholder="Enter Name"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Last Name</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={inviteFormData.lastName}
                                                        onChange={(e) => setInviteFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                        placeholder="Enter Surname"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">Email Address</label>
                                                <input
                                                    required
                                                    type="email"
                                                    value={inviteFormData.email}
                                                    onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                    placeholder="driver@example.com"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 transition-colors">License Number</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={inviteFormData.licenseNumber}
                                                    onChange={(e) => setInviteFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                                                    placeholder="DL-XXXXXX"
                                                />
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
