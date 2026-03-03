import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  User,
  MapPin,
  Package,
  ShieldCheck,
  FileText,
  Download,
  ExternalLink,
  Shield,
  Zap,
  Layers
} from 'lucide-react';
import type { FleetItem } from '../../types/fleet';
import { documentApi, type Document } from '../../services/documents/documentApi';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui';
import { motion } from 'framer-motion';

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
      case 'AVAILABLE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_TRANSIT': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'MAINTENANCE': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const SectionHeader = ({ icon: Icon, title }: any) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="size-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shadow-inner">
        <Icon size={16} />
      </div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h3>
    </div>
  );

  return (
    <Dialog open={!!fleetItem} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
        <DialogHeader className="hidden">
          <DialogTitle>{fleetItem.name}</DialogTitle>
          <DialogDescription>Asset Intelligence Matrix</DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Banner Vector */}
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-indigo-600 shadow-inner">
                {activeTab === 'trucks' ? <Truck size={32} /> : <User size={32} />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-indigo-600 tracking-tight">{fleetItem.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusColor(fleetItem.status)}`}>
                    {fleetItem.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System ID: {fleetItem.id.slice(0, 12)}...</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="size-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {/* Intel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <SectionHeader icon={ShieldCheck} title="Primary Parameters" />
                  <div className="grid grid-cols-2 gap-4">
                    {activeTab === 'trucks' ? (
                      <>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plate Number</p>
                          <p className="text-sm font-bold text-slate-900">{fleetItem.plateNumber}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">VIN Vector</p>
                          <p className="text-sm font-bold text-slate-900">{fleetItem.vin || 'Not Indexed'}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Make / Model</p>
                          <p className="text-sm font-bold text-slate-900">{fleetItem.make} {fleetItem.model}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Year</p>
                          <p className="text-sm font-bold text-slate-900">{fleetItem.year}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">License No.</p>
                          <p className="text-sm font-bold text-slate-900">{fleetItem.licenseNumber}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Exeperience</p>
                          <p className="text-sm font-bold text-slate-900">{fleetItem.experience} Years</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {activeTab === 'trucks' && (
                  <div>
                    <SectionHeader icon={Shield} title="Compliance & Protection" />
                    <div className="space-y-3">
                      {[
                        { l: 'Registration', v: fleetItem.registrationNumber, d: fleetItem.registrationExpiry },
                        { l: 'Insurance', v: fleetItem.insurancePolicy, d: fleetItem.insuranceExpiry },
                        { l: 'Roadworthy', v: 'Certificate', d: fleetItem.roadworthyCertExpiry }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px]">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.l}</p>
                            <p className="text-xs font-bold text-slate-900">{item.v || 'Not Provided'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiry</p>
                            <p className="text-xs font-bold text-indigo-600">{item.d ? new Date(item.d).toLocaleDateString() : 'N/A'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {activeTab === 'trucks' ? (
                  <div className="space-y-8">
                    <div>
                      <SectionHeader icon={Package} title="Payload Capabilities" />
                      <div className="p-6 bg-slate-50 rounded-[32px] space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-8 bg-white rounded-lg flex items-center justify-center text-indigo-400 shadow-sm"><Zap size={14} /></div>
                            <span className="text-xs font-bold text-slate-600">Max Payload</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">{fleetItem.capacityWeight?.toLocaleString()} kg</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-8 bg-white rounded-lg flex items-center justify-center text-indigo-400 shadow-sm"><Layers size={14} /></div>
                            <span className="text-xs font-bold text-slate-600">Volume Matrix</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">{fleetItem.capacityVolume} m³</span>
                        </div>
                        {fleetItem.cargoCapabilities?.supportedCargoTypes && (
                          <div className="pt-4 border-t border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Certified Types</p>
                            <div className="flex flex-wrap gap-2">
                              {fleetItem.cargoCapabilities.supportedCargoTypes.map((t, i) => (
                                <span key={i} className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-500">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionHeader icon={MapPin} title="Operational Vector" />
                      <div className="p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50">
                        <div className="flex items-start gap-4">
                          <div className="size-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200"><MapPin size={20} /></div>
                          <div>
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Current Coordinates</p>
                            <p className="text-sm font-bold text-slate-900 leading-snug">{fleetItem.currentLocation?.address || 'Geolocation Offline'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <SectionHeader icon={FileText} title="Personnel Assets" />
                    <div className="space-y-3">
                      {loadingDocs ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                          <div className="size-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Assets...</p>
                        </div>
                      ) : driverDocuments.length === 0 ? (
                        <div className="p-8 bg-slate-50 rounded-[32px] text-center">
                          <FileText size={32} className="mx-auto text-slate-200 mb-4" />
                          <p className="text-xs font-bold text-slate-400">Zero Registry Entries</p>
                        </div>
                      ) : (
                        driverDocuments.map(doc => (
                          <div key={doc.id} className="p-4 bg-slate-50 rounded-[24px] border border-slate-50 hover:bg-white hover:border-slate-100 hover:shadow-lg transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="size-10 bg-white rounded-xl flex items-center justify-center text-indigo-400 shadow-sm"><FileText size={18} /></div>
                              <div>
                                <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">{doc.title}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{doc.status}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => handleDownloadDocument(doc)} className="size-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"><Download size={14} /></button>
                              <button onClick={() => window.open(documentApi.getDocumentViewUrl(doc.id), '_blank')} className="size-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"><ExternalLink size={14} /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end">
            <button onClick={onClose} className="px-8 py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200">Close Matrix</button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export const FleetModal = React.memo(FleetModalComp);