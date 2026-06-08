import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad } from '../../services/brokerApi';
import TransporterSearch from '../../components/broker/TransporterSearch';
import { 
  Users, 
  Package, 
  Truck, 
  DollarSign, 
  CheckCircle2,
  Clock,
  X,
  Search,
  Send,
  Loader2,
  AlertCircle,
  Activity,
  Zap,
  Shield,
  ArrowRight,
  ChevronRight,
  Target
} from 'lucide-react';

interface MatchProposal {
  id?: string;
  loadId: string;
  loadTitle: string;
  transporterId?: string;
  transporterName?: string;
  proposedRate?: number;
  commissionRate: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt?: string;
}

const DealFacilitation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loadId = searchParams.get('loadId');
  
  const [brokerLoads, setBrokerLoads] = useState<BrokerLoad[]>([]);
  const [proposals, setProposals] = useState<MatchProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(!!loadId);
  const [selectedLoad, setSelectedLoad] = useState<string | null>(loadId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadBrokerLoads();
      loadProposals();
    }
  }, [user]);

  const loadBrokerLoads = async () => {
    try {
      const response = await brokerAPI.getBrokerLoads(user!.id);
      const loadsData = response.data || response || [];
      setBrokerLoads(Array.isArray(loadsData) ? loadsData : []);
    } catch (err) {
      console.error('Failed to load broker loads:', err);
      setBrokerLoads([]);
    }
  };

  const loadProposals = async () => {
    setProposals([
      {
        loadId: '1',
        loadTitle: 'Electronics Shipment',
        transporterName: 'ABC Transport',
        commissionRate: 5.5,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoad) return;

    try {
      setSubmitting(true);
      alert('Match proposal created successfully!');
      setShowProposalForm(false);
      loadProposals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Facilitation Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Facilitation</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Match Synthesis</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 mr-4">
           <button onClick={() => { setShowProposalForm(true); navigate('/dashboard/broker/discovery'); }} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
             <Zap size={14} /> Sync
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Active Units */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-10 group relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div> Active Units
              </h3>
              {brokerLoads.length === 0 ? (
                <div className="py-24 text-center space-y-6 opacity-30">
                  <Package size={48} className="mx-auto text-slate-100" />
                  <p className="text-sm font-bold uppercase">No active units.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {brokerLoads.map((load) => (
                    <div key={load.id} onClick={() => { setSelectedLoad(load.id); setShowProposalForm(true); }} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-50 cursor-pointer group/it hover:bg-white hover:shadow-2xl hover:border-slate-100 transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <p className="text-sm font-bold text-slate-900 uppercase italic">{load.title}</p>
                          <span className="text-[8px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg uppercase">ACT</span>
                       </div>
                       <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                          <DollarSign size={14} className="text-slate-300" />
                          <span className="text-xs font-bold text-slate-700">{load.loadValue.toLocaleString()} {load.currencyCode}</span>
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>

        {/* Proposals Stream */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-10">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Proposals
                 </h3>
                 <span className="text-sm font-bold text-slate-400 uppercase">{proposals.length} Pending</span>
              </div>

              {proposals.length === 0 ? (
                <div className="py-32 text-center space-y-8 opacity-20">
                   <Target size={64} className="mx-auto text-slate-100" />
                   <p className="text-xs font-bold uppercase tracking-[0.3em]">No synthesis proposals logged.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {proposals.map((prop, i) => (
                    <div key={i} className="p-10 bg-slate-50 rounded-[3rem] border border-slate-50 relative group hover:bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"><Package size={24} /></div>
                             <div>
                                <h4 className="text-xl font-bold text-slate-900 uppercase italic">{prop.loadTitle}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                   <Truck size={14} className="text-primary-500" />
                                   <p className="text-sm font-bold text-slate-400 uppercase">Carrier: {prop.transporterName}</p>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Yield</p>
                                <p className="text-lg font-bold text-slate-900 italic">{prop.commissionRate}%</p>
                             </div>
                             <div className={`px-5 py-2 rounded-xl text-xs font-bold uppercase ${prop.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {prop.status}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </div>
      </div>

      {showProposalForm && (
        <Dialog open={showProposalForm} onOpenChange={setShowProposalForm}>
          <DialogContent className="sm:max-w-xl bg-white rounded-[4rem] border-none shadow-2xl p-0 overflow-hidden animate-slide-up">
             <div className="p-16 bg-slate-900 text-white relative overflow-hidden">
                <h2 className="text-4xl font-bold uppercase italic leading-none">Match <br /><span className="text-primary-600">Synthesis</span></h2>
                <p className="text-sm font-bold text-slate-500 uppercase mt-6">Proposal Node</p>
                <div className="absolute top-0 right-0 p-12 opacity-5"><Zap size={120} /></div>
             </div>

             <form onSubmit={handleCreateProposal} className="p-16 space-y-10">
                <div className="space-y-3">
                   <label className="text-sm font-bold text-slate-400 uppercase ml-4">Select Unit</label>
                   <select value={selectedLoad || ''} onChange={(e) => setSelectedLoad(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-8 py-5 text-[11px] font-bold uppercase outline-none border border-transparent focus:border-slate-100 transition-all appearance-none cursor-pointer" required>
                      <option value="">Select Target...</option>
                      {brokerLoads.map(l => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                   </select>
                </div>

                <div className="space-y-3">
                   <label className="text-sm font-bold text-slate-400 uppercase ml-4">Search Carrier</label>
                   <TransporterSearch onSelect={() => {}} />
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-400 uppercase ml-4">Offer</label>
                      <input type="number" placeholder="0.00" className="w-full bg-slate-50 rounded-2xl px-8 py-5 text-[11px] font-bold uppercase outline-none focus:bg-white border border-transparent focus:border-slate-100 transition-all" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-400 uppercase ml-4">Yield %</label>
                      <input type="number" step="0.1" defaultValue={5} className="w-full bg-slate-50 rounded-2xl px-8 py-5 text-[11px] font-bold uppercase outline-none focus:bg-white border border-transparent focus:border-slate-100 transition-all" />
                   </div>
                </div>

                <div className="pt-8 flex gap-4">
                   <button type="button" onClick={() => setShowProposalForm(false)} className="px-10 py-5 bg-slate-50 text-sm font-bold uppercase text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">Cancel</button>
                   <button type="submit" disabled={submitting} className="flex-1 py-5 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl flex items-center justify-center gap-3">
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Proposal</>}
                   </button>
                </div>
             </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Internal Dialog components if not already available in this project's format
const Dialog = ({ children, open }: any) => open ? <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm">{children}</div> : null;
const DialogContent = ({ children, className }: any) => <div className={className}>{children}</div>;

export default DealFacilitation;
