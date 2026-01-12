import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch, FaCheck, FaHistory, FaUserPlus, FaTrash } from 'react-icons/fa';
import { fleetApi, type Driver, type DriverAssignment } from '../../services/fleetApi';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'assign' | 'active'>('active');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, truckId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load truck details to get current assignments
            const truck = await fleetApi.getTruckById(truckId);
            if (truck && truck.assignedDrivers) {
                setCurrentAssignments(truck.assignedDrivers);
            } else {
                setCurrentAssignments([]);
            }

            // Load all drivers
            const allDrivers = await fleetApi.getDrivers();
            // Filter out drivers who are permanently inactive? For now, show ACTIVE.
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
            await loadData(); // Reload to show new assignment
            setViewMode('active'); // Switch back to list
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
            await loadData(); // Reload to update list
        } catch (error) {
            console.error('Error unassigning driver:', error);
            toast.error('Failed to unassign driver');
        } finally {
            setSubmitting(null);
        }
    };

    // Filter potential new drivers: Exclude those already currently assigned to THIS truck (active)
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Manage Drivers</h2>
                        <p className="text-xs text-slate-400">Assignments for <strong>{truckName}</strong></p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${viewMode === 'active' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Active & History ({currentAssignments.length})
                    </button>
                    <button
                        onClick={() => setViewMode('assign')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${viewMode === 'assign' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Assign New Driver
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                    {loading ? (
                        <div className="py-10 flex flex-col items-center justify-center text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            <span className="text-sm">Loading data...</span>
                        </div>
                    ) : viewMode === 'active' ? (
                        <div className="space-y-6">
                            {/* Active Assignments */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Current Drivers
                                </h3>
                                {activeAssignments.length > 0 ? (
                                    <div className="space-y-2">
                                        {activeAssignments.map((assignment, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                        {assignment.driverName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{assignment.driverName}</h4>
                                                        <p className="text-xs text-slate-500">Assigned: {new Date(assignment.assignmentDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnassign(assignment.driverId, assignment.driverName)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Unassign Driver"
                                                    disabled={submitting === assignment.driverId}
                                                >
                                                    {submitting === assignment.driverId ? <div className="animate-spin w-4 h-4 border-b-2 border-red-500 rounded-full" /> : <FaTrash />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white p-6 rounded-lg border border-dashed border-slate-300 text-center">
                                        <p className="text-slate-500 text-sm mb-2">No active drivers assigned.</p>
                                        <button onClick={() => setViewMode('assign')} className="text-indigo-600 text-sm font-bold hover:underline">
                                            Assign a driver now
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* History */}
                            {inactiveAssignments.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <FaHistory className="text-slate-400" />
                                        History
                                    </h3>
                                    <div className="space-y-2 opacity-75">
                                        {inactiveAssignments.map((assignment, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                        {assignment.driverName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-slate-700 text-sm">{assignment.driverName}</h4>
                                                        <p className="text-[10px] text-slate-400">
                                                            {new Date(assignment.assignmentDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                                    {assignment.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or license..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    autoFocus
                                />
                            </div>

                            {availableDrivers.length === 0 ? (
                                <div className="py-8 text-center text-slate-500">
                                    <p>No available drivers match your search.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {availableDrivers.map(driver => (
                                        <div key={driver.id} className="bg-white p-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                    {driver.firstName[0]}{driver.lastName[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm">{driver.firstName} {driver.lastName}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span className="font-mono bg-slate-100 px-1 rounded">{driver.licenseNumber}</span>
                                                        <span>•</span>
                                                        <span className="text-emerald-600 flex items-center gap-0.5"><FaCheck className="text-[10px]" /> Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAssign(driver.id, `${driver.firstName} ${driver.lastName}`)}
                                                disabled={submitting !== null}
                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                            >
                                                {submitting === driver.id ? '...' : <><FaUserPlus /> Assign</>}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-sm font-medium">Done</button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentModal;
