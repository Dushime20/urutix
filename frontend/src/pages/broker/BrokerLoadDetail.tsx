import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad, type LoadContract, getPickupAddress, getDeliveryAddress, getPickupDate, getDeliveryDate, getPickupCoords, getDeliveryCoords } from '../../services/brokerApi';
import LocationLabel from '../../components/common/LocationLabel';
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
    <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in pb-32">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
           <button onClick={() => navigate('/dashboard/broker/loads')} className="p-2 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800 transition-colors">
             <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
           </button>
           <div>
             <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{load.title}</h1>
             <p className="text-slate-500 text-sm mt-1">ID: {load.id}</p>
           </div>
         </div>
         <span className={`px-4 py-1.5 rounded-full text-xs font-semibold self-start md:self-auto ${getStatusPrimeStyle(load.status)}`}>
           {load.status.replace('_', ' ')}
         </span>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
           <p className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2"><DollarSign size={16}/> Total Capital</p>
           <p className="text-3xl font-bold text-slate-900 dark:text-white">{load.loadValue?.toLocaleString() || 0} <span className="text-base font-medium text-slate-400">{load.currencyCode}</span></p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-6 shadow-sm border border-emerald-200 dark:border-emerald-800/50 flex flex-col justify-center">
           <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2"><TrendingUp size={16}/> Broker Yield ({load.brokerCommissionRate || 0}%)</p>
           <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{load.brokerCommissionAmount?.toLocaleString() || 0} <span className="text-base font-medium">{load.currencyCode}</span></p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
           <p className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2"><Truck size={16}/> Carrier Payout</p>
           <p className="text-3xl font-bold text-slate-900 dark:text-white">
             {((load.loadValue || 0) - (load.brokerCommissionAmount || 0)).toLocaleString()} <span className="text-base font-medium text-slate-400">{load.currencyCode}</span>
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Left Col) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logistics & Route */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><MapPin size={20} className="text-primary-600"/> Route Details</h3>
             <div className="space-y-6 relative">
                <div className="absolute left-[7px] top-6 bottom-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex gap-4 relative z-10">
                  <div className="mt-1"><div className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-primary-600"></div></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pickup Location</p>
                    <LocationLabel
                      address={getPickupAddress(load)}
                      lat={getPickupCoords(load)?.lat}
                      lng={getPickupCoords(load)?.lng}
                      fallback="Not Specified"
                      className="text-base font-medium text-slate-900 dark:text-white"
                    />
                    {getPickupDate(load) && <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-2"><Calendar size={14} className="text-primary-500"/> {new Date(getPickupDate(load)!).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                  </div>
                </div>
                <div className="flex gap-4 relative z-10">
                  <div className="mt-1"><div className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-800 dark:border-slate-400"></div></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Delivery Location</p>
                    <LocationLabel
                      address={getDeliveryAddress(load)}
                      lat={getDeliveryCoords(load)?.lat}
                      lng={getDeliveryCoords(load)?.lng}
                      fallback="Not Specified"
                      className="text-base font-medium text-slate-900 dark:text-white"
                    />
                    {getDeliveryDate(load) && <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-2"><Calendar size={14} className="text-slate-500"/> {new Date(getDeliveryDate(load)!).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                  </div>
                </div>
             </div>
          </div>

          {/* Load Specifications */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Package size={20} className="text-primary-600"/> Cargo Specifications</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Load Type</p>
                  <p className="font-medium text-slate-900 dark:text-white">{load.loadType || 'Not Specified'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Cargo Type</p>
                  <p className="font-medium text-slate-900 dark:text-white">{load.cargoType || 'Not Specified'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Equipment</p>
                  <p className="font-medium text-slate-900 dark:text-white">{load.equipmentType || 'Not Specified'}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Weight</p>
                  <p className="font-medium text-slate-900 dark:text-white">{load.weight ? `${load.weight.toLocaleString()} KG` : 'Not Specified'}</p>
                </div>
             </div>
             {load.description && (
                <div className="p-5 border border-slate-100 dark:border-slate-700/50 rounded-xl bg-white dark:bg-slate-800/20">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><FileText size={14}/> Context / Instructions</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{load.description}</p>
                </div>
             )}
          </div>

          {/* Tracking */}
          {(load.status === 'IN_TRANSIT' || load.status === 'DELIVERED' || trackingEvents.length > 0) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Activity size={20} className="text-primary-600"/> Tracking History</h3>
                 <button onClick={() => fetchTrackingInfo(load.id)} className="p-2 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800 transition-colors">
                   <Activity size={18} className="text-slate-500"/>
                 </button>
               </div>
               <BrokerTrackingSection trackingEvents={trackingEvents} onRefresh={() => fetchTrackingInfo(load.id)} loading={trackingLoading} />
            </div>
          )}
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Sourcing Actions</h3>
             <div className="space-y-3">
               <button onClick={() => setShowMatchModal(true)} className="w-full flex items-center justify-between p-4 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 transition-colors border border-primary-100 dark:bg-primary-900/20 dark:border-primary-900/30 dark:text-primary-400">
                 <div className="flex items-center gap-3"><Target size={18}/> <span className="font-medium">Direct Match</span></div>
                 <ChevronRight size={16}/>
               </button>
               <button onClick={() => setShowAuctionModal(true)} className="w-full flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-900/30 dark:text-indigo-400">
                 <div className="flex items-center gap-3"><Zap size={18}/> <span className="font-medium">Start Auction</span></div>
                 <ChevronRight size={16}/>
               </button>
             </div>
          </div>

          {/* Shipper */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><User size={20} className="text-primary-600"/> Shipper Details</h3>
             {load.cargoOwner ? (
               <div className="space-y-4">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg border border-slate-200 dark:border-slate-700">
                     {(load.cargoOwner.profile?.firstName || load.cargoOwner.email || 'U').charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className="font-medium text-slate-900 dark:text-white">{load.cargoOwner.profile?.firstName ? `${load.cargoOwner.profile.firstName} ${load.cargoOwner.profile.lastName || ''}` : 'Name Not Provided'}</p>
                     <p className="text-sm text-slate-500">{load.cargoOwner.profile?.companyName || 'Company Not Provided'}</p>
                   </div>
                 </div>
                 <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                   {load.cargoOwner.email ? (
                     <a href={`mailto:${load.cargoOwner.email}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-primary-600 dark:text-slate-300">
                       <Mail size={16} className="text-slate-400"/> <span className="truncate">{load.cargoOwner.email}</span>
                     </a>
                   ) : (
                     <p className="flex items-center gap-3 text-sm text-slate-400"><Mail size={16}/> No Email Provided</p>
                   )}
                   {load.cargoOwner.phone ? (
                     <a href={`tel:${load.cargoOwner.phone}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-primary-600 dark:text-slate-300">
                       <Phone size={16} className="text-slate-400"/> <span>{load.cargoOwner.phone}</span>
                     </a>
                   ) : (
                     <p className="flex items-center gap-3 text-sm text-slate-400"><Phone size={16}/> No Phone Provided</p>
                   )}
                 </div>
               </div>
             ) : (
               <p className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">Shipper details unavailable.</p>
             )}
          </div>

          {/* Contract / Agreement */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><ShieldCheck size={20} className="text-primary-600"/> Active Agreement</h3>
             {contract ? (
               <div className="space-y-4">
                 <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                   <span className="text-sm font-medium text-slate-500">Status</span>
                   <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg">{contract.status}</span>
                 </div>
                 <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                   <span className="text-sm font-medium text-slate-500">Agreed Rate</span>
                   <span className="text-sm font-semibold text-slate-900 dark:text-white">{contract.agreedRate.toLocaleString()} {contract.currencyCode}</span>
                 </div>
                 <button onClick={() => navigate('/dashboard/broker/contracts')} className="w-full flex justify-center items-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors text-sm font-medium dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 mt-2 border border-slate-200 dark:border-slate-700">
                   View Full Contract <ExternalLink size={14}/>
                 </button>
               </div>
             ) : (
               <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                 <ShieldCheck size={24} className="mx-auto text-slate-400 mb-2"/>
                 <p className="text-sm text-slate-500">No active agreement currently.</p>
               </div>
             )}
          </div>
        </div>
      </div>

      <MatchTransportersModal isOpen={showMatchModal} onClose={() => setShowMatchModal(false)} loadId={load.id} />
      <CreateBrokerAuctionModal isOpen={showAuctionModal} onClose={() => setShowAuctionModal(false)} loadId={load.id} loadTitle={load.title} onSuccess={() => loadLoadDetails()} />
    </div>
  );
};

export default BrokerLoadDetail;
