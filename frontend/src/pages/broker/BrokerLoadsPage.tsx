import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerLoad, type LoadContract } from '../../services/brokerApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import ContractAcceptanceModal from '../../components/broker/ContractAcceptanceModal';
import FilterSelect from '../../components/common/FilterSelect';
import {
  Package,
  Search,
  Grid,
  Table,
  ArrowRight,
  Activity,
  AlertCircle,
  Download,
  Clock,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import { generateBrokerContract, type BrokerContractData } from '@/templates/brokerContract';

const BrokerLoadsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { compact: fmtMoney } = useCurrencyFormat();
  const [loads, setLoads] = useState<BrokerLoad[]>([]);
  const [contracts, setContracts] = useState<Map<string, LoadContract>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<LoadContract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Filters and view mode
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cargoTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    if (user && user.role === 'BROKER') {
      loadBrokerLoads();
    }
  }, [user]);

  const loadBrokerLoads = async () => {
    try {
      setLoading(true);
      const [loadsResponse, contractsResponse] = await Promise.all([
        brokerAPI.getBrokerLoads(user!.id),
        brokerAPI.getContracts()
      ]);

      let loadsData: BrokerLoad[] = [];
      if (Array.isArray(loadsResponse.data)) {
        loadsData = loadsResponse.data;
      } else if (Array.isArray(loadsResponse)) {
        loadsData = loadsResponse;
      } else if (loadsResponse.data && Array.isArray(loadsResponse.data)) {
        loadsData = loadsResponse.data;
      }
      setLoads(loadsData);

      const contractsData = contractsResponse.data || contractsResponse || [];
      const contractsMap = new Map<string, LoadContract>();
      if (Array.isArray(contractsData)) {
        contractsData.forEach((contract: LoadContract) => {
          if (contract.loadId) {
            contractsMap.set(contract.loadId, contract);
          }
        });
      }
      setContracts(contractsMap);
    } catch (err: any) {
      console.error('Failed to load broker loads:', err);
      toast.error(err.response?.data?.message || 'Failed to load loads');
    } finally {
      setLoading(false);
    }
  };

  const filteredLoads = useMemo(() => {
    return loads.filter(load => {
      const matchesSearch =
        load.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        load.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || load.status === statusFilter;
      const matchesCargoType = !cargoTypeFilter || load.cargoType === cargoTypeFilter;
      return matchesSearch && matchesStatus && matchesCargoType;
    });
  }, [loads, searchTerm, statusFilter, cargoTypeFilter]);

  const handleAcceptContract = async (contractId: string) => {
    try {
      await brokerAPI.acceptContract(contractId);
      toast.success('Contract accepted successfully!');
      setShowContractModal(false);
      setSelectedContract(null);
      loadBrokerLoads();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept contract');
    }
  };

  const handleViewContract = (loadId: string) => {
    const contract = contracts.get(loadId);
    if (contract) {
      setSelectedContract(contract);
      setShowContractModal(true);
    } else {
      toast.error('Contract not found for this load');
    }
  };

  const handleDownloadContract = async (loadId: string) => {
    const contract = contracts.get(loadId);
    if (!contract) return;
    const loadData = loads.find(l => l.id === loadId);
    if (!loadData) return;

    try {
      const contractResponse = await brokerAPI.getContract(contract.id);
      const fullContract = contractResponse.data || contractResponse;
      const loadInfo = fullContract.load || loadData;

      const cargoOwnerName = fullContract.cargoOwner?.profile?.firstName && fullContract.cargoOwner?.profile?.lastName
        ? `${fullContract.cargoOwner.profile.firstName} ${fullContract.cargoOwner.profile.lastName}`
        : fullContract.cargoOwner?.email || 'Cargo Owner';

      const brokerName = (user as any)?.profile?.firstName && (user as any)?.profile?.lastName
        ? `${(user as any).profile.firstName} ${(user as any).profile.lastName}`
        : user?.email || 'Broker';

      const contractData: BrokerContractData = {
        cargoOwner: {
          name: cargoOwnerName,
          company: fullContract.cargoOwner?.profile?.companyName || 'N/A',
          address: 'N/A',
          phone: fullContract.cargoOwner?.phone || 'N/A',
          email: fullContract.cargoOwner?.email || 'N/A'
        },
        broker: {
          name: brokerName,
          company: (user as any)?.profile?.companyName || 'N/A',
          address: 'N/A',
          phone: (user as any)?.phone || 'N/A',
          email: user?.email || 'N/A'
        },
        load: {
          id: loadData.id,
          title: loadData.title || loadInfo.title || 'Load',
          description: loadData.description || loadInfo.description || 'Transportation service',
          transportationFee: fullContract.agreedRate || loadData.loadValue || 0,
          currency: fullContract.currencyCode || loadData.currencyCode || 'KES',
          weight: loadData.weight || loadInfo.weight,
          cargoType: loadData.cargoType || loadInfo.cargoType || 'GENERAL',
          pickupLocation: loadData.pickupLocation || 'N/A',
          deliveryLocation: loadData.deliveryLocation || 'N/A',
          pickupDate: new Date(fullContract.pickupDate || loadData.pickupDate || Date.now()).toISOString().split('T')[0],
          deliveryDate: new Date(fullContract.deliveryDate || loadData.deliveryDate || Date.now()).toISOString().split('T')[0],
        },
        commission: {
          rate: fullContract.commissionRate || 0,
          amount: fullContract.commissionAmount || 0,
          paymentTerms: fullContract.paymentTerms || 'Net 30 days',
          paymentMethod: 'Bank Transfer'
        },
        contract: {
          id: fullContract.id,
          date: new Date(fullContract.createdAt || Date.now()).toISOString().split('T')[0],
          effectiveDate: new Date(fullContract.pickupDate || Date.now()).toISOString().split('T')[0],
          jurisdiction: 'Kenya'
        }
      };

      const pdf = new jsPDF();
      const contractText = generateBrokerContract(contractData);
      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(contractText, 170);
      pdf.text(lines, 20, 30);
      pdf.save(`Contract_${fullContract.id}.pdf`);
      toast.success('Contract downloaded');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const getStatusPrimeStyle = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'DELIVERED':
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'ASSIGNED': return 'bg-primary-50 text-primary-600 border-primary-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-9 md:px-10 lg:px-12 xl:px-14 space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Loads Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
            <Package size={24} className="text-[#345E85] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Loads</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.3em]">{filteredLoads.length} AVAILABLE</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4">
           <div className="h-10 w-px bg-white/10 mx-2 hidden md:block"></div>
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-primary-400">{filteredLoads.filter(l => l.status === 'ASSIGNED').length}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Assigned</p>
           </div>
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-emerald-400">{filteredLoads.filter(l => l.status === 'COMPLETED').length}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Closed</p>
           </div>
           <button 
             onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
             className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all backdrop-blur-xl"
           >
             {viewMode === 'card' ? <Table size={18} /> : <Grid size={18} />}
           </button>
        </div>
      </div>

      {/* Pipeline Master Control */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm flex flex-col lg:flex-row gap-8 relative group overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search Load ID or Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:shadow-xl transition-all outline-none placeholder:text-slate-300 dark:bg-slate-800/50 dark:text-white"
          />
        </div>
        <div className="flex gap-4">
          <FilterSelect
            label="Stage"
            icon={<Clock className="text-primary-600" size={16} />}
            value={statusFilter}
            placeholder="All Stages"
            options={[
              { value: '', label: 'All Loads' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'COMPLETED', label: 'Delivered' },
            ]}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Load Stream */}
      {filteredLoads.length === 0 ? (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 p-48 text-center space-y-8 shadow-sm opacity-50 dark:bg-slate-900 dark:border-slate-800">
          <Package className="w-24 h-24 text-slate-100 mx-auto" />
          <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed">System scan complete. No loads in pipeline matching criteria.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredLoads.map((load) => {
            const contract = contracts.get(load.id);
            return (
              <div key={load.id} className="group bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800">
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <span className={`px-4 py-2 text-xs font-bold uppercase rounded-xl border shadow-sm ${getStatusPrimeStyle(load.status)}`}>
                      {load.status.replace('_', ' ')}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm dark:bg-slate-800/50">
                      <Activity size={18} />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-4 line-clamp-2 min-h-[3rem] dark:text-white">{load.title}</h3>
                  
                  <div className="space-y-4 mb-10 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center justify-between">
                       <p className="text-sm font-bold text-slate-400 uppercase">Rate</p>
                       <p className="text-lg font-bold text-slate-900 dark:text-white">{fmtMoney(load.loadValue ?? 0)}</p>
                    </div>
                    {load.brokerCommissionRate && (
                       <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-primary-400 uppercase">Yield</p>
                          <p className="text-lg font-bold text-primary-600">+{load.brokerCommissionRate}%</p>
                       </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4 mb-10 group-hover:bg-slate-900 group-hover:text-white transition-all dark:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      <p className="text-sm font-bold uppercase truncate">{load.pickupLocation}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                      <p className="text-sm font-bold uppercase truncate">{load.deliveryLocation}</p>
                    </div>
                  </div>
                </div>

                {contract && contract.status === 'PENDING_BROKER_ACCEPTANCE' && (
                  <div className="mb-8 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <AlertCircle className="text-amber-500" size={18} />
                        <p className="text-sm font-bold uppercase text-amber-900 tracking-tight">Contract Pending</p>
                     </div>
                     <button onClick={() => handleViewContract(load.id)} className="px-6 py-2 bg-amber-600 text-white text-xs font-bold uppercase rounded-xl">Review</button>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                  <button onClick={() => handleDownloadContract(load.id)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all dark:bg-slate-800/50"><Download size={18} /></button>
                  <button onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl shadow-primary-900/10 hover:-translate-y-1 transition-all flex items-center gap-2">
                    <Eye size={14} /> Full View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-8 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-50 dark:border-slate-800/50">Carrier Payload</th>
                <th className="px-10 py-8 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-50 dark:border-slate-800/50">Route Details</th>
                <th className="px-10 py-8 text-right text-xs font-bold text-slate-400 uppercase border-b border-slate-50 dark:border-slate-800/50">Yield Index</th>
                <th className="px-10 py-8 text-right text-xs font-bold text-slate-400 uppercase border-b border-slate-50 dark:border-slate-800/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLoads.map((load) => (
                <tr key={load.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}>
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm dark:bg-slate-900 dark:border-slate-800">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 uppercase italic dark:text-white">{load.title}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">#{load.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-4 text-sm font-bold text-slate-600 uppercase opacity-60 group-hover:opacity-100 transition-all dark:text-slate-300">
                       <span>{load.pickupLocation}</span>
                       <ArrowRight size={10} />
                       <span>{load.deliveryLocation}</span>
                    </div>
                  </td>
                  <td className="px-10 py-10 text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{fmtMoney(load.loadValue ?? 0)}</p>
                    {load.brokerCommissionRate && <p className="text-xs font-bold text-primary-500 uppercase">Comm: {load.brokerCommissionRate}%</p>}
                  </td>
                  <td className="px-10 py-10 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={(e) => { e.stopPropagation(); handleDownloadContract(load.id); }} className="p-4 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-primary-600 hover:text-white transition-all dark:bg-slate-900 dark:border-slate-800"><Download size={16} /></button>
                       <button className="p-4 bg-slate-900 text-white rounded-xl shadow-xl transition-all dark:bg-slate-950"><Eye size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showContractModal && selectedContract && (
        <ContractAcceptanceModal
          isOpen={showContractModal}
          onClose={() => { setShowContractModal(false); setSelectedContract(null); }}
          contractId={selectedContract.id}
          onContractAccepted={handleAcceptContract}
        />
      )}
    </div>
  );
};

export default BrokerLoadsPage;
