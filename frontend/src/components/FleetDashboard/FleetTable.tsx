import React, { useMemo, useState, useEffect } from 'react';
import {
  Truck,
  User,
  MapPin,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  Settings,
  Download,
  Shield,
  Zap,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FleetItem } from '../../types/fleet';
import { useTranslation } from '../../hooks/useTranslation';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

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

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
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

  const listColumns: Column<FleetItem>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Identity Profile',
      sortable: true,
      render: (_: unknown, item: FleetItem) => (
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-[18px] bg-primary-50 flex items-center justify-center text-primary-500 shadow-inner">
            {activeTab === 'trucks' ? <Truck size={20} /> : <User size={20} />}
          </div>
          <div>
            <h4 className="font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{item.name}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.id.substring(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Operational Status',
      sortable: true,
      render: (_: unknown, item: FleetItem) => (
        <StatusBadge label={getStatusText(item.status)} status={item.status} />
      ),
    },
    {
      key: 'currentLocation.address',
      label: 'Geospatial Vector',
      render: (_: unknown, item: FleetItem) => (
        <div className="flex items-center gap-2 max-w-[240px]">
          <MapPin size={14} className="text-slate-300 flex-shrink-0" />
          <span className="text-[11px] font-medium text-slate-500 italic truncate">
            {item.currentLocation?.address || 'Awaiting Sync...'}
          </span>
        </div>
      ),
    },
    {
      key: 'plateNumber',
      label: 'Technical Matrix',
      render: (_: unknown, item: FleetItem) => (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Zap size={10} className="text-primary-500" />
            {activeTab === 'trucks' ? item.plateNumber : item.licenseNumber || 'PROTOTYPE'}
          </span>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
            {activeTab === 'trucks' ? `${item.make} ${item.model}` : `${item.experience || 0} YR COMMAND`}
          </span>
        </div>
      ),
    },
  ], [activeTab, tSync]);

  const listRowActions: TableAction<FleetItem>[] = useMemo(() => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit3 size={16} />,
      onClick: (item) => onEditFleetItem(item),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      variant: 'danger',
      onClick: (item) => onDeleteFleetItem(item.id),
    },
  ], [onEditFleetItem, onDeleteFleetItem]);

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
              className={`group bg-white dark:bg-slate-900 rounded-[32px] border transition-all duration-300 relative overflow-hidden flex flex-col ${selectedIds.includes(item.id)
                ? 'border-primary-500 shadow-xl ring-1 ring-primary-500/20'
                : 'border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary-200'
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

                <StatusBadge label={getStatusText(item.status)} status={item.status} />
              </div>

              <div className="px-6 pb-2 space-y-4 flex-1 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 group/title">
                    <span className="text-[10px] font-black text-primary-500/60 uppercase tracking-[0.2em]">Asset Matrix</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-primary-500/20 to-transparent" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
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
                      <div className="bg-slate-50/50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plate</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.plateNumber || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.capacityWeight?.toLocaleString() || 0} kg</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-slate-50/50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Experience</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.experience || 0} Years</p>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-50">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Link</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{item.currentTruck?.licensePlate || 'None'}</p>
                      </div>
                    </>
                  )}
                </div>

                {item.currentLocation?.address && (
                  <div className="bg-primary-50/30 p-3 rounded-2xl border border-primary-50/50 flex items-start gap-3">
                    <MapPin size={14} className="text-primary-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug line-clamp-1 italic">
                      {item.currentLocation.address}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-950 group-hover:bg-primary-50/50 transition-colors border-t border-slate-50 flex items-center justify-between mt-auto">
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
                    className="size-9 bg-white dark:bg-slate-900 hover:bg-primary-500 hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all shadow-sm border border-slate-100 dark:border-slate-800"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteFleetItem(item.id); }}
                    className="size-9 bg-white dark:bg-slate-900 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center text-slate-400 transition-all shadow-sm border border-slate-100 dark:border-slate-800"
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
      <StandardDataTable
        embedded
        className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden"
        columns={listColumns}
        data={fleetItems}
        getRowId={(row) => row.id}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rowActions={listRowActions}
        onRowClick={onRowClick}
        rowClassName={(row) => (selectedIds.includes(row.id) ? 'bg-primary-50/40' : '')}
        pagination={false}
        searchable={false}
        columnVisibility={false}
        stickyHeader
        emptyMessage={tSync('No fleet assets found')}
        ariaLabel={tSync('Fleet assets')}
      />
      {fleetItems.length > 0 && (
        <div ref={lastFleetItemRef} className="h-px w-full" aria-hidden />
      )}
      <AnimatePresence>
        {selectedIds.length > 0 && <BulkActionsToolbar />}
      </AnimatePresence>
    </div>
  );
};

export const FleetTable = React.memo(FleetTableComp);