import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type LoadDocument, type CreateDocumentData } from '../../services/brokerApi';
import { FileText, Plus, Search, Filter, Upload, Download, CheckCircle2, Loader2, Eye, FileCheck, Receipt, Clock, Activity, Zap, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentManagement: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<LoadDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<LoadDocument | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER' && selectedLoadId) {
      fetchDocuments();
    }
  }, [user, selectedLoadId, filters.type]);

  const fetchDocuments = async () => {
    if (!selectedLoadId) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getLoadDocuments(selectedLoadId, filters.type || undefined);
      const documentsData = response.data || response || [];
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (data: CreateDocumentData) => {
    try {
      await brokerAPI.uploadDocument(data);
      toast.success('Document imported successfully');
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleGenerateBOL = async (loadId: string) => {
    try {
      await brokerAPI.generateBOL(loadId);
      toast.success('BOL issued successfully');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate BOL');
    }
  };

  const handleGeneratePOD = async (loadId: string, tripId: string) => {
    try {
      await brokerAPI.generatePOD(loadId, tripId);
      toast.success('POD issued successfully');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate POD');
    }
  };

  const handleVerifyDocument = async (documentId: string) => {
    try {
      await brokerAPI.verifyDocument(documentId, 'Authorized by broker');
      toast.success('Record authorized');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to authorize document');
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'BILL_OF_LADING': return <FileText className="w-5 h-5" />;
      case 'PROOF_OF_DELIVERY': return <CheckCircle2 className="w-5 h-5" />;
      case 'INVOICE':
      case 'COMMISSION_INVOICE': return <Receipt className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (loading && selectedLoadId) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Archive Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <FileText size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Archive</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Operational Records</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4">
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-emerald-400">{documents.length}</p>
             <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">Total Records</p>
           </div>
           <button onClick={() => setShowUploadModal(true)} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl shadow-primary-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
             <Upload size={14} /> Import
           </button>
        </div>
      </div>

      {/* Command Terminal */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm relative group overflow-hidden">
        <div className="space-y-10">
          <div className="flex flex-col lg:flex-row gap-8 items-end">
            <div className="flex-1 space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Target Load ID</label>
              <div className="relative">
                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  placeholder="Scan Load ID..."
                  value={selectedLoadId}
                  onChange={(e) => setSelectedLoadId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold uppercase text-slate-900 transition-all focus:bg-white focus:border-primary-600 outline-none"
                />
              </div>
            </div>
            
            {selectedLoadId && (
              <div className="flex gap-4">
                <button onClick={() => handleGenerateBOL(selectedLoadId)} className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-sm font-bold uppercase shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3">
                  <FileText size={16} /> Issue BOL
                </button>
                <button onClick={() => { const tripId = prompt('Ref Trip ID:'); if (tripId) handleGeneratePOD(selectedLoadId, tripId); }} className="px-10 py-5 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl text-sm font-bold uppercase hover:bg-slate-100 transition-all flex items-center gap-3">
                  <CheckCircle2 size={16} /> Issue POD
                </button>
              </div>
            )}
          </div>

          {selectedLoadId && (
            <div className="pt-8 border-t border-slate-50 flex gap-6">
              <div className="flex-1 relative">
                <Filter size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input type="text" placeholder="Filter files..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="w-full bg-slate-50/50 rounded-xl pl-14 py-4 text-sm font-bold uppercase text-slate-600 outline-none focus:bg-white border border-transparent focus:border-slate-100 transition-all" />
              </div>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="bg-slate-50/50 rounded-xl px-8 py-4 text-sm font-bold uppercase text-slate-600 outline-none focus:bg-white border border-transparent focus:border-slate-100 transition-all cursor-pointer">
                <option value="">All Classes</option>
                <option value="BILL_OF_LADING">BOL</option>
                <option value="PROOF_OF_DELIVERY">POD</option>
                <option value="INVOICE">Invoices</option>
                <option value="CONTRACT">Legal</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Data Stream */}
      {!selectedLoadId ? (
        <div className="bg-white rounded-[4rem] p-32 text-center space-y-8 shadow-sm opacity-50 border border-slate-50">
          <Zap className="w-16 h-16 text-slate-200 mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Awaiting load reference to sync archive.</p>
        </div>
      ) : documents.length === 0 && !loading ? (
        <div className="bg-white rounded-[4rem] p-32 text-center space-y-8 shadow-sm border border-slate-50">
          <X className="w-16 h-16 text-slate-200 mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">No records found for this reference.</p>
        </div>
      ) : documents.length > 0 && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-8 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-50">Record Class</th>
                <th className="px-10 py-8 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-50">Auth Level</th>
                <th className="px-10 py-8 text-center text-xs font-bold text-slate-400 uppercase border-b border-slate-50">Volume</th>
                <th className="px-10 py-8 text-center text-xs font-bold text-slate-400 uppercase border-b border-slate-50">Log Date</th>
                <th className="px-10 py-8 text-right text-xs font-bold text-slate-400 uppercase border-b border-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {documents.map((doc) => (
                <tr key={doc.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => setSelectedDocument(doc)}>
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                        {getDocumentTypeIcon(doc.documentType)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 uppercase italic">{doc.documentType.replace('_', ' ')}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-0.5 max-w-[150px] truncate">{doc.fileName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase flex items-center gap-2 w-fit ${doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'VERIFIED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      {doc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-10 py-10 text-center">
                    <p className="text-xs font-bold text-slate-900">{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : ' - '}</p>
                  </td>
                  <td className="px-10 py-10 text-center">
                    <p className="text-xs font-bold text-slate-900">{new Date(doc.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-10 py-10">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                      <button className="p-4 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Eye size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); if (doc.fileUrl) window.open(doc.fileUrl); }} className="p-4 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm"><Download size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload/Import Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
           <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-10 bg-slate-900 text-white flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-bold uppercase italic">Import Record</h2>
                    <p className="text-sm font-bold text-slate-500 uppercase mt-1">Operational Injection</p>
                 </div>
                 <button onClick={() => setShowUploadModal(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-rose-600 transition-all"><X size={20} /></button>
              </div>
              <div className="p-10">
                 <UploadForm loadId={selectedLoadId} onSubmit={handleUploadDocument} onCancel={() => setShowUploadModal(false)} />
              </div>
           </div>
        </div>
      )}

      {/* View/Authorize Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
           <div className="w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
              <div className="p-10 bg-slate-900 text-white flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-bold uppercase italic">Record <span className="text-primary-400">Analysis</span></h2>
                    <p className="text-sm font-bold text-slate-500 uppercase mt-1">Authorization Terminal</p>
                 </div>
                 <button onClick={() => setSelectedDocument(null)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-rose-600 transition-all"><X size={20} /></button>
              </div>
              <div className="p-12 overflow-y-auto space-y-10">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Class</p>
                       <p className="text-xs font-bold uppercase text-slate-900">{selectedDocument.documentType.replace('_', ' ')}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Auth Level</p>
                       <p className="text-xs font-bold uppercase text-slate-900">{selectedDocument.status}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Volume</p>
                       <p className="text-xs font-bold uppercase text-slate-900">{selectedDocument.fileSize ? `${(selectedDocument.fileSize / 1024).toFixed(1)} KB` : ' - '}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-xs font-bold text-slate-400 uppercase mb-1">Logged</p>
                       <p className="text-xs font-bold uppercase text-slate-900">{new Date(selectedDocument.createdAt).toLocaleDateString()}</p>
                    </div>
                 </div>

                 {selectedDocument.documentContent && (
                    <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 font-mono text-xs leading-relaxed text-slate-600">
                       {selectedDocument.documentContent}
                    </div>
                 )}

                 <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                    <div className="flex gap-4">
                       <button onClick={() => setSelectedDocument(null)} className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-sm font-bold uppercase hover:text-slate-900 transition-all">Close</button>
                    </div>
                    <div className="flex gap-4">
                       {selectedDocument.fileUrl && (
                          <a href={selectedDocument.fileUrl} target="_blank" rel="noopener noreferrer" className="px-10 py-4 bg-slate-100 text-slate-900 rounded-2xl text-sm font-bold uppercase hover:bg-slate-200 transition-all flex items-center gap-3">
                             <Download size={14} /> Download
                          </a>
                       )}
                       {selectedDocument.status !== 'VERIFIED' && (
                          <button onClick={() => handleVerifyDocument(selectedDocument.id)} className="px-10 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl shadow-primary-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                             <FileCheck size={14} /> Authorize
                          </button>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const UploadForm: React.FC<{
  loadId: string;
  onSubmit: (data: CreateDocumentData) => void;
  onCancel: () => void;
}> = ({ loadId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateDocumentData>({ loadId: loadId || '', documentType: 'OTHER' as any, fileName: '', fileUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  return (
    <form onSubmit={async (e) => { e.preventDefault(); setSubmitting(true); try { await onSubmit(formData); } finally { setSubmitting(false); } }} className="space-y-8">
       <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
             <label className="text-sm font-bold text-slate-300 uppercase ml-2">Reference ID</label>
             <input type="text" value={formData.loadId} onChange={e => setFormData({...formData, loadId: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 border border-slate-100 outline-none focus:bg-white focus:border-primary-600 transition-all" required />
          </div>
          <div className="space-y-3">
             <label className="text-sm font-bold text-slate-300 uppercase ml-2">Record Class</label>
             <select value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value as any})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 border border-slate-100 outline-none focus:bg-white transition-all cursor-pointer">
                <option value="BILL_OF_LADING">BOL</option>
                <option value="PROOF_OF_DELIVERY">POD</option>
                <option value="INVOICE">Invoice</option>
                <option value="CONTRACT">Legal</option>
                <option value="OTHER">Generic</option>
             </select>
          </div>
       </div>
       <div className="space-y-3">
          <label className="text-sm font-bold text-slate-300 uppercase ml-2">Display Name</label>
          <input type="text" placeholder="e.g. Manifest_01.pdf" value={formData.fileName} onChange={e => setFormData({...formData, fileName: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 border border-slate-100 outline-none focus:bg-white transition-all" required />
       </div>
       <div className="space-y-3">
          <label className="text-sm font-bold text-slate-300 uppercase ml-2">Source URL</label>
          <input type="url" placeholder="https://..." value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 border border-slate-100 outline-none focus:bg-white transition-all" required />
       </div>
       <div className="flex justify-end gap-4 pt-6">
          <button type="button" onClick={onCancel} className="px-10 py-5 text-sm font-bold uppercase text-slate-400 hover:text-slate-900 transition-all">Abort</button>
          <button type="submit" disabled={submitting} className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-sm font-bold uppercase shadow-xl hover:bg-primary-600 transition-all flex items-center gap-3">
             {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Inject Record
          </button>
       </div>
    </form>
  );
};

export default DocumentManagement;
