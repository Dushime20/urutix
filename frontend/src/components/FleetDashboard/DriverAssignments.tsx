import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  User,
  Plus,
  X,
  Search,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Zap,
  Layout
} from 'lucide-react';
import { fleetApi, type FleetItem, type Driver, type DriverAssignment } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import { errorMessage } from '../../utils/error';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export const DriverAssignments: React.FC = () => {
  const [trucks, setTrucks] = useState<FleetItem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTruck, setSearchTruck] = useState('');
  const [searchDriver, setSearchDriver] = useState('');
  const [selectedTruck, setSelectedTruck] = useState<FleetItem | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [trucksData, driversData] = await Promise.all([
        fleetApi.getTrucks({}),
        fleetApi.getDrivers({ status: 'ACTIVE' })
      ]);
      setTrucks(trucksData);
      setDrivers(driversData);
    } catch (error: any) {
      toast.error(errorMessage(error, 'Failed to synchronize personnel matrix'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTrucks = trucks.filter(truck => {
    const searchLower = searchTruck.toLowerCase();
    return (
      truck.plateNumber?.toLowerCase().includes(searchLower) ||
      truck.make?.toLowerCase().includes(searchLower) ||
      truck.model?.toLowerCase().includes(searchLower)
    );
  });

  const getTruckLabel = (id?: string) => {
    if (!id) return 'another truck';
    const truck = trucks.find(t => t.id === id);
    if (!truck) return 'another truck';
    return truck.plateNumber || `${truck.make || ''} ${truck.model || ''}`.trim() || 'another truck';
  };

  const getAvailableDrivers = (truck: FleetItem): Driver[] => {
    const assignedDriverIds = (truck.assignedDrivers || []).map(a => a.driverId);
    return drivers.filter(
      driver =>
        !assignedDriverIds.includes(driver.id) &&
        (!driver.currentTruckId || driver.currentTruckId === truck.id),
    );
  };

  const getTransferCandidates = (truck: FleetItem): Driver[] => {
    const assignedDriverIds = (truck.assignedDrivers || []).map(a => a.driverId);
    return drivers.filter(
      driver =>
        !assignedDriverIds.includes(driver.id) &&
        !!driver.currentTruckId &&
        driver.currentTruckId !== truck.id,
    );
  };

  const handleAssignDriver = async (truckId: string, driverId: string) => {
    setAssigning(true);
    try {
      await fleetApi.assignDriverToTruck(truckId, driverId, {
        notes: assignmentNotes || undefined
      });
      toast.success('Asset synchronization successful');
      setShowAssignModal(false);
      setSelectedTruck(null);
      setAssignmentNotes('');
      await loadData();
    } catch (error: any) {
      toast.error(errorMessage(error, 'Synchronization failed'));
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignDriver = async (truckId: string, driverId: string) => {
    if (!confirm('Terminate this asset assignment?')) return;
    try {
      await fleetApi.unassignDriverFromTruck(truckId, driverId);
      toast.success('Assignment terminated');
      await loadData();
    } catch (error: any) {
      toast.error(errorMessage(error, 'Termination failed'));
    }
  };

  const handleTransferDriver = async (truckId: string, driverId: string, driverName: string) => {
    const driver = drivers.find(d => d.id === driverId);
    const fromLabel = getTruckLabel(driver?.currentTruckId);
    const toLabel = getTruckLabel(truckId);
    if (!confirm(`Move ${driverName} from ${fromLabel} to ${toLabel}?`)) return;

    setAssigning(true);
    try {
      const result = await fleetApi.transferDriverToTruck(truckId, driverId, assignmentNotes || undefined);
      toast.success(result.message || `Transferred ${driverName} to ${toLabel}`);
      setShowAssignModal(false);
      setSelectedTruck(null);
      setAssignmentNotes('');
      await loadData();
    } catch (error: any) {
      toast.error(errorMessage(error, 'Transfer failed'));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Context Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="size-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-500 shadow-inner">
          <Layout size={16} />
        </div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Personnel Deployment Matrix</h2>
      </div>

      {/* Matrix Control */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Filter by plate, make or model..."
            value={searchTruck}
            onChange={(e) => setSearchTruck(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-50 rounded-[24px] text-[11px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-50 focus:border-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {filteredTrucks.map(truck => (
            <motion.div
              layout
              key={truck.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform"><Zap size={80} /></div>

              <div className="flex items-start justify-between mb-6">
                <div className="size-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                  <Truck size={24} />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{truck.make} {truck.model}</h3>
                  <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">{truck.plateNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deployed Personnel</p>
                <div className="space-y-2">
                  {(truck.assignedDrivers || []).length > 0 ? (
                    truck.assignedDrivers?.map((assignment: DriverAssignment) => (
                      <div key={assignment.driverId} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-50 group/item hover:bg-white hover:border-slate-100 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover/item:text-primary-500 shadow-sm transition-colors">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{assignment.driverName || 'Personnel Null'}</p>
                            <p className="text-[9px] font-black uppercase text-primary-500">Active Duty</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnassignDriver(truck.id, assignment.driverId)}
                          className="size-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Available for Deployment</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedTruck(truck);
                  setShowAssignModal(true);
                }}
                className="mt-6 w-full py-3 bg-slate-50 text-primary-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-primary-500/20"
              >
                <Plus size={14} className="inline mr-2" />
                Deploy Personnel
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary-500 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Matrix Pulse...</p>
        </div>
      )}

      {/* Assignment Portal */}
      {showAssignModal && selectedTruck && createPortal(
        <div className="fixed inset-0 bg-primary-950/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setShowAssignModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10 bg-primary-500 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={100} /></div>
              <div className="size-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck size={40} />
              </div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Initialize Deployment</h2>
              <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.2em]">{selectedTruck.plateNumber}</p>
              <button onClick={() => setShowAssignModal(false)} className="absolute top-6 right-6 size-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-10 space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search available personnel..."
                  value={searchDriver}
                  onChange={(e) => setSearchDriver(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-[11px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-50 outline-none transition-all"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {getAvailableDrivers(selectedTruck)
                  .filter(d => `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchDriver.toLowerCase()))
                  .map(driver => (
                    <button
                      key={driver.id}
                      onClick={() => handleAssignDriver(selectedTruck.id, driver.id)}
                      disabled={assigning}
                      className="w-full p-4 flex items-center justify-between bg-slate-50 rounded-2xl border border-transparent hover:border-primary-100 hover:bg-primary-50 transition-all group/driver"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover/driver:text-primary-500 shadow-sm">
                          <User size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900">{driver.firstName} {driver.lastName}</p>
                          <p className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Available</p>
                        </div>
                      </div>
                      <CheckCircle2 size={18} className="text-slate-200 group-hover/driver:text-primary-500" />
                    </button>
                  ))}

                {getTransferCandidates(selectedTruck)
                  .filter(d => `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchDriver.toLowerCase()))
                  .map(driver => (
                    <button
                      key={`transfer-${driver.id}`}
                      onClick={() => handleTransferDriver(selectedTruck.id, driver.id, `${driver.firstName} ${driver.lastName}`)}
                      disabled={assigning}
                      className="w-full p-4 flex items-center justify-between bg-amber-50 rounded-2xl border border-amber-100 hover:border-amber-200 hover:bg-amber-100/60 transition-all group/driver"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
                          <User size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900">{driver.firstName} {driver.lastName}</p>
                          <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest">
                            On {getTruckLabel(driver.currentTruckId)} — tap to transfer
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 size={18} className="text-amber-300 group-hover/driver:text-amber-600" />
                    </button>
                  ))}

                {getAvailableDrivers(selectedTruck).length === 0 &&
                  getTransferCandidates(selectedTruck).length === 0 && (
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-8">
                      No drivers available for this truck
                    </p>
                  )}
              </div>

              <textarea
                placeholder="Strategic deployment notes (optional)..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-[11px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-primary-50 outline-none transition-all resize-none h-24"
              />
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};
