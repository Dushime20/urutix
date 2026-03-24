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
        <div className="fixed inset-0 bg-primary-950/40 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-100"
            >
                {/* Header Composition */}
                <div className="bg-white px-8 pt-8 pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-primary-50 rounded-[20px] flex items-center justify-center text-primary-500 shadow-inner">
                                <Users size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-primary-500 tracking-tight">Driver Assignments</h1>
                                <p className="text-[11px] font-bold text-slate-400 mt-1">Manage personnel for {truckName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Pills */}
                    <div className="bg-slate-50 rounded-2xl p-1 flex gap-1">
                        <button
                            onClick={() => setViewMode('active')}
                            className={`flex-1 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'active'
                                ? 'bg-white text-primary-500 shadow-sm border border-primary-100'
                                : 'text-slate-400 hover:text-primary-500 hover:bg-white/50'
                                }`}
                        >
                            <History size={14} />
                            Active & History ({currentAssignments.length})
                        </button>
                        <button
                            onClick={() => setViewMode('assign')}
                            className={`flex-1 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${viewMode === 'assign'
                                ? 'bg-white text-primary-500 shadow-sm border border-primary-100'
                                : 'text-slate-400 hover:text-primary-500 hover:bg-white/50'
                                }`}
                        >
                            <UserPlus size={14} />
                            Assign New Driver
                        </button>
                    </div>
                </div>

                {/* Body Composition */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                            <Loader2 size={32} className="animate-spin mb-4 text-slate-400" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Loading data...</p>
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
                                                <div className="size-1.5 bg-emerald-500 rounded-full" />
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currently Assigned</h3>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{activeAssignments.length} Drivers</span>
                                        </div>

                                        {activeAssignments.length > 0 ? (
                                            <div className="grid gap-3">
                                                {activeAssignments.map((assignment, idx) => (
                                                    <div key={idx} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary-100 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                                                <span className="font-black text-sm">{assignment.driverName.charAt(0)}</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-slate-900">{assignment.driverName}</h4>
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                                    <Calendar size={12} />
                                                                    <span>Assigned {new Date(assignment.assignmentDate).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUnassign(assignment.driverId, assignment.driverName)}
                                                            className="size-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                            disabled={submitting === assignment.driverId}
                                                        >
                                                            {submitting === assignment.driverId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white p-12 rounded-[28px] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                                                <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-6 group-hover:bg-slate-100 transition-colors">
                                                    <Users size={24} />
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6">No Drivers Assigned</p>
                                                <button
                                                    onClick={() => setViewMode('assign')}
                                                    className="px-8 py-3 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/10"
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
                                                <History size={14} className="text-slate-300" />
                                                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Assignment History</h3>
                                            </div>
                                            <div className="grid gap-2">
                                                {inactiveAssignments.map((assignment, idx) => (
                                                    <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 bg-white rounded-xl flex items-center justify-center text-slate-400 text-xs font-black">
                                                                {assignment.driverName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-black text-slate-700">{assignment.driverName}</h4>
                                                                <p className="text-[9px] font-bold text-slate-400">
                                                                    {new Date(assignment.assignmentDate).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-black px-2 py-1 rounded-full bg-slate-200 text-slate-600 uppercase tracking-tighter">
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
                                    <div className="flex bg-white rounded-2xl p-1 border border-slate-100 shadow-sm mb-6">
                                        <button
                                            onClick={() => setAssignSubMode('existing')}
                                            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${assignSubMode === 'existing'
                                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                                : 'text-slate-400 hover:text-primary-500'
                                                }`}
                                        >
                                            Find Existing
                                        </button>
                                        <button
                                            onClick={() => setAssignSubMode('new')}
                                            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${assignSubMode === 'new'
                                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                                : 'text-slate-400 hover:text-primary-500'
                                                }`}
                                        >
                                            Invite New
                                        </button>
                                    </div>

                                    {assignSubMode === 'existing' ? (
                                        <>
                                            {/* Search Input */}
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="SEARCH BY NAME OR LICENSE..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 outline-none transition-all shadow-sm"
                                                    autoFocus
                                                />
                                            </div>

                                            {/* Search Results */}
                                            {availableDrivers.length === 0 ? (
                                                <div className="py-20 text-center flex flex-col items-center bg-white rounded-[28px] border-2 border-dashed border-slate-100">
                                                    <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-6">
                                                        <Search size={32} />
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No available drivers found</p>
                                                    <button
                                                        onClick={() => setAssignSubMode('new')}
                                                        className="mt-4 text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline"
                                                    >
                                                        Invite a new driver instead?
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {availableDrivers.map(driver => (
                                                        <div key={driver.id} className="bg-white p-4 rounded-[28px] border border-slate-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/5 transition-all flex items-center justify-between group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                                                    <span className="font-black text-sm">{driver.firstName[0]}{driver.lastName[0]}</span>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-black text-slate-900">{driver.firstName} {driver.lastName}</h4>
                                                                    <div className="flex items-center gap-2 text-[10px] font-black">
                                                                        <span className="text-slate-400 uppercase">{driver.licenseNumber}</span>
                                                                        <div className="size-1 bg-emerald-500 rounded-full" />
                                                                        <span className="text-emerald-500 uppercase tracking-tighter">Available</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleAssign(driver.id, `${driver.firstName} ${driver.lastName}`)}
                                                                disabled={submitting !== null}
                                                                className="px-6 py-2.5 bg-slate-50 text-primary-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-500 hover:text-white transition-all flex items-center gap-2"
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
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">First Name</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={inviteFormData.firstName}
                                                        onChange={(e) => setInviteFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                                                        placeholder="Enter Name"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Last Name</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={inviteFormData.lastName}
                                                        onChange={(e) => setInviteFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary-600 transition-all"
                                                        placeholder="Enter Surname"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                                <input
                                                    required
                                                    type="email"
                                                    value={inviteFormData.email}
                                                    onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary-600 transition-all"
                                                    placeholder="driver@example.com"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">License Number</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={inviteFormData.licenseNumber}
                                                    onChange={(e) => setInviteFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-primary-600 transition-all"
                                                    placeholder="DL-XXXXXX"
                                                />
                                            </div>
                                            <div className="pt-4">
                                                <button
                                                    type="submit"
                                                    disabled={submitting === 'invite'}
                                                    className="w-full py-4 bg-primary-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-600 shadow-xl shadow-primary-500/20 transition-all"
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
                                                <p className="text-[9px] font-medium text-slate-400 mt-4 text-center px-6 leading-relaxed">
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
                <div className="p-8 bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
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
