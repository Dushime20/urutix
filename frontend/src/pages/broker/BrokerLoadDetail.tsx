import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad, type LoadContract } from '../../services/brokerApi';
import {
  Package,
  MapPin,
  DollarSign,
  Calendar,
  Truck,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  Clock,
  Weight,
  Zap,
  Activity,
  ShieldCheck,
  Target,
  ChevronRight,
  User,
  ExternalLink,
  X,
  Shield,
  ArrowRight
} from 'lucide-react';
import BrokerTrackingSection from './components/BrokerTrackingSection';
import { CreateBrokerAuctionModal } from './components/CreateBrokerAuctionModal';
import { MatchTransportersModal } from './components/MatchTransportersModal';
import { Dialog, DialogContent } from '../../components/ui/Dialog';

const BrokerLoadDetail: React.FC = () => {
  const { loadId } = useParams<{ loadId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [load, setLoad] = useState<BrokerLoad | null>(null);
  const [contract, setContract] = useState<LoadContract | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (loadId) {
      loadLoadDetails();
    }
  }, [loadId]);

  const loadLoadDetails = async () => {
    try {
      setLoading(true);
      const response = await brokerAPI.getBrokerLoads(user!.id, { loadId });
      const loads = response.data || [];
      const foundLoad = loads.find((l: BrokerLoad) => l.id === loadId) || null;
      setLoad(foundLoad);

      if (foundLoad) {
        try {
          const contractResponse = await brokerAPI.getBrokerContracts(user!.id, { loadId });
          const contracts = contractResponse.data || [];
          setContract(contracts[0] || null);
        } catch (contractErr) {
          console.error('Failed to load contract:', contractErr);
        }
        fetchTrackingInfo(foundLoad.id);
      }
    } catch (err: any) {
      console.error('Failed to load details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingInfo = async (id: string) => {
    try {
      setTrackingLoading(true);
      const response = await brokerAPI.getLoadTracking(user!.id, id);
      setTrackingEvents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tracking info:', error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusPrimeStyle = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'DELIVERED':
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'ASSIGNED':
      case 'ACTIVE': return 'bg-slate-900 text-white border-slate-700';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!load) {
    return (
      <div className="max-w-[800px] mx-auto p-12 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm text-center space-y-8 mt-24 dark:bg-slate-900 dark:border-slate-800">
        <Package size={48} className="text-slate-100 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900 uppercase italic dark:text-white">Target Not Found</h2>
        <button onClick={() => navigate('/dashboard/broker/loads')} className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-sm font-bold uppercase shadow-xl flex items-center justify-center gap-3 mx-auto transition-all hover:bg-primary-600 dark:bg-slate-950">
          <ArrowLeft size={16} /> Return to Pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-32">
      {/* Ultra-Compact Detail Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <button onClick={() => navigate('/dashboard/broker/loads')} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all backdrop-blur-xl">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">{load.title}</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">#{load.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-xl text-[8px] font-bold uppercase border shadow-lg ${getStatusPrimeStyle(load.status)}`}>
            {load.status.replace('_', ' ')}
          </span>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4 text-right">
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-primary-400">{load.brokerCommissionRate || 0}%</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Yield</p>
           </div>
           {load.brokerCommissionAmount && (
             <div className="text-center hidden md:block">
               <p className="text-xl font-bold leading-none text-emerald-400">{load.brokerCommissionAmount.toLocaleString()}</p>
               <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Profit</p>
             </div>
           )}
           <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-xl shadow-primary-900/20 group-hover:scale-110 transition-all">
             <Target size={20} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          {/* Specification System */}
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-12 space-y-12 group relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
              <div className="w-2 h-2 bg-primary-600 rounded-full"></div> Specification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-50 dark:bg-slate-800/50 dark:border-slate-800/50">
                <p className="text-xs font-bold text-slate-400 uppercase mb-4">Context</p>
                <p className="text-lg font-bold text-slate-700 leading-relaxed italic dark:text-slate-200">{load.description || 'No context logged.'}</p>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'Class', value: load.loadType || 'Standard', icon: Package },
                  { label: 'Equipment', value: load.equipmentType || 'Standard', icon: Truck },
                  { label: 'Volume', value: `${load.weight?.toLocaleString() || 'N/A'} KG`, icon: Weight },
                  { label: 'Capital', value: `${load.loadValue.toLocaleString()} ${load.currencyCode}`, icon: DollarSign },
                ].map((spec, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-50 group-hover:bg-white transition-all dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                       <spec.icon size={16} className="text-slate-300" />
                       <span className="text-sm font-bold text-slate-400 uppercase">{spec.label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 uppercase dark:text-white">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sourcing System */}
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-12 space-y-10 group relative overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Sourcing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div onClick={() => setShowMatchModal(true)} className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 cursor-pointer group/card hover:bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden relative dark:bg-slate-800/50 dark:border-slate-800">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/card:opacity-10 transition-opacity"><Target size={100} /></div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 mb-8 shadow-sm group-hover/card:bg-primary-600 group-hover/card:text-white transition-all dark:bg-slate-900"><Truck size={20} /></div>
                <h4 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight italic dark:text-white">Direct Match</h4>
                <p className="text-sm font-bold text-slate-400 uppercase leading-relaxed">algorithmic vector matching for carriers.</p>
                <div className="mt-8 flex items-center gap-2 text-primary-600 group/link text-xs font-bold uppercase">Compute <ArrowRight size={14} className="group-hover/link:translate-x-2 transition-transform" /></div>
              </div>
              <div onClick={() => setShowAuctionModal(true)} className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 cursor-pointer group/card hover:bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden relative dark:bg-slate-800/50 dark:border-slate-800">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/card:opacity-10 transition-opacity"><TrendingUp size={100} /></div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 mb-8 shadow-sm group-hover/card:bg-primary-600 group-hover/card:text-white transition-all dark:bg-slate-900"><Zap size={20} /></div>
                <h4 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight italic dark:text-white">Auction</h4>
                <p className="text-sm font-bold text-slate-400 uppercase leading-relaxed">Initiate bidding session for open rates.</p>
                <div className="mt-8 flex items-center gap-2 text-primary-600 group/link text-xs font-bold uppercase">Initiate <ArrowRight size={14} className="group-hover/link:translate-x-2 transition-transform" /></div>
              </div>
            </div>
          </div>

          {(load.status === 'IN_TRANSIT' || load.status === 'DELIVERED' || trackingEvents.length > 0) && (
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden group dark:bg-slate-900 dark:border-slate-800">
              <div className="p-10 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Vector Analysis
                </h3>
                <button onClick={() => fetchTrackingInfo(load.id)} className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 dark:bg-slate-900 dark:border-slate-800"><Activity size={18} /></button>
              </div>
              <BrokerTrackingSection trackingEvents={trackingEvents} onRefresh={() => fetchTrackingInfo(load.id)} loading={trackingLoading} />
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-12">
          {/* Trajectory */}
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 space-y-10 group overflow-hidden relative dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-3">
              <MapPin size={16} className="text-primary-600" /> Trajectory
            </h3>
            <div className="space-y-10 relative">
               <div className="absolute left-[13px] top-6 bottom-6 w-px bg-slate-100 border-l border-dashed border-slate-300"></div>
               <div className="flex gap-6 group/point z-10 relative">
                  <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg">A</div>
                  <div>
                     <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pickup</p>
                     <p className="text-sm font-bold text-slate-900 leading-snug italic uppercase dark:text-white">{load.pickupLocation}</p>
                  </div>
               </div>
               <div className="flex gap-6 group/point z-10 relative">
                  <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg dark:bg-slate-950">B</div>
                  <div>
                     <p className="text-xs font-bold text-slate-400 uppercase mb-1">Target</p>
                     <p className="text-sm font-bold text-slate-900 leading-snug italic uppercase dark:text-white">{load.deliveryLocation}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Agreements */}
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group dark:bg-slate-950">
            <div className="relative z-10 flex items-center justify-between mb-10">
              <h3 className="text-sm font-bold uppercase text-slate-500 italic dark:text-slate-400">Agreements</h3>
              <ShieldCheck size={18} className={contract ? 'text-primary-500' : 'text-slate-700'} />
            </div>
            {contract ? (
              <div className="space-y-8 relative z-10">
                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                   <div className="flex justify-between items-center text-xs font-bold uppercase">
                      <span className="text-slate-500 dark:text-slate-400">State</span>
                      <span className="text-emerald-400">{contract.status}</span>
                   </div>
                   <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Rate</span>
                      <p className="text-3xl font-bold text-white italic">{contract.agreedRate.toLocaleString()} <span className="text-sm text-primary-400">{contract.currencyCode}</span></p>
                   </div>
                </div>
                <button onClick={() => navigate('/dashboard/broker/contracts')} className="w-full py-5 bg-white text-slate-900 rounded-2xl text-sm font-bold uppercase hover:bg-primary-600 hover:text-white transition-all dark:bg-slate-900 dark:text-white">View Record <ExternalLink size={14} className="inline ml-2" /></button>
              </div>
            ) : (
              <div className="text-center py-10 opacity-30 space-y-6">
                 <ShieldCheck size={32} className="mx-auto" />
                 <p className="text-sm font-bold uppercase">No active agreement.</p>
              </div>
            )}
          </div>

          {/* Shipper */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-10 group transition-all duration-500 dark:bg-slate-900 dark:border-slate-800">
             <h3 className="text-sm font-bold text-slate-900 uppercase dark:text-white">Shipper</h3>
             <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-50 hover:bg-white hover:shadow-2xl transition-all dark:bg-slate-800/50 dark:border-slate-800/50">
                <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-primary-900/10">{(load.cargoOwner?.profile?.firstName || 'O').charAt(0).toUpperCase()}</div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 uppercase italic dark:text-white">{load.cargoOwner?.profile?.firstName || 'Shipper'}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase">{load.cargoOwner?.profile?.companyName || 'Verified Company'}</p>
                </div>
             </div>
             <div className="space-y-4">
               <button onClick={() => setShowContactModal(true)} className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-900 hover:text-white transition-all group/it dark:bg-slate-800/50">
                 <div className="flex items-center gap-4">
                   <Phone size={16} className="text-slate-300 group-hover/it:text-primary-400" />
                   <span className="text-sm font-bold uppercase">Voice Terminal</span>
                 </div>
                 <ChevronRight size={14} />
               </button>
               <button onClick={() => setShowContactModal(true)} className="w-full flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-900 hover:text-white transition-all group/it dark:bg-slate-800/50">
                 <div className="flex items-center gap-4">
                   <Mail size={16} className="text-slate-300 group-hover/it:text-primary-400" />
                   <span className="text-sm font-bold uppercase">Mail Node</span>
                 </div>
                 <ChevronRight size={14} />
               </button>
             </div>
          </div>
        </div>
      </div>

      <MatchTransportersModal isOpen={showMatchModal} onClose={() => setShowMatchModal(false)} loadId={load.id} />
      <CreateBrokerAuctionModal isOpen={showAuctionModal} onClose={() => setShowAuctionModal(false)} loadId={load.id} loadTitle={load.title} onSuccess={() => loadLoadDetails()} />

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-xl bg-white rounded-[4rem] border-none shadow-2xl p-0 overflow-hidden animate-slide-up dark:bg-slate-900">
           <div className="p-16 bg-slate-900 text-white relative overflow-hidden dark:bg-slate-950">
              <h2 className="text-4xl font-bold uppercase italic leading-none">Connect <br /><span className="text-primary-600">Shipper</span></h2>
              <p className="text-sm font-bold text-slate-500 uppercase mt-6 italic dark:text-slate-400">Authorization Interface</p>
              <div className="absolute top-0 right-0 p-12 opacity-5"><Activity size={120} /></div>
           </div>
           
           <div className="p-16 space-y-12">
              <div className="flex items-center gap-10 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-sm dark:bg-slate-800/50 dark:border-slate-800">
                 <div className="w-24 h-24 bg-primary-600 rounded-[2rem] flex items-center justify-center text-white font-bold text-4xl shadow-2xl">{(load.cargoOwner?.profile?.firstName || 'O').charAt(0).toUpperCase()}</div>
                 <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-slate-900 uppercase italic leading-none dark:text-white">{load.cargoOwner?.profile?.firstName || 'Shipper'} {load.cargoOwner?.profile?.lastName || 'Name'}</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase">{load.cargoOwner?.profile?.companyName || 'Verified Shipper Entity'}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <a href={`mailto:${load.cargoOwner?.email}`} className="flex flex-col p-10 bg-slate-50 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:scale-105 transition-all group/li border border-transparent hover:border-slate-100 dark:bg-slate-800/50">
                   <Mail className="text-slate-300 group-hover/li:text-primary-500 mb-6" size={32} />
                   <p className="text-xs font-bold text-slate-400 uppercase mb-1">Mail Node</p>
                   <p className="text-sm font-bold text-slate-900 truncate tracking-tight dark:text-white">{load.cargoOwner?.email || 'Awaiting...'}</p>
                </a>
                {load.cargoOwner?.phone && (
                   <a href={`tel:${load.cargoOwner.phone}`} className="flex flex-col p-10 bg-slate-50 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:scale-105 transition-all group/li border border-transparent hover:border-slate-100 dark:bg-slate-800/50">
                      <Phone className="text-slate-300 group-hover/li:text-emerald-500 mb-6" size={32} />
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Voice Terminal</p>
                      <p className="text-sm font-bold text-slate-900 tracking-tight dark:text-white">{load.cargoOwner.phone}</p>
                   </a>
                )}
              </div>
              <button onClick={() => setShowContactModal(false)} className="w-full py-7 bg-slate-900 text-white rounded-[2rem] text-sm font-bold uppercase hover:bg-primary-600 transition-all shadow-2xl dark:bg-slate-950">Abort Interface</button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokerLoadDetail;
