import React, { useState, useEffect } from 'react';
import {
  Truck,
  User,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  Settings,
  Download,
  Shield,
  MoreVertical,
  ChevronRight,
  Zap,
  Star,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FleetItem } from '../../types/fleet';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { toast } from 'react-hot-toast';

interface FleetTableProps {
  fleetItems: FleetItem[];
  lastFleetItemRef: (node: HTMLElement | null) => void;
  view: 'grid' | 'list';
  activeTab: 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes' | 'matches' | 'overview';
  onRowClick: (item: FleetItem) => void;
  onEditFleetItem: (item: FleetItem) => void;
  onDeleteFleetItem: (itemId: string) => void;
}

const FleetTableComp: React.FC<FleetTableProps> = ({
  fleetItems,
  lastFleetItemRef,
  view,
  activeTab,
  onRowClick,
  onEditFleetItem,
  onDeleteFleetItem
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { tSync } = useTranslation();

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const handleSelectAll = () => {
    if (selectedIds.length === fleetItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(fleetItems.map(item => item.id));
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_TRANSIT':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'MAINTENANCE':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'OUT_OF_SERVICE':
        return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return tSync('Available');
      case 'IN_TRANSIT':
        return tSync('In Transit');
      case 'MAINTENANCE':
        return tSync('Maintenance');
      case 'OUT_OF_SERVICE':
        return tSync('Out of Service');
      default:
        return tSync(status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    }
  };

  const BulkActionsToolbar = () => (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-[#1A1C1E] text-white px-8 py-4 rounded-[32px] shadow-2xl z-[60] flex items-center gap-8 border border-white/10 backdrop-blur-xl"
    >
      <div className="flex items-center gap-4 border-r border-white/10 pr-8">
        <div className="size-8 bg-primary-500 rounded-full flex items-center justify-center text-[11px] font-black">
          {selectedIds.length}
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Selection</h4>
          <p className="text-xs font-bold text-white">Assets Ready</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="h-10 px-4 hover:bg-white/5 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider">
          <Settings size={14} className="text-primary-400" />
          Batch Status
        </button>
        <button className="h-10 px-4 hover:bg-white/5 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider">
          <Download size={14} className="text-emerald-400" />
          Export Data
        </button>
        <div className="w-px h-6 bg-white/10 mx-2" />
        <button
          onClick={() => onDeleteFleetItem(selectedIds[0])} // For now, just a placeholder for bulk delete
          className="h-10 px-4 hover:bg-rose-500/10 text-rose-400 rounded-xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider"
        >
          <Trash2 size={14} />
          Purge Assets
        </button>
      </div>

      <button
        onClick={() => setSelectedIds([])}
        className="ml-4 h-10 w-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white"
      >
        <MinusSquare size={18} />
      </button>
    </motion.div>
  );

  if (view === 'grid') {
    return (
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fleetItems.map((item, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.id}
              ref={index === fleetItems.length - 1 ? lastFleetItemRef : null}
              className={`group bg-white rounded-[32px] border transition-all duration-300 relative overflow-hidden flex flex-col ${selectedIds.includes(item.id)
                ? 'border-primary-500 shadow-xl ring-1 ring-primary-500/20'
                : 'border-slate-100 shadow-sm hover:shadow-xl hover:border-primary-200'
                }`}
              onClick={() => onRowClick(item)}
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500">
                {activeTab === 'trucks' ? <Truck size={100} /> : <User size={100} />}
              </div>

              <div className="p-6 flex justify-between items-start relative z-10">
                <div
                  onClick={(e) => handleSelectOne(item.id, e)}
                  className="size-6 cursor-pointer relative"
                >
                  <AnimatePresence mode="wait">
                    {selectedIds.includes(item.id) ? (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="text-primary-600"
                      >
                        <CheckSquare size={24} />
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-slate-200 group-hover:text-primary-300 transition-colors"
                      >
                        <Square size={24} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </div>
              </div>

              <div className="px-6 pb-2 space-y-4 flex-1 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 group/title">
                    <span className="text-[10px] font-black text-primary-500/60 uppercase tracking-[0.2em]">Asset Matrix</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-primary-500/20 to-transparent" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
                    {item.name}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity size={10} className="text-slate-300" />
                    ID: {item.id.substring(0, 8)}...
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {activeTab === 'trucks' ? (
                    <>
                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plate</p>
                        <p className="text-xs font-bold text-slate-700">{item.plateNumber || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                        <p className="text-xs font-bold text-slate-700">{item.capacityWeight?.toLocaleString() || 0} kg</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                        <p className="text-xs font-bold text-slate-700">{item.experience || 0} Years</p>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Link</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{item.currentTruck?.licensePlate || 'None'}</p>
                      </div>
                    </>
                  )}
                </div>

                {item.currentLocation?.address && (
                  <div className="bg-primary-50/30 p-3 rounded-2xl border border-primary-50/50 flex items-start gap-3">
                    <MapPin size={14} className="text-primary-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] font-medium text-slate-600 leading-snug line-clamp-1 italic">
                      {item.currentLocation.address}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50/50 group-hover:bg-primary-50/50 transition-colors border-t border-slate-50 flex items-center justify-between mt-auto">
                <div className="flex -space-x-1 pl-3">
                  <div className="size-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-500">
                    <Shield size={10} />
                  </div>
                  <div className="size-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-500">
                    <Zap size={10} />
                  </div>
                </div>

                <div className="flex items-center gap-1 pr-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditFleetItem(item); }}
                    className="size-9 bg-white hover:bg-primary-500 hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all shadow-sm border border-slate-100"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteFleetItem(item.id); }}
                    className="size-9 bg-white hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all shadow-sm border border-slate-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {selectedIds.length > 0 && <BulkActionsToolbar />}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-8 py-6 text-left w-[60px]">
                <div onClick={handleSelectAll} className="size-6 cursor-pointer relative">
                  {selectedIds.length === fleetItems.length && fleetItems.length > 0 ? (
                    <CheckSquare size={24} className="text-primary-600" />
                  ) : selectedIds.length > 0 ? (
                    <MinusSquare size={24} className="text-primary-600" />
                  ) : (
                    <Square size={24} className="text-slate-200 hover:text-primary-200 transition-colors" />
                  )}
                </div>
              </th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">
                Identity Profile
              </th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">
                Operational Status
              </th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">
                Geospatial Vector
              </th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">
                Technical Matrix
              </th>
              <th className="px-6 py-6 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {fleetItems.map((item, index) => (
              <motion.tr
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                key={item.id}
                ref={index === fleetItems.length - 1 ? lastFleetItemRef : null}
                className={`group hover:bg-slate-50/50 transition-all cursor-pointer ${selectedIds.includes(item.id) ? 'bg-primary-50/40' : ''}`}
                onClick={() => onRowClick(item)}
              >
                <td className="px-8 py-6" onClick={(e) => handleSelectOne(item.id, e)}>
                  {selectedIds.includes(item.id) ? (
                    <CheckSquare size={22} className="text-primary-600" />
                  ) : (
                    <Square size={22} className="text-slate-100 group-hover:text-slate-200 transition-colors" />
                  )}
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-[18px] bg-primary-50 flex items-center justify-center text-primary-500 shadow-inner group-hover:bg-primary-500 group-hover:text-white transition-all">
                      {activeTab === 'trucks' ? <Truck size={20} /> : <User size={20} />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 tracking-tight leading-none mb-1">{item.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.id.substring(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className={`inline-flex px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-2 max-w-[240px]">
                    <MapPin size={14} className="text-slate-300 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-slate-500 italic truncate line-clamp-1">
                      {item.currentLocation?.address || 'Awaiting Sync...'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Zap size={10} className="text-primary-500" />
                      {activeTab === 'trucks' ? item.plateNumber : item.licenseNumber || 'PROTOTYPE'}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      {activeTab === 'trucks' ? `${item.make} ${item.model}` : `${item.experience || 0} YR COMMAND`}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditFleetItem(item); }}
                      className="size-10 bg-white border border-slate-100 hover:bg-primary-500 hover:text-white rounded-xl shadow-sm flex items-center justify-center transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteFleetItem(item.id); }}
                      className="size-10 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white rounded-xl shadow-sm flex items-center justify-center transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-100 mx-1" />
                    <div className="size-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <AnimatePresence>
        {selectedIds.length > 0 && <BulkActionsToolbar />}
      </AnimatePresence>
    </div>
  );
};

export const FleetTable = React.memo(FleetTableComp);