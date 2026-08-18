import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  User,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import type { FleetItem } from '../../types/fleet';
import { documentApi, type Document } from '../../services/documents/documentApi';
import { fleetApi } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui';
import { motion } from 'framer-motion';
import { TruckFullProfile } from './TruckFullProfile';

interface FleetModalProps {
  fleetItem: FleetItem | null;
  onClose: () => void;
  activeTab: 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes';
}

const FleetModalComp: React.FC<FleetModalProps> = ({
  fleetItem,
  onClose,
  activeTab,
}) => {
  const [driverDocuments, setDriverDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [fullTruck, setFullTruck] = useState<any>(null);
  const [loadingTruck, setLoadingTruck] = useState(false);

  useEffect(() => {
    if (!fleetItem || activeTab !== 'trucks') {
      setFullTruck(null);
      return;
    }

    let cancelled = false;
    const fetchTruck = async () => {
      setLoadingTruck(true);
      try {
        const truck = await fleetApi.getTruck(fleetItem.id);
        if (!cancelled) setFullTruck(truck);
      } catch {
        if (!cancelled) setFullTruck(fleetItem);
      } finally {
        if (!cancelled) setLoadingTruck(false);
      }
    };

    fetchTruck();
    return () => { cancelled = true; };
  }, [fleetItem, activeTab]);

  useEffect(() => {
    if (!fleetItem || activeTab !== 'drivers') {
      setDriverDocuments([]);
      return;
    }

    let cancelled = false;
    const fetchDocuments = async () => {
      setLoadingDocs(true);
      try {
        const docs = await documentApi.getDocumentsByEntity('DRIVER', fleetItem.id);
        if (!cancelled) setDriverDocuments(docs);
      } catch (error: any) {
        if (!cancelled) setDriverDocuments([]);
      } finally {
        if (!cancelled) setLoadingDocs(false);
      }
    };

    fetchDocuments();
    return () => { cancelled = true; };
  }, [fleetItem, activeTab]);

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const blob = await documentApi.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Asset downloaded successfully');
    } catch {
      toast.error('Download vector failed');
    }
  };

  if (!fleetItem) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE': return 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50';
      case 'IN_TRANSIT': return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      case 'MAINTENANCE': return 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
      default: return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const SectionHeader = ({ icon: Icon, title }: any) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="size-8 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
        <Icon size={16} />
      </div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</h3>
    </div>
  );

  return (
    <Dialog open={!!fleetItem} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent">
        <DialogHeader className="hidden">
          <DialogTitle>{fleetItem.name}</DialogTitle>
          <DialogDescription>Asset Intelligence Matrix</DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl dark:shadow-none border border-gray-100 dark:border-gray-800 relative overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300"
        >
          {/* Top Banner */}
          <div className="p-8 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-5">
              <div className="size-16 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 border border-gray-100 dark:border-gray-800 transition-colors">
                {activeTab === 'trucks' ? <Truck size={32} /> : <User size={32} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight transition-colors">{fleetItem.name}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${getStatusColor(fleetItem.status)} transition-colors`}>
                    {fleetItem.status}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">System ID: {fleetItem.id.slice(0, 12)}...</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="size-12 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {activeTab === 'trucks' ? (
              loadingTruck && !fullTruck ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="size-10 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-4" />
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Loading truck details...</p>
                </div>
              ) : (
                <TruckFullProfile truck={fullTruck || fleetItem} />
              )
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <SectionHeader icon={ShieldCheck} title="Primary Parameters" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">License No.</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fleetItem.licenseNumber}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Experience</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fleetItem.experience} Years</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                  <div>
                    <SectionHeader icon={FileText} title="Personnel Assets" />
                    <div className="space-y-3">
                      {loadingDocs ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                          <div className="size-10 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-4" />
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Syncing Assets...</p>
                        </div>
                      ) : driverDocuments.length === 0 ? (
                        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                          <FileText size={32} className="mx-auto text-gray-200 dark:text-gray-600 mb-4" />
                          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Zero Registry Entries</p>
                        </div>
                      ) : (
                        driverDocuments.map(doc => (
                          <div key={doc.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="size-10 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center text-blue-400 dark:text-blue-500"><FileText size={18} /></div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[150px]">{doc.title}</p>
                                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider truncate">{doc.status}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleDownloadDocument(doc)} className="size-8 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400 transition-colors"><Download size={14} /></button>
                              <button onClick={() => documentApi.openDocumentInNewTab(doc.id)} className="size-8 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><ExternalLink size={14} /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
              </div>
            </div>
            )}
          </div>

          <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex justify-end transition-colors">
            <button onClick={onClose} className="px-8 py-3 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-md dark:shadow-none">Close Matrix</button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export const FleetModal = React.memo(FleetModalComp);